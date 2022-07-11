var Client = {};
Client.socket = io.connect();
let myPeer;
Client.socket.on("connect", () => {
  myPeer = new Peer(Client.socket.id, {});
  myPeer.on("open", (uid) => {
    currentUser = uid;
  });
});
document.getElementById("myForm").style.display = "none"; // pop-up chat
const videoGrid = document.getElementById("video-grid");
// const myPeer = new Peer(undefined, {}); //connects user to peer server, which takes all WebRTC infos for a user and turn into userId
const myVideo = document.createElement("video");
const button_group = document.getElementById("btn-group");
const button_group2 = document.getElementById("btn-group2");
myVideo.muted = true;
let myStream, captureStream; //myStream: Video-,Audiostream ; captureStream: screen sharing stream
let currentUser = null;
// const peers = {};
const callsTo = {};
const callsFrom = {};
let currentRoom = 0;
let screenSharer;

Client.getCurrentUser = function () {
  return currentUser;
};
Client.socket.on("initial-stage-status", function (stageStatus) {
  console.log("stageStatus: ", stageStatus);
  Game.stageOpenedForEveryone = stageStatus;
});
Client.socket.on("initial-screen-sharer", function (sharer) {
  screenSharer = sharer;
});
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

    var handup = document.createElement("button");
    handup.classList.add("btn", "btn-primary");
    handup.innerHTML = "Melden";
    button_group.appendChild(handup);
    handup.onclick = function () {
      Client.setTint();
    };

    myPeer.on("call", (call) => {
      console.log("call received", call);
      if (call.metadata) {
        //show shared screen
        callsFrom[call.metadata] = call;
        call.answer();
        const video = document.createElement("video");
        call.on("stream", (captureStream) => {
          video.srcObject = captureStream;
          video.addEventListener("loadedmetadata", () => {
            video.play();
          });
          const screenShare = document.getElementById("screen-container");
          screenShare.append(video);
        });
        Client.socket.on("screen-share-ended", function () {
          callsFrom[call.metadata].close();
          video.remove();
        });
      } else {
        callsFrom[call.peer] = call;
        // console.log("peers: ", peers);
        console.log("callsFrom: ", callsFrom);
        //listen and answer to the call
        const video = document.createElement("video");
        if (Game.isOnStage[call.peer]) {
          call.answer(); //answer the call from player(s) on stage w/o sending stream back
        } else call.answer(stream); //answer the call by sending them our current stream
        if (call.peer == Game.tutor) {
          video.classList.add("tutor-video");
        }
        call.on("stream", (userVideoStream) => {
          addVideoStream(video, userVideoStream);
        }); // take in 'their' video streams
        call.on("close", () => {
          video.remove();
          Client.socket.emit("call-closed", currentUser, call.peer, true); //currentUser:callee, call.peer:caller, isCallReceived:boolean
        });
      }
    });
  });
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}
function removePlayersFromStage() {
  //remove users form stage except for the tutor
  for (const uid in Game.z) {
    if (uid != Game.tutor && Game.z[uid] == 10) {
      Client.socket.emit("move-player", uid, 145, 125);
    }
  }
}
// pop-up chat
function openForm() {
  document.getElementById("myForm").style.display = "block";
}

function closeForm() {
  document.getElementById("myForm").style.display = "none";
  document.getElementById("chatbutton").style.backgroundColor = "#555";
}

function sendMessage() {
  var message = document.getElementById("inputMessage").value;
  var name = Game.returnName(Client.getCurrentUser());
  document.getElementById("inputMessage").value = "";
  Client.socket.emit("new message", name, message);
  // Create a p element:
  const para = document.createElement("p");
  // Create a text node:
  const node = document.createTextNode(name + ": " + message);
  // Append text node to the p element:
  para.appendChild(node);
  // Append the p element to the body:s
  document.getElementById("messages").appendChild(para);
}

Client.socket.on("move-player", function (x, y) {
  Client.socket.emit("click", { x: x, y: y });
});
Client.socket.on("stage-status-changed", function (stageOpenedForEveryone) {
  Game.stageOpenedForEveryone = stageOpenedForEveryone;
});
Client.sendTest = function () {
  console.log("test sent");
  Client.socket.emit("test");
};

Client.askNewPlayer = function (n, r) {
  Client.socket.emit("newplayer", currentUser, n, r); //trigger new player event
  console.log(`newplayer: ${currentUser}; role: ${r}; name: ${n}`);

  //after log in success
  console.log("sharer: ", screenSharer);
  if (screenSharer != null)
    Client.socket.emit("send-id-to-sharer", screenSharer, currentUser);
};

Client.sendClick = function (x, y) {
  Client.socket.emit("click", { x: x, y: y });
};

Client.setTint = function () {
  Client.socket.emit("tint");
};

Client.socket.on("newplayer", function (data) {
  console.log("New User Connected: " + data.id);
  Game.addNewPlayer(data.id, data.x, data.y, data.t, data.r, data.n);
});
Client.socket.on("join-room", function (player) {
  console.log("User " + player.id + " joined room");
  setTimeout(() => {
    connectToNewUser(player.id, myStream); //send current stream to new user (peerJS)
  }, 100);
});
Client.socket.on("call-tutand", function (uid) {
  setTimeout(() => {
    connectToNewUser(uid, myStream); //send current stream to the tutand
  }, 100);
});

Client.socket.on("user-left", function (roomId, uid) {
  console.log(`user ${uid} left room ${roomId}`);
  if (roomId == 10) {
    Game.isOnStage[uid] = false;
    endCallFrom(uid);
    console.log(`${uid} left stage`);
  } else {
    endCallFrom(uid);
    endCallTo(uid);
  }
});

Client.socket.on("new message", function (name, message) {
  document.getElementById("chatbutton").style.backgroundColor = "red";
  // Create a p element:
  const para = document.createElement("p");
  // Create a text node:
  const node = document.createTextNode(name + ": " + message);
  // Append text node to the p element:
  para.appendChild(node);
  // Append the p element to the body:s
  document.getElementById("messages").appendChild(para);
});

Client.socket.on("chat", function (open) {
  if (open == false) {
    closeForm();
    document.getElementById("chatbutton").style.display = "none";
  } else {
    document.getElementById("chatbutton").style.display = "block";
  }
});

function connectToNewUser(userId, stream) {
  console.log("call user ", userId);
  const call = myPeer.call(userId, stream); //call user with userId and send our stream to that user
  // peers[userId] = call;
  callsTo[userId] = call;
  // console.log("peers: ", peers);
  console.log("callsTo: ", callsTo);
  const video = document.createElement("video");
  if (userId == Game.tutor) {
    video.classList.add("tutor-video");
  }
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream);
  }); // take in 'their' video streams
  call.on("close", () => {
    video.remove();
    Client.socket.emit("call-closed", currentUser, userId, false); //currentUser:caller, userId:callee, callReceived:boolean
  });
}

// function endCall(uid){
//     if (peers[uid]) {
//     peers[uid].close();
//     console.log(`call ${peers[uid].connectionId} with ${uid} ended`);
//   }
// }
function endCallTo(uid) {
  if (callsTo[uid]) {
    callsTo[uid].close();
    console.log(`call to ${callsTo[uid].connectionId} with ${uid} ended`);
  }
}
function endCallFrom(uid) {
  if (callsFrom[uid]) {
    callsFrom[uid].close();
    console.log(`call from ${callsFrom[uid].connectionId} with ${uid} ended`);
  }
}
Client.socket.on("call-closed", function (uid, callReceived) {
  // endCall(uid);
  if (callReceived) endCallTo(uid);
  else endCallFrom(uid);
});
Client.socket.on("allplayers", function (data) {
  console.log("all players: ", data);
  for (var i = 0; i < data.length; i++) {
    Game.addNewPlayer(
      data[i].id,
      data[i].x,
      data[i].y,
      data[i].t,
      data[i].r,
      data[i].n
    );
  }

  Client.socket.on("move", function (data) {
    Game.movePlayer(data.id, data.x, data.y);
  });

  Client.socket.on("tint", function (data) {
    console.log("tint " + data.t);
    Game.tintPlayer(data.id, data.t);
  });

  Client.socket.on("remove", function (id) {
    console.log("user: " + id + " disconnected!");
    Game.removePlayer(id);
    // endCall(id);
    endCallFrom(id);
    endCallTo(id);
    if (id == currentUser) {
      alert("Du wurdest aus dem Tutorium entfernt");
      document.getElementById("myForm").style.display = "none";
      document.getElementById("chatbutton").style.display = "none";
    }
  });
});

Client.addTutorButtons = function () {
  var openOrLockStage = document.createElement("button");
  openOrLockStage.classList.add("btn", "btn-primary");
  openOrLockStage.innerHTML = Game.stageOpenedForEveryone
    ? "Bühne sperren"
    : "Bühne freigeben";
  button_group2.appendChild(openOrLockStage);
  openOrLockStage.onclick = function () {
    Game.stageOpenedForEveryone = !Game.stageOpenedForEveryone;
    openOrLockStage.innerHTML = Game.stageOpenedForEveryone
      ? "Bühne sperren"
      : "Bühne freigeben";
    Client.socket.emit("stage-status-changed", Game.stageOpenedForEveryone);
    console.log("Game.stageOpenedForEveryone: ", Game.stageOpenedForEveryone);
    removePlayersFromStage();
  };

  var kick = document.createElement("button");
  kick.classList.add("btn", "btn-primary");
  kick.innerHTML = "Kicken";
  button_group2.appendChild(kick);
  kick.onclick = function () {
    let kicked = prompt("Bitte Namen eingeben", "Name");
    Client.socket.emit("kick", kicked);
  };

  var chat = document.createElement("button");
  chat.classList.add("btn", "btn-primary");
  chat.innerHTML = "Chat (de-)aktivieren";
  button_group2.appendChild(chat);
  chat.onclick = function () {
    Client.socket.emit("chat");
  };

  var screenShare = document.createElement("button");
  screenShare.classList.add("btn", "btn-primary");
  screenShare.innerHTML = "Bildschirm teilen";
  button_group2.appendChild(screenShare);
  screenShare.onclick = function () {
    shareScreen();
  };
};

const shareScreen = async () => {
  captureStream = await getLocalScreenCaptureStream();
  console.log("screen shared");
  Client.socket.emit("screen-shared", currentUser); //inform others that I shared my screen
  // somebody clicked on "Stop sharing"
  captureStream.getVideoTracks()[0].onended = function () {
    Client.socket.emit("screen-share-ended");
  };
};
Client.socket.on("screen-shared", function (sharer) {
  Client.socket.emit("send-id-to-sharer", sharer, currentUser); //send my id to the sharer
});
Client.socket.on("send-id-to-sharer", function (reveicer) {
  console.log("receiver: ", reveicer);
  myPeer.call(reveicer, captureStream, { metadata: "screen-share" });
});
const getLocalScreenCaptureStream = async () => {
  try {
    const constraints = { video: { cursor: "always" }, audio: false };
    const screenCaptureStream = await navigator.mediaDevices.getDisplayMedia(
      constraints
    );

    return screenCaptureStream;
  } catch (error) {
    console.error("failed to get local screen", error);
  }
};
