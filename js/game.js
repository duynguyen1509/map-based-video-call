var Game = {};

Game.init = function () {
  //will make the game keep reacting to messages from the server even when the game window doesn’t have focus
  game.stage.disableVisibilityChange = true;
};

Game.preload = function () {
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
  game.load.image("button", "assets/sprites/question.png");
};

Game.create = function () {
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
  Game.t = {}; //Boolean-Value for tint in handsUp function
  layer.events.onInputUp.add(Game.getCoordinates, this); //position of the player who clicked can be updated for everyone
  Client.askNewPlayer(); //client will notify the server that a new player should be created
};

Game.getCoordinates = function (layer, pointer) {
  //look at create
  Client.sendClick(pointer.worldX, pointer.worldY);
};

Game.addNewPlayer = function (id, x, y, t, r) {
  switch (r) {
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
      Game.playerMap[id] = game.add.sprite(x, y, "t");
      break;
    default:
      Game.playerMap[id] = game.add.sprite(x, y, "d");
  }
  //Meldung durch Spieler
  Game.t[id] = t; //save tint setting
  Game.nameText[id] = game.add.text(x, y + 16, "name", {
    fontSize: "8px",
    fill: "#000",
  });
};

Game.movePlayer = function (id, x, y) {
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
};

Game.removePlayer = function (id) {
  Game.playerMap[id].destroy();
  delete Game.playerMap[id];
  Game.nameText[id].destroy();
  delete Game.nameText[id];
};

Game.handsUp = function (id) {
  //add red colour to sprite
  t != t;
  if (t) {
    Game.playerMap[id].tint = 0xff0000;
  } else {
    Game.playerMap[id].tint = 0xffffff;
  }
};
