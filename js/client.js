var Client = {};
Client.socket = io.connect(); // server connection initiated
const videoGrid = document.getElementById("video-grid");
const myPeer = new Peer(undefined, {
  host: "/",
  port: "3002",
}); //connects user to peer server, which takes all WebRTC infos for a user and turn into userId
const myVideo = document.createElement("video");
myVideo.muted = true;
const peers = {};
let myStream = null;

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myStream = stream;
    addVideoStream(myVideo, stream);
    myPeer.on("call", (call) => {
      //listen and answer to the call
      call.answer(stream); //answer the call by sending them our current stream
      const video = document.createElement("video");
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
    Client.socket.emit("newplayer", uid); //send event to server
  });
};

Client.sendClick = function (x, y) {
  Client.socket.emit("click", { x: x, y: y });
};

Client.socket.on("newplayer", function (data) {
  console.log("New User Connected: " + data.id);
  Game.addNewPlayer(data.id, data.x, data.y, data.t, data.r);
  const fc = () => connectToNewUser(data.id, myStream); //send current stream to new user
  timerid = setTimeout(fc, 1000);
});
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream); //call user with userId and send our stream to that user
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  }); // take in 'their' video streams
  call.on("close", () => {
    video.remove();
  });
}
Client.socket.on("allplayers", function (data) {
  for (var i = 0; i < data.length; i++) {
    console.log("all players: ", data);
    Game.addNewPlayer(data[i].id, data[i].x, data[i].y, data[i].t, data[i].r);
  }

  Client.socket.on("move", function (data) {
    Game.movePlayer(data.id, data.x, data.y);
  });

  Client.socket.on("remove", function (id) {
    Game.removePlayer(id);
  });
});
