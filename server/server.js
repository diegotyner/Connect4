const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const publicPath = path.join(__dirname, '/../public');
const port = process.env.PORT || 3000;

let app = express();
let server = http.createServer(app);
let io = socketIO(server);

app.use(express.static(publicPath));

server.listen(port, ()=> {
    console.log(`Server is up on port ${port}.`)
});

let lobbies = [];
let activeGames = [];

io.on('connection', (socket) => {
    console.log('A user just connected.');
    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
    });

    // Create lobby event, fires when client attempts to make a lobby
    socket.on('createLobby', (roomName) => {
        if (lobbies.includes(roomName, 0) || activeGames.includes(roomName, 0)) {
            // Tell connecting client that this creation failed (code not available)
            io.to(socket.id).emit('createFailed');
            console.log('Lobby creation failed');
            return;
        }
        socket.join(roomName);
        lobbies.push(roomName);
        console.log('Lobby created');
        // Tell client creation succeeded
        io.to(socket.id).emit('createSucceed');
    });

    // Join lobby event, when client attempts to join a game
    socket.on('joinLobby', (roomName) => {
        console.log('Lobby join attempted');
        if (lobbies.includes(roomName, 0)) {    // There is an open lobby
            socket.join(roomName);
            let randInt = Math.floor(Math.random() * 2);    // Randomly deciding who has start
            io.to(roomName).emit("startGame", randInt, roomName);   // Emit to room that game started
            console.log("Game started with game code: " + roomName);

            // Removing joinable lobby
            let index = lobbies.indexOf(roomName);
            lobbies.splice(index, 1);
            activeGames.push(roomName);
        } else {    // Not open lobby
            io.to(socket.id).emit('joinFailed');
            console.log(roomName + " join failed")
        }
    });

    // Passing along newest move to clients
    socket.on('playerMove', (payload, roomName) => {
        if (payload[3] == true) {   // Payload[3] is state of the game. True means game over.
            io.to(roomName).emit("gameOver", payload[2]);   // Payload[2] is piece of the move. Passing along winner
        } 
        io.to(roomName).emit("playerMove", payload);
    });
});