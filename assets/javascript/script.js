

// Game state
const state = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    gameOver: false,
    moveCount: 0,
    gameMode: 'pvp',
    showMoveNumbers: false,
    firstPlayer: 'X'
};

// DOM elements
const boardEl = document.querySelector('.board');
const statusEl = document.getElementById('status');
const modeSelect = document.getElementById('mode');
const firstPlayerSelect = document.getElementById('first-player');
const showMovesCheckbox = document.getElementById('show-moves');
const restartBtn = document.getElementById('restart');



// Initialize the game
function init() {
    renderBoard();
    addEventListeners();
    updateStatus();
}

// Render the game board
function renderBoard() {
    boardEl.innerHTML = '';
    
    state.board.forEach((cell, index) => {
        const cellEl = document.createElement('div');
        cellEl.classList.add('cell');
        cellEl.setAttribute('role', 'gridcell');
        cellEl.setAttribute('aria-label', `Cell ${Math.floor(index / 3) + 1},${(index % 3) + 1}`);
        cellEl.setAttribute('tabindex', '0');
        cellEl.dataset.index = index;
        
        if (cell) {
            cellEl.textContent = cell;
            cellEl.classList.add(cell.toLowerCase());
            cellEl.dataset.moveNumber = state.board.filter((_, i) => i < index && _ !== null).length + 1;
        }
        
        if (state.winningCells && state.winningCells.includes(index)) {
            cellEl.classList.add('win');
        }
        
        boardEl.appendChild(cellEl);
    });
    
    if (state.showMoveNumbers) {
        boardEl.classList.add('show-moves');
    } else {
        boardEl.classList.remove('show-moves');
    }
}

// Add event listeners
function addEventListeners() {
    boardEl.addEventListener('click', handleCellClick);
    boardEl.addEventListener('keydown', handleKeyDown);
    modeSelect.addEventListener('change', handleModeChange);
    firstPlayerSelect.addEventListener('change', handleFirstPlayerChange);
    showMovesCheckbox.addEventListener('change', handleShowMovesChange);
    restartBtn.addEventListener('click', resetGame);
}

// Handle cell click
function handleCellClick(e) {
    if (!e.target.classList.contains('cell') || state.gameOver) return;
    
    const index = parseInt(e.target.dataset.index);
    makeMove(index);
}

// Handle keyboard navigation
function handleKeyDown(e) {
    if (state.gameOver) return;
    
    const activeElement = document.activeElement;
    if (!activeElement.classList.contains('cell')) return;
    
    const index = parseInt(activeElement.dataset.index);
    let newIndex;
    
    switch (e.key) {
        case 'ArrowUp':
            newIndex = index - 3;
            if (newIndex >= 0) focusCell(newIndex);
            break;
        case 'ArrowDown':
            newIndex = index + 3;
            if (newIndex < 9) focusCell(newIndex);
            break;
        case 'ArrowLeft':
            newIndex = index - 1;
            if (Math.floor(newIndex / 3) === Math.floor(index / 3)) focusCell(newIndex);
            break;
        case 'ArrowRight':
            newIndex = index + 1;
            if (Math.floor(newIndex / 3) === Math.floor(index / 3)) focusCell(newIndex);
            break;
        case 'Enter':
            case ' ':
                makeMove(index);
                break;
    }
}

function focusCell(index) {
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (cell) cell.focus();
}

// Make a move
function makeMove(index) {
    if (state.board[index] !== null || state.gameOver) return;
    
    // Player move
    state.board[index] = state.currentPlayer;
    state.moveCount++;
    renderBoard();
    
    if (checkWin()) {
        endGame(`${state.currentPlayer} wins! 🏆`);
        return;
    }
    
    if (state.moveCount === 9) {
        endGame("It's a draw!");
        return;
    }
    
    togglePlayer();
    updateStatus();
    
    // Computer move
    if (state.gameMode !== 'pvp' && state.currentPlayer === 'O' && !state.gameOver) {
        setTimeout(() => {
            const computerMove = getComputerMove();
            makeMove(computerMove);
        }, 500);
    }
}

// Toggle current player
function togglePlayer() {
    state.currentPlayer = state.currentPlayer === 'X' ? 'O' : 'X';
}

// Check for win
function checkWin() {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // columns
        [0, 4, 8], [2, 4, 6]             // diagonals
    ];
    
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (state.board[a] && state.board[a] === state.board[b] && state.board[a] === state.board[c]) {
            state.winningCells = pattern;
            return true;
        }
    }
    
    return false;
}

// End the game
function endGame(message) {
    state.gameOver = true;
    statusEl.textContent = message;
    renderBoard();
}

// Get computer move based on difficulty
function getComputerMove() {
    const emptyCells = state.board
        .map((cell, index) => (cell === null ? index : null))
        .filter(val => val !== null);
    
    if (emptyCells.length === 0) return -1;
    
    switch (state.gameMode) {
        case 'easy':
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
        case 'medium':
            return Math.random() < 0.5 ? 
                emptyCells[Math.floor(Math.random() * emptyCells.length)] : 
                minimax(state.board, 'O').index;
        case 'hard':
            return minimax(state.board, 'O').index;
        default:
            return emptyCells[Math.floor(Math.random() * emptyCells.length)];
    }
}

// Minimax algorithm with alpha-beta pruning
function minimax(board, player, depth = 0, alpha = -Infinity, beta = Infinity) {
    const availableMoves = board.map((cell, index) => (cell === null ? index : null)).filter(val => val !== null);
    
    // Check terminal states
    if (checkTerminal(board, 'O')) return { score: 10 - depth };
    if (checkTerminal(board, 'X')) return { score: depth - 10 };
    if (availableMoves.length === 0) return { score: 0 };
    
    const moves = [];
    
    for (const move of availableMoves) {
        const newBoard = [...board];
        newBoard[move] = player;
        
        const result = minimax(newBoard, player === 'O' ? 'X' : 'O', depth + 1, alpha, beta);
        moves.push({
            index: move,
            score: result.score
        });
        
        // Alpha-beta pruning
        if (player === 'O') {
            alpha = Math.max(alpha, result.score);
        } else {
            beta = Math.min(beta, result.score);
        }
        
        if (alpha >= beta) break;
    }
    
    // Choose best move
    let bestMove;
    if (player === 'O') {
        let bestScore = -Infinity;
        for (const move of moves) {
            if (move.score > bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        }
    } else {
        let bestScore = Infinity;
        for (const move of moves) {
            if (move.score < bestScore) {
                bestScore = move.score;
                bestMove = move;
            }
        }
    }
    
    return bestMove;
}

// Check terminal state for minimax
function checkTerminal(board, player) {
    const winPatterns = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    
    return winPatterns.some(pattern => {
        const [a, b, c] = pattern;
        return board[a] === player && board[b] === player && board[c] === player;
    });
}

// Update status message
function updateStatus() {
    statusEl.textContent = `${state.currentPlayer}'s turn`;
}

// Handle game mode change
function handleModeChange(e) {
    state.gameMode = e.target.value;
    resetGame();
}

// Handle first player change
function handleFirstPlayerChange(e) {
    state.firstPlayer = e.target.value;
    resetGame();
}

// Handle show moves change
function handleShowMovesChange(e) {
    state.showMoveNumbers = e.target.checked;
    renderBoard();
}

// Reset the game
function resetGame() {
    state.board = Array(9).fill(null);
    state.currentPlayer = state.firstPlayer;
    state.gameOver = false;
    state.moveCount = 0;
    state.winningCells = null;
    renderBoard();
    updateStatus();
    
    // If computer goes first
    if (state.gameMode !== 'pvp' && state.currentPlayer === 'O') {
        setTimeout(() => {
            const computerMove = getComputerMove();
            makeMove(computerMove);
        }, 500);
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', init);