var Game = {};
Game.tutor = null;
Game.tutorIsOnStage = false;
Game.init = function () {
  //will make the game keep reacting to messages from the server even when the game window doesn’t have focus
  game.stage.disableVisibilityChange = true;
};

Game.preload = function () {
  game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
  game.scale.setMinMax(320, 320, 700, 700);
  //assets laden
  game.load.tilemap(
    "map",
    "assets/map/example_map.json",
    null,
    Phaser.Tilemap.TILED_JSON
  );
  game.load.spritesheet("tileset", "assets/map/tilesheet.png", 16, 16);
  game.load.image("m", "assets/sprites/m.png");
  game.load.image("f", "assets/sprites/f.png");
  game.load.image("d", "assets/sprites/d.png");
  game.load.image("t", "assets/sprites/t.png");
};

Game.create = function () {
  game.physics.startSystem(Phaser.Physics.ARCADE);
  Game.playerMap = {}; //this empty object will be useful later on to keep track of players.
  var testKey = game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
  testKey.onDown.add(Client.sendTest, this);
  var map = game.add.tilemap("map");
  map.addTilesetImage("tilesheet", "tileset"); // tilesheet is the key of the tileset in map's JSON file
  var layer;
  for (var i = 0; i < map.layers.length; i++) {
    layer = map.createLayer(i);
  }
  layer.inputEnabled = true; // Allows clicking on the map ; it's enough to do it on the last layer
  Game.nameText = {}; //Displays Player Name
  Game.z = {}; //zugeordneter Raum
  layer.events.onInputUp.add(Game.getCoordinates, this); //position of the player who clicked can be updated for everyone
  let person = prompt("Bitte Namen eingeben", "Name");
  let rolle = prompt("Bitte Rolle eingeben", "0-3");
  Client.askNewPlayer(person, rolle); //client will notify the server that a new player should be created
};

Game.getCoordinates = function (layer, pointer) {
  //send Coordinates to Client
  //look at create
  Client.sendClick(pointer.worldX, pointer.worldY);
};

Game.addNewPlayer = function (id, x, y, t, r, n) {
  switch (
    r //loads sprite according to role
  ) {
    case 0:
      Game.playerMap[id] = game.add.sprite(x, y, "f");
      break;
    case 1:
      Game.playerMap[id] = game.add.sprite(x, y, "m");
      break;
    case 2:
      Game.playerMap[id] = game.add.sprite(x, y, "d");
      break;
    case 3:
      Game.tutor = id;
      Game.playerMap[id] = game.add.sprite(x, y, "t");
      break;
    default:
      Game.playerMap[id] = game.add.sprite(x, y, "d");
  }

  game.physics.enable(Game.playerMap[id]);
  Game.playerMap[id].body.collideWorldBounds = true;
  if (t) {
    //updates tint on load
    Game.playerMap[id].tint = 0xff0000;
  } else {
    Game.playerMap[id].tint = 0xffffff;
  } //save tint setting

  Game.z[id] = Game.returnRoom(x, y); //updates current video zone

  Game.nameText[id] = game.add.text(x, y + 16, n, {
    //display player name
    fontSize: "8px",
    fill: "#000",
  });

  if (
    Client.getCurrentUser() != id &&
    Game.tutor == id &&
    Game.returnRoom(x, y) == 10
  ) {
    Client.socket.emit("tutor-on-stage", id, Client.getCurrentUser()); //when tutor enter the stage then send the tutor our id
    Game.tutorIsOnStage = true;
    console.log("tutor on stage");
  }
};

Game.movePlayer = function (id, x, y) {
  x -= 8;
  y -= 8;
  //moves players and changes room if x and y fall into positions
  // console.log("Aktueller Raum ", Game.z[id]);
  var player = Game.playerMap[id];
  var name = Game.nameText[id]; //Text must move too
  var distance = Phaser.Math.distance(player.x, player.y, x, y);
  var tween = game.add.tween(player);
  var tweenn = game.add.tween(name);
  var duration = distance * 3;
  tween.to({ x: x, y: y }, duration);
  tweenn.to({ x: x, y: y + 16 }, duration);
  tween.start();
  tweenn.start();

  /**establish calls based on location */
  // console.log("Game.returnRoom(x, y): ", Game.returnRoom(x, y));
  // console.log("Client.getCurrentUser() != id: ", Client.getCurrentUser() != id);
  // console.log("Game.tutor == id: ", Game.tutor == id);
  // console.log(
  //   "Game.roomChanged(Game.z[id], Game.returnRoom(x, y): ",
  //   Game.roomChanged(Game.z[id], Game.returnRoom(x, y))
  // );
  if (Game.roomChanged(Game.z[id], Game.returnRoom(x, y))) {
    if (
      Game.returnRoom(x, y) == 10 &&
      Client.getCurrentUser() != Game.tutor &&
      Game.tutor == id
    ) {
      Game.tutorIsOnStage = true;
      console.log("tutor on stage");
      Client.socket.emit("tutor-on-stage", id, Client.getCurrentUser()); //when tutor enter the stage then send the tutor our id
    }

    if (Client.getCurrentUser() == id) {
      Client.socket.emit("leave-room", Game.z[id], id); //leave old room
      console.log("Ich hab den Raum gewechselt zu: " + Game.returnRoom(x, y)); // hier client aufrufen
      if (Game.returnRoom(x, y) > 0 && Game.returnRoom(x, y) < 6)
        Client.socket.emit("join-room", Game.returnRoom(x, y), id); //...join new room
    }
    Game.z[id] = Game.returnRoom(x, y);
  }
  /** */
};

Game.removePlayer = function (id) {
  // pretty clear
  Game.playerMap[id].destroy();
  delete Game.playerMap[id];
  Game.nameText[id].destroy();
  delete Game.nameText[id];
};

Game.returnRoom = function (x, y) {
  //identifies room through x n' y
  if (x >= 112 && x < 208 && y >= 32 && y < 80) {
    return 10;
  }
  if (x >= 208 && x < 320 && y >= 112 && y < 160) {
    return 1;
  } else if (x >= 208 && x < 320 && y >= 160 && y < 208) {
    return 2;
  } else if (x >= 208 && x < 320 && y >= 208 && y < 256) {
    return 3;
  } else {
    return 0;
  }
};

Game.roomChanged = function (z1, z2) {
  //change room only when leaving another
  if (z1 == z2) {
    return false;
  } else {
    return true;
  }
};

Game.tintPlayer = function (id, t) {
  //dynamic tint: even if not on load
  if (t) {
    Game.playerMap[id].tint = 0xff0000;
  } else {
    Game.playerMap[id].tint = 0xffffff;
  } //save tint setting
};
