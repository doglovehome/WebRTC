const express = require("express");
const app = express();

let broadcaster;
const port = 4000;

const http = require("http");
const server = http.createServer(app);

const io = require("socket.io")(server);
app.use(express.static(__dirname + "/public"));

io.sockets.on("error", e => console.log(e));

io.sockets.on("connection", socket => {

    console.log("User id : "+ socket.id + " IsConnected")

    socket.on("broadcaster", () => {
        broadcaster = socket.id;

        console.log("Create Room id : "+ socket.id)
        socket.broadcast.emit("broadcaster");
    })

    socket.on("watcher", () => {

        console.log("User id : "+ socket.id + " Join To Room id : " + broadcaster)

        socket.to(broadcaster).emit("watcher", socket.id);
    })

    socket.on("offer", (id, message) => {
        socket.to(id).emit("offer", socket.id, message);
    })

    socket.on("answer", (id, message) => {
        socket.to(id).emit("answer", socket.id, message);
    })

    socket.on("candidate", (id, message) => {
        socket.to(id).emit("candidate", socket.id, message);
    })

    socket.on("disconnect", () => {
        console.log("User id : "+ socket.id +" Is  disConnected")

        socket.to(broadcaster).emit("disconnectPeer", socket.id);
    })
});

server.listen(port, () => console.log(`Server is running on port ${port}`));