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
  // res.redirect(`/${uuidV4()}`); //random roomId
  res.render("room");
});

app.get("/:roomId", (req, res) => {
  // render view "room"
  res.render("room", { roomId: req.params.roomId }); //send roomId to client
});

server.listen(process.env.PORT || 8081, function () {
  //server port
  console.log("Listening on " + server.address().port);
});

server.stageOpened = false; //true: normal users can get on the stage; false: just the tutor can
io.on("connection", function (socket) {
  io.emit("initial-stage-status", server.stageOpened); //update current state of the stage for all new connected player
  console.log("socket id: ", socket.id);
  //socket used to establish the connection
  socket.on("newplayer", function (uid, name, rolle) {
    console.log("player " + uid + " connected");
    socket.player = {
      id: uid,
      x: randomInt(140, 150),
      y: randomInt(120, 130),
      t: false,
      r: parseInt(rolle),
      n: name,
    };
    socket.emit("allplayers", getAllPlayers()); //send to the new player the list of already connected players
    socket.broadcast.emit("newplayer", socket.player);
    socket.on("click", function (data) {
      // console.log("click to " + data.x + ", " + data.y);
      socket.player.x = data.x;
      socket.player.y = data.y;
      io.emit("move", socket.player);
    });
    socket.on("move-player", function (uid, x, y) {
      socket.to(uid).emit("move-player", x, y);
    });
    socket.on("stage-status-changed", function (stageOpenedForEveryone) {
      server.stageOpened = stageOpenedForEveryone;
      socket.broadcast.emit("stage-status-changed", stageOpenedForEveryone);
    });
    socket.on("disconnect", function () {
      //io.emit(), which sends a message to all connected clients. We send the message 'remove', and send the id of the disconnected player to remove.
      io.emit("remove", socket.player.id);
    });

    socket.on("kick", function (name) {
      var data = getAllPlayers();
      for (var i = 0; i < data.length; i++) {
          if (data[i].n == name){
            io.emit("remove", data[i].id);
          }
      }
    });

    socket.on("tint", function () {
      socket.player.t = !socket.player.t;
      io.emit("tint", socket.player);
    });
  });
  socket.on("join-room", function (roomId, uid) {
    socket.join(roomId); //audio video and the game are separate rooms
    socket.to(roomId).broadcast.emit("join-room", socket.player); //broadcast new player info to all other players
  });
  socket.on("tutor-on-stage", function (tutor, tutand) {
    socket.to(tutor).emit("call-tutand", tutand);
  });
  socket.on("leave-room", function (roomId, uid) {
    //leave room
    socket.leave(roomId);
    if (roomId == 10) {
      socket.broadcast.emit("user-left", roomId, uid);
    } else socket.to(roomId).emit("user-left", roomId, uid);
  });
  socket.on("call-closed", function (u1, u2, callReceived) {
    //u1: person who hanged up => inform u2 that u1 hanged up
    io.to(u2).emit("call-closed", u1, callReceived);
  });
  socket.on("test", function () {
    console.log("test received");
  });
  
  socket.on('new message', function (name, message) {
    // Sende die Nachricht an alle Clients
    socket.broadcast.emit('new message', name, message);
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
