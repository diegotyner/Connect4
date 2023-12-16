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

let lobbies = []

io.on('connection', (socket) => {
    console.log('A user just connected.');
    socket.on('disconnect', () => {
        console.log('A user has disconnected.');
    });

    socket.on('createLobby', (roomName) => {
        socket.join(roomName);
        lobbies.push(roomName);
        console.log('Lobby created');
    });

    socket.on('joinLobby', (roomName) => {
        console.log('Lobby join attempted');
        if (lobbies.includes(roomName, 0)) {
            socket.join(roomName);
            io.to(roomName).emit("startGame", () => { 
                Math.floor(Math.random() * ((1+ 1) + 0)),
                roomName
            }); // Randomly deciding who has start
            console.log("Game started with game code: " + roomName);
        } else {
            io.to(socket.id).emit('joinFailed');
            console.log(roomName + " join failed")
        }
    });

    socket.on('startGame', () => {
        console.log("Do I even get this message?"); // Maybe specify game code started?
    });

    socket.on('playerMove', (payload, roomName) => {
        if (payload.done == 1) {
            io.to(roomName).emit("gameOver");
        } else {
        io.to(roomName).emit("playerMove", payload);
        }
    });
});


/* Five main socket event:
Create lobby request (listener)
- Should create lobbies when receive a create request

Join lobby request (listener)
- Search for unstarted lobby, if found game start
- Else, Reject join (emit)
 - Player is waiting with that code, send them a connection failed with the received code

Game start (emit)
- Will send the successful code to the players. 
- Randomly generates whether red or yellow player is curr player.

Move (listener)
- Will receive the current piece update. Starts the move emition. Will also check for game over. 
- Move (emit)
 - Emits the most recent move to the game code received from
- Game over (emit)
 - If received game over message, send to game code game over
*/


