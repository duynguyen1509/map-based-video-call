var Client = {};
Client.socket = io.connect();
let mode, myPeer, myStream, captureStream; //myStream: Video-,Audiostream ; captureStream: screen sharing stream
let currentUser = null; //currentUser ID
Client.socket.on("connect", () => {
  myPeer = new Peer(Client.socket.id, {}); //connects user to peer server with id passed from the socket
  myPeer.on("open", (uid) => {
    currentUser = uid;
  });
});
const callsTo = {};
const callsFrom = {};

document.getElementById("myForm").style.display = "none"; // pop-up chat
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const button_group = document.getElementById("btn-group");
const button_group2 = document.getElementById("btn-group2");
myVideo.muted = true;

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
    /**Audio und Video an und ausmachen */
    var video_button = document.createElement("button");
    video_button.classList.add("btn", "btn-primary");
    var videoIcon = document.createElement("span");
    videoIcon.className = myStream.getVideoTracks()[0].enabled
      ? "bi-camera-video"
      : "bi-camera-video-off";
    video_button.appendChild(videoIcon);
    button_group.appendChild(video_button);

    video_button.onclick = function () {
      myStream.getVideoTracks()[0].enabled =
        !myStream.getVideoTracks()[0].enabled;
      videoIcon = video_button.firstChild;
      videoIcon.className = myStream.getVideoTracks()[0].enabled
        ? "bi-camera-video"
        : "bi-camera-video-off";
    };

    var audio_button = document.createElement("button");
    audio_button.classList.add("btn", "btn-primary");
    var audioIcon = document.createElement("span");
    audioIcon.className = myStream.getAudioTracks()[0].enabled
      ? "bi-mic"
      : "bi-mic-mute";
    audio_button.appendChild(audioIcon);
    button_group.appendChild(audio_button);

    audio_button.onclick = function () {
      myStream.getAudioTracks()[0].enabled =
        !myStream.getAudioTracks()[0].enabled;
      audioIcon = audio_button.firstChild;
      audioIcon.className = myStream.getAudioTracks()[0].enabled
        ? "bi-mic"
        : "bi-mic-mute";
    };
    /** */
    /**Meldefunktion */
    var handup = document.createElement("button");
    handup.classList.add("btn", "btn-primary");
    var handUpIcon = document.createElement("span");
    handUpIcon.className = "bi-hand-index";
    handup.appendChild(handUpIcon);
    button_group.appendChild(handup);
    handup.onclick = function () {
      Client.setTint();
    };
    /** */

    /**answer a received call */
    myPeer.on("call", (call) => {
      console.log("call received", call);
      if (call.metadata) {
        //show shared screen
        callsFrom[call.metadata] = call;
        call.answer();
        const video = document.createElement("video");
        const screenShare = document.getElementById("screen-container");
        call.on("stream", (captureStream) => {
          video.srcObject = captureStream;
          video.addEventListener("loadedmetadata", () => {
            video.play();
          });

          const fullscreenButton = document.createElement("button");
          fullscreenButton.classList.add("btn", "btn-primary");
          var fullscreenIcon = document.createElement("span");
          fullscreenIcon.className = "bi-arrows-fullscreen";
          fullscreenButton.appendChild(fullscreenIcon);
          fullscreenButton.onclick = function () {
            if (video.requestFullscreen) {
              video.requestFullscreen();
            } else if (video.webkitRequestFullscreen) {
              /* Safari */
              video.webkitRequestFullscreen();
            } else if (video.msRequestFullscreen) {
              /* IE11 */
              video.msRequestFullscreen();
            }
          };
          screenShare.append(video, fullscreenButton);
          screenShare.style.display = "block";
        });
        //
        Client.socket.on("screen-share-ended", function () {
          callsFrom[call.metadata].close();
          video.remove();
          screenShare.removeChild(screenShare.lastChild);
          screenShare.style.display = "none";
        });
      } else {
        callsFrom[call.peer] = call;
        console.log("callsFrom: ", callsFrom);
        //listen and answer to the "normal" call
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
/** */
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
Client.socket.on("move", function (data) {
  Game.movePlayer(data.id, data.x, data.y);
});

Client.askNewPlayer = function (n, r) {
  //after log in success
  Client.socket.emit("newplayer", currentUser, n, r); //trigger new player event
  console.log(`newplayer: ${currentUser}; role: ${r}; name: ${n}`);
  Client.socket.emit("get-mode");
  Client.socket.on("mode", function (m) {
    mode = m;
    console.log("mode: ", m);
  });

  Client.socket.emit("get-stage-status");
  Client.socket.on("stage-status", function (stageStatus) {
    console.log("stageStatus: ", stageStatus);
    Game.stageOpenedForEveryone = stageStatus;
  });

  Client.socket.emit("get-screen-sharer");
  Client.socket.on("screen-sharer", function (sharer) {
    console.log("sharer: ", sharer);
    if (sharer != null) {
      Client.socket.emit("send-id-to-sharer", sharer, currentUser);
    }
  });
  Client.socket.on("send-id-to-sharer", function (reveicer) {
    console.log("receiver: ", reveicer);
    myPeer.call(reveicer, captureStream, { metadata: "screen-share" });
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

    Client.socket.on("tint", function (data) {
      console.log("tint " + data.t);
      Game.tintPlayer(data.id, data.t);
    });

    Client.socket.on("remove", function (id) {
      console.log("user: " + id + " disconnected!");
      Game.removePlayer(id);
      endCallFrom(id);
      endCallTo(id);
      if (id == currentUser) {
        alert("Du wurdest aus dem Tutorium entfernt");
        document.getElementById("myForm").style.display = "none";
        document.getElementById("chatbutton").style.display = "none";
      }
    });
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
  Client.socket.on("call-closed", function (uid, callReceived) {
    // endCall(uid);
    if (callReceived) endCallTo(uid);
    else endCallFrom(uid);
  });
};

Client.sendClick = function (x, y) {
  Client.socket.emit("click", { x: x, y: y });
};

Client.setTint = function () {
  Client.socket.emit("tint");
};

function connectToNewUser(userId, stream) {
  console.log("call user ", userId);
  const call = myPeer.call(userId, stream); //call user with userId and send our stream to that user
  callsTo[userId] = call;
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
    Client.socket.emit("set-stage-status", Game.stageOpenedForEveryone);
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

  var mode = document.createElement("button");
  mode.classList.add("btn", "btn-primary");
  mode.innerHTML = "Modus wählen";
  button_group2.appendChild(mode);
  mode.onclick = function () {
    let modal3 = new bootstrap.Modal(document.getElementById("modal3"), {});
    modal3.show();
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

Client.sendMode = function () {
  if (document.getElementById("r1").checked) {
    mode = 1;
  } else if (document.getElementById("r2").checked) {
    mode = 2;
  } else {
    mode = 3;
  }
  Client.socket.emit("setmode", mode);
};

Client.getMode = function () {
  //wait until mode is defined
  return new Promise((res, rej) => {
    var interval = setInterval(function () {
      if (typeof mode == "undefined") return;
      clearInterval(interval);
      // console.log("mode: ", mode);
      res(mode);
    }, 10);
  });
};
