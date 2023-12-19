let socket = io();


var currPlayer = false;
var playerPiece;
var roomName;

var gameOver = false;
var board;

var rows = 6;
var columns = 7;
var currColumns = []; //keeps track of which row each column is at.

const lobby = document.querySelector('.lobby')
const game_board = document.getElementById('board')
var createButton = document.getElementById('createButton')
var joinButton = document.getElementById('joinButton')



// Create game block
createButton.addEventListener("click", createGame) // Creator will be red
function createGame() {
    if ((playerPiece === "R") || (playerPiece === "Y")) {
        alert("It looks like you've already been queued, reload if this is an error")
        return;
    }
    roomName = document.getElementById("create").value;
    socket.emit("createLobby", roomName);
}
socket.on('createFailed', () => {
    alert("Create Attempt Failed: A lobby exists with that code");
});
socket.on('createSucceed', () => {
    playerPiece = "R";
    alert("Lobby Created, please wait for another guest to join!");
});


// Join game block
joinButton.addEventListener("click", joinGame) // Joiner will be yellow
function joinGame() {
    if ((playerPiece === "R") || (playerPiece === "Y")) {
        alert("It looks like you've already been queued, reload if this is an error")
        return;
    }
    roomName = document.getElementById("join").value;
    socket.emit("joinLobby", roomName);
}
socket.on('joinFailed', () => {
    alert("Join attempt failed: Is there a valid lobby for your room code?");
});


// Start game block
socket.on('startGame', (num, code) => {
    lobby.style.display = "none";
    setGame();

    roomName = code;
    // Assign piece to joiner
    if (playerPiece != "R") {
        playerPiece = "Y";
    }
    //If red and number === 1 they get first move
    if ((playerPiece === 'R') && (num === 1)) { 
        currPlayer = true;
    } else if ((playerPiece === 'Y') && (num === 0)) {
        currPlayer = true;
    } else {
        currPlayer = false;
    }
});


// Game over
socket.on("gameOver", (char) => {
    let winner = document.getElementById("winner");
    if (char == 'R') {
        winner.innerText = "Red Wins";             
    } else {
        winner.innerText = "Yellow Wins";
    }
   gameOver = true;
}); 


// Creating tile elements
function setGame() {
    board = [];
    currColumns = [5, 5, 5, 5, 5, 5, 5];

    for (let r = 0; r < rows; r++) {
        let row = [];
        for (let c = 0; c < columns; c++) {
            //JS
            row.push(' ');

            //HTML
            // <div></div>
            // <div id="0-0"></div>
            // <div id="0-0" class="tile"></div>
            let tile = document.createElement("div");
            tile.id = r.toString() + "-" + c.toString();
            tile.classList.add("tile");
            tile.addEventListener("click", setPiece);
            document.getElementById("board").append(tile);
        }
        board.push(row);
    }
    game_board.style.display = "flex";
}


// Player Moves
function setPiece() {
    if (gameOver || (!currPlayer)) {
        return;
    }
    
    //get coords of that tile clicked
    let coords = this.id.split("-");//"0-0" -> ["0","0"]
    let r = parseInt(coords[0]);
    let c = parseInt(coords[1]);
    
    // figure out which row the current column should be on
    r = currColumns[c]; 

    if (r < 0) { // board[r][c] != ' '
        return;
    }

    // [r - c - player - winner?]
    let payload = [r, c, playerPiece, false]

    board[r][c] = playerPiece;
    let tile = document.getElementById(r.toString() + "-" + c.toString());
    if (playerPiece === "R") {
        tile.classList.add("red-piece");
    }
    else {
        tile.classList.add("yellow-piece");
    }
    payload[3] = checkWinner(r, c);
    
    r -= 1; //update the row height for that column
    currColumns[c] = r; //update the array

    currPlayer = false;
    socket.emit("playerMove", payload, roomName);
}
socket.on("playerMove", (payload) => {
    if (payload[2] === playerPiece) {
        return;
    }
    r = payload[0];
    c = payload[1];

    board[r][c] = payload[2];
    let tile = document.getElementById(r.toString() + "-" + c.toString());
    if (payload[2] === "R") {
        tile.classList.add("red-piece");
    }
    else {
        tile.classList.add("yellow-piece");
    }
    r -= 1; //update the row height for that column
    currColumns[c] = r; //update the array
    
    if (!gameOver) {
        currPlayer = true;
    }
}); 


// Checking winner
function checkWinner(r, c) {
    // A window that moves to the right three times, checking from left to right if there are 4 in a row
    for (let i = 0; i < 4; i++) {
        let ci = i + c;
        
        if ( (ci <= 6) && (ci >= 3) ) {
            if ( (board[r][ci-3] === playerPiece) && (board[r][ci-2] === playerPiece) && (board[r][ci-1] === playerPiece) && (board[r][ci] === playerPiece) ) {
                console.log(board, 1);
                return true;
            }
        }
        console.log(ci);
    }


    // Up
    if (r <= 2) {
        if ( (board[r+3][c] === playerPiece) && (board[r+2][c] === playerPiece) && (board[r+1][c] === playerPiece)) {
            console.log(board, 5);
            return true;
        }
    }
    

    // Sliding window for diagonals. Slides left and right at the same time.
    for (let i = 0; i < 4; i++) {
        let ri = r - i;

        // Checking top right dot left-right upwards
        let ci = c + i;
        if ( (ci >= 3) && (ri <= 2) ) {
            if ( (board[ri+3][ci-3] === playerPiece) && (board[ri+2][ci-2] === playerPiece) && (board[ri+1][ci-1] === playerPiece) && (board[ri][ci] === playerPiece) ) {
                console.log(board, 11);
                return true;
            }
        }

        // Checking top left dot right-left upwards
        ci = c - i;
        if ( (ci <= 3) && (ri <= 2) ) {
            if ( (board[ri+3][ci+3] === playerPiece) && (board[ri+2][ci+2] === playerPiece) && (board[ri+1][ci+1] === playerPiece) && (board[ri][ci] === playerPiece) ) {
                console.log(board, 12);
                return true;
            }
        }
    }
    return false;
}


