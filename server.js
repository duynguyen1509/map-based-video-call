var express = require("express");
var app = express();
var server = require("http").Server(app);
var io = require("socket.io").listen(server);

app.use("/css", express.static(__dirname + "/css"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/assets", express.static(__dirname + "/assets")); //virtuelle Pfade

app.get("/", function (req, res) { //root directory
  res.sendFile(__dirname + "/index.html");
});

// server.lastPlayderID = 0;

server.listen(process.env.PORT || 8081, function () { //server port
  console.log("Listening on " + server.address().port);
});

//bis hierhin Node.js

io.on("connection", function (socket) {
  //socket used to establish the connection
  socket.on("newplayer", function (uid) {
    console.log("player " + uid + " connected");
    socket.player = {
      id: uid, 
      x: randomInt(100, 100),
      y: randomInt(100, 100),
      t: false,
      r: 0
    };

    socket.emit("allplayers", getAllPlayers()); //send to the new player the list of already connected players..
    socket.broadcast.emit("newplayer", socket.player); //broadcast new player info to all other players

    socket.on("click", function (data) {
      // console.log("click to " + data.x + ", " + data.y);
      socket.player.x = data.x;
      socket.player.y = data.y;
      io.emit("move", socket.player); 
    });

    socket.on("disconnect", function () { //io.emit(), which sends a message to all connected clients. We send the message 'remove', and send the id of the disconnected player to remove.
      io.emit("remove", socket.player.id);
    });
  });

  socket.on("test", function () {
    console.log("test received");
  });
});

function getAllPlayers() {
  var players = [];
  Object.keys(io.sockets.connected).forEach(function (socketID) {
    var player = io.sockets.connected[socketID].player;
    if (player) players.push(player);
  });
  return players;
}

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}
