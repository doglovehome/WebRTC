let peerConnection;

const config = {
  iceServers: [
    {
      url:'stun:stun.l.google.com:19302'
    },
  ]
};

const socket = io.connect(window.location.origin);
const video = document.querySelector("video");
const enableAudioButton = document.querySelector("#enable-audio");

enableAudioButton.addEventListener("click", enableAudio)

socket.on("offer", (id, description) => {

    peerConnection = new RTCPeerConnection(config);
    peerConnection
      .setRemoteDescription(description)
      .then(() => peerConnection.createAnswer())
      .then(sdp => peerConnection.setLocalDescription(sdp))
      .then(() => {
          socket.emit("answer", id, peerConnection.localDescription);
      });
    peerConnection.ontrack = event => {
      video.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        socket.emit("candidate", id, event.candidate);
      }
    };
});

//รับข้อมูล candidate จาก broadcast เพื่อเชื่อมต่อ
socket.on("candidate", (id, candidate) => {

  console.log(candidate)

  peerConnection
    .addIceCandidate(new RTCIceCandidate(candidate))
    .catch(e => console.error(e));

});

socket.on("connect", () => {
    console.log("connected")
    socket.emit("watcher");
});

socket.on("broadcaster", () => {
    console.log("broadcaster")
    
    socket.emit("watcher");
});


window.onunload = window.onbeforeunload = () => {
    socket.close();
    peerConnection.close();
};

//เปิดเสียง
function enableAudio() {
    console.log("Enabling audio")
    video.muted = false;
}