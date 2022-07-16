var Game = {};
Game.tutor = "";
Game.isOnStage = {};
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
  Game.login();
  game.physics.startSystem(Phaser.Physics.ARCADE);
  Game.playerMap = {}; //this empty object will be useful later on to keep track of players.
  Game.name = {}; //object to retrieve Name of player in chat
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
  // let person = prompt("Bitte Namen eingeben", "Name");
  // let rolle = prompt("Bitte Rolle eingeben", "0-3");
  // Client.askNewPlayer(person, rolle); //client will notify the server that a new player should be created
};

Game.getCoordinates = function (layer, pointer) {
  //send Coordinates to Client
  //look at create
  Client.sendClick(pointer.worldX, pointer.worldY);
};

Game.addNewPlayer = async function (id, x, y, t, r, n) {
  let room = await Game.returnRoom(x, y);
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

  Game.z[id] = room; //updates current video zone
  console.log("default room: ", room);
  if (id == Client.getCurrentUser() && room == 4)
    Client.socket.emit("join-room", room, id);
  Game.name[id] = n;
  Game.nameText[id] = game.add.text(x, y + 16, n, {
    //display player name
    fontSize: "8px",
    fill: "#000",
  });

  if (Client.getCurrentUser() != id && room == 10) {
    Client.socket.emit("tutor-on-stage", id, Client.getCurrentUser()); //when someone enter the stage then send them our id
    Game.isOnStage[id] = true;
    // console.log("tutor on stage");
  }
};

Game.movePlayer = async function (id, x, y) {
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
  let room = await Game.returnRoom(x, y);
  if (!Game.stageOpenedForEveryone && id != Game.tutor && room == 10) {
    //if the stage is locked by tutor then no one can access it except for the tutor
    if (x >= 160) x = 218;
    if (x < 160) x = 80;
    if (y >= 56) y = 90;
    if (y < 56) y = 22;
  } //Room 10: x >= 112 && x < 208 && y >= 32 && y < 80
  tween.to({ x: x, y: y }, duration);
  tweenn.to({ x: x, y: y + 16 }, duration);
  tween.start();
  tweenn.start();

  /**establish calls based on location */
  if (Game.roomChanged(Game.z[id], room)) {
    if (Client.getCurrentUser() != id && room == 10) {
      //check if other player get on the stage
      Game.isOnStage[id] = true;
      console.log(`Game.isOnStage[${id}]: `, Game.isOnStage[id]);
      Client.socket.emit("tutor-on-stage", id, Client.getCurrentUser()); //when someone enter the stage then send them our id
    }

    if (Client.getCurrentUser() == id) {
      //check if currentUser change room
      Client.socket.emit("leave-room", Game.z[id], id); //leave old room
      // console.log("Ich hab den Raum gewechselt zu: " +room); // hier client aufrufen
      if (room > 0 && room < 6) Client.socket.emit("join-room", room, id); //...join new room
    }
    Game.z[id] = room;
  }
  /**establish calls based on location */
};

Game.removePlayer = function (id) {
  // pretty clear
  Game.playerMap[id].destroy();
  delete Game.playerMap[id];
  Game.nameText[id].destroy();
  delete Game.nameText[id];
};

Game.returnRoom = async function (x, y) {
  var mode = await Client.getMode();
  // console.log("mode: ", mode);
  switch (mode) {
    case 1:
      if (x >= 112 && x < 208 && y >= 32 && y < 80) {
        console.log("Wiedergabe 10");
        return 10; //bühne
      }
      if (x >= 272 && x < 304 && y >= 32 && y < 80) {
        return 11; //fragebereich
      } else {
        console.log("Wiedergabe 0");
        return 0;
      }
    case 2:
      //identifies room through x n' y
      if (x >= 112 && x < 208 && y >= 32 && y < 80) {
        return 10; //bühne
      }
      if (x >= 272 && x < 304 && y >= 32 && y < 80) {
        return 11; //fragebereich
      }
      if (x > 208 && x <= 320 && y >= 96 && y <= 144) {
        console.log("Raum 1 betreten");
        return 1;
      } else if (x > 208 && x <= 320 && y > 144 && y <= 192) {
        console.log("Raum 2 betreten");
        return 2;
      } else if (x > 208 && x <= 320 && y > 192 && y <= 240) {
        console.log("Raum 3 betreten");
        return 3;
      } else {
        return 0;
      }
    case 3:
      return 4;
    default:
      return 1;
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

Game.returnName = function (id) {
  return Game.name[id];
};

Game.tintPlayer = function (id, t) {
  //dynamic tint: even if not on load
  if (t) {
    Game.playerMap[id].tint = 0xff0000;
  } else {
    Game.playerMap[id].tint = 0xffffff;
  } //save tint setting
};

Game.login = function () {
  let myModal = new bootstrap.Modal(document.getElementById("myModal"), {});
  myModal.show();
};

Game.loginRole = function () {
  var name = document.getElementById("email").value;
  var pw = document.getElementById("pwd").value;
  console.log(pw);
  var role;

  if (pw == "Tutor") {
    //tutor loggt sich ein
    role = 3;
    console.log(name + "modalworks: " + role);
    Client.askNewPlayer(name, role);
    Client.addTutorButtons();
  } else if (pw == "Tutand") {
    let modal2 = new bootstrap.Modal(document.getElementById("modal2"), {});
    modal2.show();
  } else {
    alert("Falscher Room-Key");
    Game.login();
  }
};

Game.loginTutand = function () {
  var name = document.getElementById("email").value;
  var role;
  if (document.getElementById("radio1").checked) {
    role = 0;
  } else if (document.getElementById("radio2").checked) {
    role = 1;
  } else {
    role = 2;
  }
  console.log(name + "tutandworks: " + role);
  Client.askNewPlayer(name, role); //Tutand loggt sich ein
};
