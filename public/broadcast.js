
const peerConnections = {};
const config = {
  iceServers: [
    {
      url:'stun:stun.l.google.com:19302'
    },
  ]
};

const socket = io.connect(window.location.origin);

socket.on("answer", (id, description) => {
    console.log(description)
    peerConnections[id].setRemoteDescription(description);
});

socket.on("welcome", function(data) {
    console.log(data);
});

socket.on("watcher", id => {

    const peerConnection = new RTCPeerConnection(config);
    
    peerConnections[id] = peerConnection;

    let stream = videoElement.srcObject;
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
          // console.log(event.candidate)
          socket.emit("candidate", id, event.candidate);
        }
    };

    peerConnection
        .createOffer()
        .then(sdp => peerConnection.setLocalDescription(sdp))
        .then(() => {
        socket.emit("offer", id, peerConnection.localDescription);
    });

    console.log("User id :" + id + " Is connected")
});

socket.on("candidate", (id, candidate) => {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", id => {
    peerConnections[id].close();
    delete peerConnections[id];
});

window.onunload = window.onbeforeunload = () => {
    socket.close();
};

// Get camera and microphone
const videoElement = document.querySelector("video");
const audioSelect = document.querySelector("select#audioSource");
const videoSelect = document.querySelector("select#videoSource");

audioSelect.onchange = getStream;
videoSelect.onchange = getStream;

getStream()
  .then(getDevices)
  .then(gotDevices);


//หาเลขอุปกรณ์ ในการเชิ่อมต่อ
function getDevices() {

  let mediaDevice = navigator.mediaDevices.enumerateDevices();
  console.log(mediaDevice)

  return mediaDevice;
}


//เลือกอุปกรณ์ที่ใช้ในการเชื่อมต่อ
function gotDevices(deviceInfos) {
  window.deviceInfos = deviceInfos;

  console.log(deviceInfos)

  for (const deviceInfo of deviceInfos) {

    const option = document.createElement("option");
    option.value = deviceInfo.deviceId;

    //ไมค์โครโฟน
    if (deviceInfo.kind === "audioinput") {

        option.text = deviceInfo.label || `Microphone ${audioSelect.length + 1}`;
        audioSelect.appendChild(option);

    //กล้อง
    } else if (deviceInfo.kind === "videoinput") {

        option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
        videoSelect.appendChild(option);
    }
  }
}

function getStream() {

  //เช็คการ stream ถ้ามีอยู่ให้ปิดลง
  if (window.stream) {
    window.stream.getTracks().forEach(track => {
      track.stop();
    });

    console.log("Stop Steaming")
  }

  const audioSource = audioSelect.value;
  console.log("audioSource : "+ audioSource)

  const videoSource = videoSelect.value;
  console.log("videoSource : "+ videoSource)

  const constraints = {
    // audio: { deviceId: audioSource ? { exact: audioSource } : undefined },
    // video: { deviceId: videoSource ? { exact: videoSource } : undefined }
      audio: true,
      video: false
  };

  // console.log(constraints)

  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then(gotStream)
    .catch(handleError);
}

function gotStream(stream) {

  console.log("SET select stream")
  window.stream = stream;

  audioSelect.selectedIndex = [...audioSelect.options].findIndex(
    option => option.text === stream.getAudioTracks()[0].label
  );

  videoSelect.selectedIndex = [...videoSelect.options].findIndex(
    option => option.text === stream.getVideoTracks()[0].label
  );

  videoElement.srcObject = stream;
  socket.emit("broadcaster");

}

function handleError(error) {
  console.error("Error: ", error);
}