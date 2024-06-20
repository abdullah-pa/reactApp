const fs = require('fs');
const https = require('https');
const express = require('express');
const { Server } = require('socket.io');

const app = express();

const server = https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.crt')
}, app);

const io = new Server(server, {
    cors: {
        origin: "*"
    }
});

const emailToSocketmap = new Map();
const socketToEmailMap = new Map();

io.on("connection", (socket) => {
    console.log("socket connected", socket.id);
    
    socket.on("room:join", (data) => {
        const { email, roomId } = data;
        console.log(email, roomId);
        emailToSocketmap.set(email, socket.id);
        socketToEmailMap.set(socket.id, email);
        io.to(roomId).emit("user:joined", { email, id: socket.id });
        socket.join(roomId);
        io.to(socket.id).emit("room:join", data);
    });

    socket.on("user:call", ({ to, offer }) => {
        console.log("calling user");
        io.to(to).emit("incoming:call", { from: socket.id, offer });
    });

    socket.on("call:accepted", ({ to, ans }) => {
        console.log("call accepted");
        io.to(to).emit("call:accepted", { from: to, ans });
    });

    socket.on('peer:nego:needed', ({ offer, to }) => {
        io.to(to).emit("peer:nego:needed", { from: socket.id, offer });
    });

    socket.on('peer:nego:done', ({ to, ans }) => {
        io.to(to).emit("peer:nego:final", { from: socket.id, ans });
    });

    socket.on('peer:stream:needed', ({ to }) => {
        io.to(to).emit("peer:stream:needed", { from: socket.id });
    });
});

const PORT = 8000;
server.listen(PORT, () => {
    console.log(`Server is running on https://localhost:${PORT}`);
});
