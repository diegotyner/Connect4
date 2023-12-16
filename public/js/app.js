let socket = io();

/* Socket events:
Getting in a lobby (create) (emit)
- Enter code for the lobby creation
- Should have confirmation that button was clicked
- Red player 
- Save the code as this players lobby code

Getting in a lobby (join) (emit):
- Save the code entered as player lobby code
- Send to server requesting to join lobby:
 - Accepted: Will have game started for that game code
 - Rejected: Will be sent alert that join failed. 
- Join Failed (listener):
- Might be sent a failure from attempt to join, if so reset game code and continue.

Game start (listener)
- Hides initial buttons and reveals board
- Receive info on whether red or yellow is current player. Only update then
- Maybe display text if its your turn to move?

Move (emit)
- Can only emit during current move. Sends piece update and game code.
- Will update own board 
- No longer curr player, hide turn to move text
- Game over (emit)
 - Will send the server info if there is a game over

Move (listener)
- Will listen during other player move. Waits to receive piece update (ignore if just moved?)
- Gets sent info to update
- Gets updated to curr player

Game over (listener)
- Will at all times wait for game over
- Game over will make both players not curr player and will display winner
*/


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

window.onload = function() {
    setGame();
}


socket.on('joinFailed', () => {
    alert("Join attempt failed: Is there a valid lobby for your room code?");
});


socket.on('startGame', (num, code) => {
    hideLobby();
    roomName = code;
    if ((playerPiece == 'R') && (num == 1)) { //If red and number == 1
        currPlayer == true;
    } 
});
function hideLobby() {
    lobby.display = none;
    game_board.display = block;
}


socket.on("playerMove", (payload) => {}); // 
socket.on("gameOver", (payload) => {}); // Hmm confusing. How to implement? 


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
}

function setPiece() {
    if (gameOver) {
        return;
    }

    if (!currPlayer) {
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

    board[r][c] = currPlayer;
    let tile = document.getElementById(r.toString() + "-" + c.toString());
    if (playerPiece == "R") {
        tile.classList.add("red-piece");
    }
    else {
        tile.classList.add("yellow-piece");
    }
    r -= 1; //update the row height for that column
    currColumns[c] = r; //update the array

    currPlayer = false;
    
    
    checkWinner();
}


