var Client = {};
Client.socket = io.connect();
let myPeer = null;
Client.socket.on("connect", () => {
  myPeer = new Peer(Client.socket.id, {});
});
const videoGrid = document.getElementById("video-grid");
// const myPeer = new Peer(undefined, {}); //connects user to peer server, which takes all WebRTC infos for a user and turn into userId
const myVideo = document.createElement("video");
const button_group = document.getElementById("btn-group");
myVideo.muted = true;
let myStream = null;
let currentUser = null;
const peers = {};
let currentRoom = 0;

Client.getCurrentUser = function () {
  return currentUser;
};
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myStream = stream;
    addVideoStream(myVideo, stream);
    myStream.getAudioTracks()[0].enabled = false;
    /**Audio und Video an unnd ausmachen */
    var video_button = document.createElement("button");
    video_button.classList.add("btn", "btn-primary");
    video_button.innerHTML = "Kamera ausmachen";
    button_group.appendChild(video_button);

    video_button.onclick = function () {
      myStream.getVideoTracks()[0].enabled =
        !myStream.getVideoTracks()[0].enabled;
      video_button.innerHTML = myStream.getVideoTracks()[0].enabled
        ? "Kamera ausmachen"
        : "Kamera anmachen";
    };

    var audio_button = document.createElement("button");
    audio_button.classList.add("btn", "btn-primary");
    audio_button.innerHTML = "Audio anmachen "; //User is muted by default
    button_group.appendChild(audio_button);

    audio_button.onclick = function () {
      myStream.getAudioTracks()[0].enabled =
        !myStream.getAudioTracks()[0].enabled;
      audio_button.innerHTML = myStream.getAudioTracks()[0].enabled
        ? "Audio ausmachen"
        : "Audio anmachen";
    };

    var join_room1 = document.createElement("button");
    join_room1.classList.add("btn", "btn-primary");
    join_room1.innerHTML = "Raum 1 beitreten";
    button_group.appendChild(join_room1);
    join_room1.onclick = function () {
      if (currentRoom != 1) {
        console.log("leave room " + currentRoom + " and join room " + 1);
        Client.socket.emit("leave-room", currentRoom, currentUser); //leave current room
        Client.socket.emit("join-room", 1, currentUser); //join new room
        currentRoom = 1;
      } else console.log("stay at room " + currentRoom);
    };

    var join_room2 = document.createElement("button");
    join_room2.classList.add("btn", "btn-primary");
    join_room2.innerHTML = "Raum 2 beitreten";
    button_group.appendChild(join_room2);
    join_room2.onclick = function () {
      if (currentRoom != 2) {
        console.log("leave room " + currentRoom + " and join room " + 2);
        Client.socket.emit("leave-room", currentRoom, currentUser); //leave current room
        Client.socket.emit("join-room", 2, currentUser); //join new room
        currentRoom = 2;
      } else console.log("stay at room " + currentRoom);
    };

    myPeer.on("call", (call) => {
      console.log("call received", call);
      peers[call.peer] = call;
      console.log(peers);
      //listen and answer to the call
      call.answer(stream); //answer the call by sending them our current stream
      const video = document.createElement("video");
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      }); // take in 'their' video streams
      call.on("close", () => {
        video.remove();
        Client.socket.emit("call-closed", currentUser, call.peer); //currentUser:callee, call.peer:caller
      });
    });
  });
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
Client.sendTest = function () {
  console.log("test sent");
  Client.socket.emit("test");
};

Client.askNewPlayer = function () {
  myPeer.on("open", (uid) => {
    Client.socket.emit("newplayer", uid); //trigger new player event
    currentUser = uid;

    // console.log(ROOM_ID);
    // Client.socket.emit("join-room", ROOM_ID, uid);
  });
};

Client.sendClick = function (x, y) {
  Client.socket.emit("click", { x: x, y: y });
};
Client.socket.on("newplayer", function (data) {
  console.log("New User Connected: " + data.id);
  Game.addNewPlayer(data.id, data.x, data.y, data.t, data.r);
});
Client.socket.on("join-room", function (player) {
  console.log("User " + player.id + " joined room");
  // Game.addNewPlayer(data.id, data.x, data.y, data.t, data.r);
  setTimeout(() => {
    connectToNewUser(player.id, myStream); //send current stream to new user (peerJS)
  }, 1000);
});
Client.socket.on("user-left", function (uid) {
  console.log("user left room: ", uid);
  endCall(uid);
});

function connectToNewUser(userId, stream) {
  console.log("call user ", userId);
  const call = myPeer.call(userId, stream); //call user with userId and send our stream to that user
  peers[userId] = call;
  console.log(peers);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  }); // take in 'their' video streams
  call.on("close", () => {
    video.remove();
    Client.socket.emit("call-closed", currentUser, userId); //currentUser:caller, userId:callee
  });
}
function endCall(uid) {
  if (peers[uid]) peers[uid].close();
}
Client.socket.on("call-closed", function (uid) {
  endCall(uid);
});
Client.socket.on("allplayers", function (data) {
  console.log("all players: ", data);
  for (var i = 0; i < data.length; i++) {
    Game.addNewPlayer(data[i].id, data[i].x, data[i].y, data[i].t, data[i].r);
  }

  Client.socket.on("move", function (data) {
    Game.movePlayer(data.id, data.x, data.y);
  });

  Client.socket.on("remove", function (id) {
    console.log("user: " + id + " disconnected!");
    Game.removePlayer(id);
    endCall(id);
  });
});
