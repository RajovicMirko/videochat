const socket = io("/");
const videoGrid = document.getElementById("video-grid");

console.log(PEER_HOST, PEER_PORT);

const myPeer = new Peer(undefined, {
  // secure: true,
  host: PEER_HOST,
  port: PEER_PORT,
});

const myVideo = generateVideo(true);
const peers = {};

navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      const video = generateVideo();

      call.answer(stream);
      call.on("stream", (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userId) => connectToNewUser(userId, stream));
  });

socket.on("user-disconnected", (userId) => {
  if (peers[userId]) peers[userId].close();
});

myPeer.on("open", (id) => {
  socket.emit("join-room", ROOM_ID, id);
});

function connectToNewUser(userId, stream) {
  console.log("new user is connected ", userId);
  const call = myPeer.call(userId, stream);
  const video = generateVideo();

  call.on("stream", (newStream) => addVideoStream(video, newStream));

  call.on("close", () => {
    video.remove();
  });

  peers[userId] = call;
}

function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener("loadedmetadata", () => {
    video.play();
  });
  videoGrid.append(video);
}

function generateVideo(muted) {
  const video = document.createElement("video");
  video.muted = muted;
  return video;
}
