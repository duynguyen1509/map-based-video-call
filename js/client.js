var Client = {};
Client.socket = io.connect();
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {}); //connects user to peer server, which takes all WebRTC infos for a user and turn into userId
const myVideo = document.createElement("video");
myVideo.muted = true;
let myStream = null;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myStream = stream;
    addVideoStream(myVideo, stream);
    //TODO: answer call on collision event
    myPeer.on("call", (call) => {
      console.log("call received", call);
      //listen and answer to the call
      call.answer(stream); //answer the call by sending them our current stream
      const video = document.createElement("video");
      video.setAttribute("id", call.peer);
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      }); // take in 'their' video streams
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
    // Client.socket.emit("newplayer", uid); //send event to server
    console.log(ROOM_ID);
    Client.socket.emit("join-room", ROOM_ID, uid); //send event to server
  });
};

Client.sendClick = function (x, y) {
  Client.socket.emit("click", { x: x, y: y });
};

Client.socket.on("join-room", function (data) {
  console.log("New User Connected: " + data.id);
  Game.addNewPlayer(data.id, data.x, data.y);
  setTimeout(() => {
    connectToNewUser(data.id, myStream); //send current stream to new user
  }, 1000);
});
function connectToNewUser(userId, stream) {
  console.log("call user ", userId);
  const call = myPeer.call(userId, stream); //call user with userId and send our stream to that user
  const video = document.createElement("video");
  video.setAttribute("id", userId);
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  }); // take in 'their' video streams
  call.on("close", () => {
    console.log(123);
    video.remove();
  });
}
Client.socket.on("allplayers", function (data) {
  console.log("all players: ", data);
  for (var i = 0; i < data.length; i++) {
    Game.addNewPlayer(data[i].id, data[i].x, data[i].y);
  }

  Client.socket.on("move", function (data) {
    Game.movePlayer(data.id, data.x, data.y);
  });

  Client.socket.on("remove", function (id) {
    console.log("user: " + id + " disconnected!");
    if (document.getElementById(id)) document.getElementById(id).remove();
    Game.removePlayer(id);
  });
});
