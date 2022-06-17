/*creat server*/
var express = require("express");
var app = express();
var server = require("http").Server(app);
/** */

/**socket.io recognize our server */
var io = require("socket.io").listen(server);
/** */

const { v4: uuidV4 } = require("uuid");

/**set up express server */
app.set("view engine", "ejs");
app.use("/css", express.static(__dirname + "/css"));
app.use("/js", express.static(__dirname + "/js"));
app.use("/assets", express.static(__dirname + "/assets"));
/** */

/**Routing */
app.get("/", (req, res) => {
  res.redirect(`/${uuidV4()}`); //random roomId
});

app.get("/:room1", (req, res) => {
  // render view "room"
  res.render("room", { roomId: req.params.room1 }); //send roomId to client
});

server.listen(process.env.PORT || 8081, function () {
  //server port
  console.log("Listening on " + server.address().port);
});

io.on("connection", function (socket) {
  //socket used to establish the connection
  socket.on("join-room", function (roomId, uid) {
    socket.join(roomId); //audio video and the game are separate rooms
    console.log("player " + uid + " connected");
    socket.player = {
      id: uid,
      x: randomInt(100, 100),
      y: randomInt(100, 100),
      t: false,
      r: 3,
    };

    socket.emit("allplayers", getAllPlayers()); //send to the new player the list of already connected players
    socket.to(roomId).broadcast.emit("join-room", socket.player); //broadcast new player info to all other players

    socket.on("click", function (data) {
      // console.log("click to " + data.x + ", " + data.y);
      socket.player.x = data.x;
      socket.player.y = data.y;
      io.emit("move", socket.player);
    });

    socket.on("disconnect", function () {
      //io.emit(), which sends a message to all connected clients. We send the message 'remove', and send the id of the disconnected player to remove.
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
