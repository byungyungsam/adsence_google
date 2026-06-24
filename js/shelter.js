document.addEventListener('DOMContentLoaded', () => {
    // --------------------------------------------------
    // 1. Tab Swapping Logic
    // --------------------------------------------------
    const tabBtns = document.querySelectorAll('.tools-tab-btn');
    const tabPanels = document.querySelectorAll('.tools-tab-panel');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanels.forEach(p => p.classList.remove('active'));

            btn.classList.add('active');
            const targetId = btn.getAttribute('data-tab');
            const targetPanel = document.getElementById(targetId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                
                // Initialize specific game when entering its tab
                if (targetId === 'minesweeper') {
                    initMinesweeper();
                } else if (targetId === 'sudoku') {
                    initSudoku();
                } else if (targetId === 'game-2048') {
                    init2048();
                }
            }
        });
    });

    // ==================================================
    // 2. Minesweeper (지뢰찾기) Engine
    // ==================================================
    let mineConfig = {
        difficulty: 'easy',
        rows: 9,
        cols: 9,
        mines: 10
    };
    
    let mineBoard = [];
    let mineTimerInterval = null;
    let mineSeconds = 0;
    let mineFlags = 0;
    let mineGameOver = false;
    let mineFirstClick = true;
    let mobileFlagMode = false;

    const mineBoardEl = document.getElementById('minesweeper-board');
    const mineDifficultySelect = document.getElementById('mine-difficulty');
    const mineFlagCountEl = document.getElementById('mine-flag-count');
    const mineTotalCountEl = document.getElementById('mine-total-count');
    const mineTimerEl = document.getElementById('mine-timer');
    const btnMineReset = document.getElementById('btn-mine-reset');
    const btnMineFlagToggle = document.getElementById('btn-mine-flag-toggle');

    if (mineDifficultySelect) {
        mineDifficultySelect.addEventListener('change', (e) => {
            const diff = e.target.value;
            mineConfig.difficulty = diff;
            if (diff === 'easy') {
                mineConfig.rows = 9;
                mineConfig.cols = 9;
                mineConfig.mines = 10;
            } else if (diff === 'medium') {
                mineConfig.rows = 16;
                mineConfig.cols = 16;
                mineConfig.mines = 40;
            } else { // hard (고급)
                mineConfig.rows = 16;
                mineConfig.cols = 30;
                mineConfig.mines = 99;
            }
            initMinesweeper();
        });
    }

    if (btnMineReset) {
        btnMineReset.addEventListener('click', initMinesweeper);
    }

    if (btnMineFlagToggle) {
        btnMineFlagToggle.addEventListener('click', () => {
            mobileFlagMode = !mobileFlagMode;
            if (mobileFlagMode) {
                btnMineFlagToggle.textContent = '🚩 모드 ON';
                btnMineFlagToggle.classList.add('active');
                btnMineFlagToggle.style.backgroundColor = 'var(--secondary)';
                btnMineFlagToggle.style.color = '#000';
            } else {
                btnMineFlagToggle.textContent = '🚩 모드 OFF';
                btnMineFlagToggle.classList.remove('active');
                btnMineFlagToggle.style.backgroundColor = '';
                btnMineFlagToggle.style.color = '';
            }
        });
    }

    function initMinesweeper() {
        // Reset timers & states
        clearInterval(mineTimerInterval);
        mineTimerInterval = null;
        mineSeconds = 0;
        mineFlags = 0;
        mineGameOver = false;
        mineFirstClick = true;
        
        if (mineTimerEl) mineTimerEl.textContent = '0';
        if (mineFlagCountEl) mineFlagCountEl.textContent = '0';
        if (mineTotalCountEl) mineTotalCountEl.textContent = mineConfig.mines;

        // Build board array
        mineBoard = [];
        for (let r = 0; r < mineConfig.rows; r++) {
            mineBoard[r] = [];
            for (let c = 0; c < mineConfig.cols; c++) {
                mineBoard[r][c] = {
                    row: r,
                    col: c,
                    isMine: false,
                    isRevealed: false,
                    isFlagged: false,
                    neighborMines: 0
                };
            }
        }

        renderMineBoard();
    }

    function renderMineBoard() {
        if (!mineBoardEl) return;
        
        mineBoardEl.innerHTML = '';
        
        // Dynamically style grid columns
        mineBoardEl.style.gridTemplateColumns = `repeat(${mineConfig.cols}, 1fr)`;

        for (let r = 0; r < mineConfig.rows; r++) {
            for (let c = 0; c < mineConfig.cols; c++) {
                const cell = mineBoard[r][c];
                const cellEl = document.createElement('div');
                cellEl.classList.add('mine-cell');
                cellEl.dataset.row = r;
                cellEl.dataset.col = c;
                
                // Left-click handler
                cellEl.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (mobileFlagMode) {
                        flagCell(r, c);
                    } else {
                        revealCell(r, c);
                    }
                });

                // Right-click handler
                cellEl.addEventListener('contextmenu', (e) => {
                    e.preventDefault();
                    flagCell(r, c);
                });

                mineBoardEl.appendChild(cellEl);
            }
        }
    }

    function startMineTimer() {
        mineTimerInterval = setInterval(() => {
            mineSeconds++;
            if (mineTimerEl) mineTimerEl.textContent = mineSeconds;
        }, 1000);
    }

    function generateMines(firstRow, firstCol) {
        let placedMines = 0;
        while (placedMines < mineConfig.mines) {
            const r = Math.floor(Math.random() * mineConfig.rows);
            const c = Math.floor(Math.random() * mineConfig.cols);
            
            // First click safety: do not place mine on or directly adjacent to first click
            const isTooClose = Math.abs(r - firstRow) <= 1 && Math.abs(c - firstCol) <= 1;
            
            if (!mineBoard[r][c].isMine && !isTooClose) {
                mineBoard[r][c].isMine = true;
                placedMines++;
            }
        }

        // Calculate neighbor numbers
        for (let r = 0; r < mineConfig.rows; r++) {
            for (let c = 0; c < mineConfig.cols; c++) {
                if (mineBoard[r][c].isMine) continue;
                
                let count = 0;
                for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        const nr = r + dr;
                        const nc = c + dc;
                        if (nr >= 0 && nr < mineConfig.rows && nc >= 0 && nc < mineConfig.cols) {
                            if (mineBoard[nr][nc].isMine) count++;
                        }
                    }
                }
                mineBoard[r][c].neighborMines = count;
            }
        }
    }

    function revealCell(r, c) {
        if (mineGameOver) return;
        
        const cell = mineBoard[r][c];
        if (cell.isRevealed || cell.isFlagged) return;

        // First click setup
        if (mineFirstClick) {
            mineFirstClick = false;
            generateMines(r, c);
            startMineTimer();
        }

        cell.isRevealed = true;
        const cellEl = mineBoardEl.children[r * mineConfig.cols + c];
        cellEl.classList.add('revealed');

        if (cell.isMine) {
            // Hit a mine! Game Over
            triggerMineGameOver(false);
            return;
        }

        if (cell.neighborMines > 0) {
            cellEl.textContent = cell.neighborMines;
            cellEl.classList.add(`mine-count-${cell.neighborMines}`);
        } else {
            // Flood fill for 0-neighbor cells
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr >= 0 && nr < mineConfig.rows && nc >= 0 && nc < mineConfig.cols) {
                        revealCell(nr, nc);
                    }
                }
            }
        }

        checkMineVictory();
    }

    function flagCell(r, c) {
        if (mineGameOver) return;
        
        const cell = mineBoard[r][c];
        if (cell.isRevealed) return;

        cell.isFlagged = !cell.isFlagged;
        const cellEl = mineBoardEl.children[r * mineConfig.cols + c];

        if (cell.isFlagged) {
            cellEl.classList.add('flagged');
            cellEl.textContent = '🚩';
            mineFlags++;
        } else {
            cellEl.classList.remove('flagged');
            cellEl.textContent = '';
            mineFlags--;
        }

        if (mineFlagCountEl) mineFlagCountEl.textContent = mineFlags;
    }

    function triggerMineGameOver(isWin) {
        mineGameOver = true;
        clearInterval(mineTimerInterval);

        // Reveal all mines
        for (let r = 0; r < mineConfig.rows; r++) {
            for (let c = 0; c < mineConfig.cols; c++) {
                const cell = mineBoard[r][c];
                const cellEl = mineBoardEl.children[r * mineConfig.cols + c];
                
                if (cell.isMine) {
                    cellEl.classList.add('revealed', 'mine');
                    cellEl.textContent = '💣';
                }
            }
        }

        setTimeout(() => {
            if (isWin) {
                alert(`축하합니다! ${mineSeconds}초 만에 지뢰를 모두 찾으셨습니다! 🎉`);
            } else {
                alert('폭탄을 밟았습니다! 게임 오버 💥');
            }
        }, 100);
    }

    function checkMineVictory() {
        let revealedCount = 0;
        const totalCells = mineConfig.rows * mineConfig.cols;
        
        for (let r = 0; r < mineConfig.rows; r++) {
            for (let c = 0; c < mineConfig.cols; c++) {
                if (mineBoard[r][c].isRevealed) revealedCount++;
            }
        }

        if (revealedCount === totalCells - mineConfig.mines) {
            triggerMineGameOver(true);
        }
    }


    // ==================================================
    // 3. Sudoku (스도쿠) Engine
    // ==================================================
    let sudokuTimerInterval = null;
    let sudokuSeconds = 0;
    let sudokuErrors = 0;
    let selectedSudokuCell = null; // { row, col }

    // Hardcoded solvable base solved sudoku
    const solvedSudokuBase = [
        [1, 2, 3, 4, 5, 6, 7, 8, 9],
        [4, 5, 6, 7, 8, 9, 1, 2, 3],
        [7, 8, 9, 1, 2, 3, 4, 5, 6],
        [2, 3, 1, 5, 6, 4, 8, 9, 7],
        [5, 6, 4, 8, 9, 7, 2, 3, 1],
        [8, 9, 7, 2, 3, 1, 5, 6, 4],
        [3, 1, 2, 6, 4, 5, 9, 7, 8],
        [6, 4, 5, 9, 7, 8, 3, 1, 2],
        [9, 7, 8, 3, 1, 2, 6, 4, 5]
    ];

    let sudokuSolution = [];
    let sudokuClues = [];
    let sudokuUserGrid = [];

    const sudokuBoardEl = document.getElementById('sudoku-board');
    const sudokuDifficultySelect = document.getElementById('sudoku-difficulty');
    const sudokuTimerEl = document.getElementById('sudoku-timer');
    const sudokuErrorsEl = document.getElementById('sudoku-errors');
    const btnSudokuCheck = document.getElementById('btn-sudoku-check');
    const btnSudokuReset = document.getElementById('btn-sudoku-reset');
    const sudokuNumBtns = document.querySelectorAll('.sudoku-num-btn');

    if (sudokuDifficultySelect) {
        sudokuDifficultySelect.addEventListener('change', initSudoku);
    }
    if (btnSudokuReset) {
        btnSudokuReset.addEventListener('click', initSudoku);
    }
    if (btnSudokuCheck) {
        btnSudokuCheck.addEventListener('click', checkSudokuSolution);
    }

    // Number Pad event listeners
    sudokuNumBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!selectedSudokuCell) return;
            const num = btn.getAttribute('data-num');
            setSudokuNumber(num);
        });
    });

    // Keyboard support for Sudoku
    document.addEventListener('keydown', (e) => {
        // Only trigger if active tab is sudoku
        const activeTabBtn = document.querySelector('.tools-tab-btn.active');
        if (!activeTabBtn || activeTabBtn.getAttribute('data-tab') !== 'sudoku') return;
        if (!selectedSudokuCell) return;

        const key = e.key;
        if (key >= '1' && key <= '9') {
            setSudokuNumber(key);
        } else if (key === 'Backspace' || key === 'Delete' || key === '0') {
            setSudokuNumber('clear');
        }
    });

    function initSudoku() {
        clearInterval(sudokuTimerInterval);
        sudokuTimerInterval = null;
        sudokuSeconds = 0;
        sudokuErrors = 0;
        selectedSudokuCell = null;

        if (sudokuTimerEl) sudokuTimerEl.textContent = '0';
        if (sudokuErrorsEl) sudokuErrorsEl.textContent = '0';

        generateSudokuPuzzle();
        renderSudokuBoard();
        startSudokuTimer();
    }

    function startSudokuTimer() {
        sudokuTimerInterval = setInterval(() => {
            sudokuSeconds++;
            if (sudokuTimerEl) sudokuTimerEl.textContent = sudokuSeconds;
        }, 1000);
    }

    // Scramble base grid to make a unique board
    function generateSudokuPuzzle() {
        // Copy base solved board
        sudokuSolution = JSON.parse(JSON.stringify(solvedSudokuBase));

        // 1. Shuffle numbers (Swap all instances of two random numbers)
        for (let i = 0; i < 15; i++) {
            const numA = Math.floor(Math.random() * 9) + 1;
            const numB = Math.floor(Math.random() * 9) + 1;
            if (numA !== numB) {
                for (let r = 0; r < 9; r++) {
                    for (let c = 0; c < 9; c++) {
                        if (sudokuSolution[r][c] === numA) sudokuSolution[r][c] = numB;
                        else if (sudokuSolution[r][c] === numB) sudokuSolution[r][c] = numA;
                    }
                }
            }
        }

        // 2. Shuffle Rows within blocks (0-2, 3-5, 6-8)
        for (let block = 0; block < 3; block++) {
            const baseRow = block * 3;
            // Swap two rows inside this block
            const r1 = baseRow + Math.floor(Math.random() * 3);
            const r2 = baseRow + Math.floor(Math.random() * 3);
            if (r1 !== r2) {
                const temp = sudokuSolution[r1];
                sudokuSolution[r1] = sudokuSolution[r2];
                sudokuSolution[r2] = temp;
            }
        }

        // 3. Shuffle Columns within blocks (0-2, 3-5, 6-8)
        for (let block = 0; block < 3; block++) {
            const baseCol = block * 3;
            // Swap two columns inside this block
            const c1 = baseCol + Math.floor(Math.random() * 3);
            const c2 = baseCol + Math.floor(Math.random() * 3);
            if (c1 !== c2) {
                for (let r = 0; r < 9; r++) {
                    const temp = sudokuSolution[r][c1];
                    sudokuSolution[r][c1] = sudokuSolution[r][c2];
                    sudokuSolution[r][c2] = temp;
                }
            }
        }

        // Determine how many cells to empty based on difficulty
        const diff = sudokuDifficultySelect ? sudokuDifficultySelect.value : 'easy';
        let emptyCount = 35; // Easy (46 clues)
        if (diff === 'medium') emptyCount = 47; // Medium (34 clues)
        else if (diff === 'hard') emptyCount = 55; // Hard (26 clues)

        // Make user playing grid
        sudokuClues = JSON.parse(JSON.stringify(sudokuSolution));
        sudokuUserGrid = JSON.parse(JSON.stringify(sudokuSolution));

        let cleared = 0;
        while (cleared < emptyCount) {
            const r = Math.floor(Math.random() * 9);
            const c = Math.floor(Math.random() * 9);
            if (sudokuClues[r][c] !== 0) {
                sudokuClues[r][c] = 0;
                sudokuUserGrid[r][c] = 0;
                cleared++;
            }
        }
    }

    function renderSudokuBoard() {
        if (!sudokuBoardEl) return;
        sudokuBoardEl.innerHTML = '';

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const container = document.createElement('div');
                container.classList.add('sudoku-cell-container');
                
                // Add thicker borders to outline 3x3 blocks
                if (c === 2 || c === 5) container.classList.add('border-right-thick');
                if (r === 2 || r === 5) container.classList.add('border-bottom-thick');

                const cell = document.createElement('input');
                cell.type = 'text';
                cell.classList.add('sudoku-cell');
                cell.readOnly = true; // Click selection only, custom pad/keyboard updates
                cell.dataset.row = r;
                cell.dataset.col = c;

                const val = sudokuUserGrid[r][c];
                if (val !== 0) {
                    cell.value = val;
                    if (sudokuClues[r][c] !== 0) {
                        cell.classList.add('clue');
                    } else {
                        cell.classList.add('user-val');
                    }
                }

                // Click event
                container.addEventListener('click', () => {
                    selectSudokuCell(r, c);
                });

                container.appendChild(cell);
                sudokuBoardEl.appendChild(container);
            }
        }
    }

    function selectSudokuCell(r, c) {
        selectedSudokuCell = { row: r, col: c };

        // Clean previous selection classes
        const containers = sudokuBoardEl.querySelectorAll('.sudoku-cell-container');
        containers.forEach(el => {
            el.classList.remove('selected', 'same-num');
        });

        // Add selected highlight to clicked cell container
        const idx = r * 9 + c;
        containers[idx].classList.add('selected');

        // Same number highlight
        const targetVal = sudokuUserGrid[r][c];
        if (targetVal !== 0) {
            containers.forEach((el, index) => {
                const row = Math.floor(index / 9);
                const col = index % 9;
                if (sudokuUserGrid[row][col] === targetVal) {
                    el.classList.add('same-num');
                }
            });
        }
    }

    function setSudokuNumber(val) {
        if (!selectedSudokuCell) return;
        const r = selectedSudokuCell.row;
        const c = selectedSudokuCell.col;

        // Clue cells cannot be modified
        if (sudokuClues[r][c] !== 0) return;

        const idx = r * 9 + c;
        const container = sudokuBoardEl.children[idx];
        const cell = container.querySelector('.sudoku-cell');

        if (val === 'clear') {
            sudokuUserGrid[r][c] = 0;
            cell.value = '';
            cell.classList.remove('user-val', 'error');
        } else {
            const num = parseInt(val);
            sudokuUserGrid[r][c] = num;
            cell.value = num;
            cell.classList.add('user-val');

            // Real-time conflict validation
            if (num !== sudokuSolution[r][c]) {
                cell.classList.add('error');
                sudokuErrors++;
                if (sudokuErrorsEl) sudokuErrorsEl.textContent = sudokuErrors;
                
                if (sudokuErrors >= 5) {
                    clearInterval(sudokuTimerInterval);
                    alert('실수를 5회 이상 저질렀습니다! 게임 오버 ❌');
                    initSudoku();
                    return;
                }
            } else {
                cell.classList.remove('error');
            }
        }

        // Keep highlights updated
        selectSudokuCell(r, c);

        // Check if solved
        checkSudokuSolved();
    }

    function checkSudokuSolved() {
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (sudokuUserGrid[r][c] !== sudokuSolution[r][c]) {
                    return; // Not fully solved correctly yet
                }
            }
        }

        clearInterval(sudokuTimerInterval);
        setTimeout(() => {
            alert(`축하합니다! 스도쿠 퍼즐을 성공적으로 풀어내셨습니다! (경과 시간: ${sudokuSeconds}초) 🎓`);
        }, 150);
    }

    function checkSudokuSolution() {
        let isCorrect = true;
        const containers = sudokuBoardEl.querySelectorAll('.sudoku-cell-container');

        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const idx = r * 9 + c;
                const cell = containers[idx].querySelector('.sudoku-cell');
                
                if (sudokuUserGrid[r][c] === 0) {
                    isCorrect = false;
                } else if (sudokuUserGrid[r][c] !== sudokuSolution[r][c]) {
                    cell.classList.add('error');
                    isCorrect = false;
                }
            }
        }

        if (isCorrect) {
            alert('현재 배치된 숫자들이 정답과 완전히 일치하며 정상입니다! 👍');
        } else {
            alert('일부 칸이 비어있거나 올바르지 않은 숫자가 입력되어 있습니다. 빨간색 표시를 확인하세요.');
        }
    }


    // ==================================================
    // 4. 2048 Engine
    // ==================================================
    let board2048 = [];
    let score2048 = 0;
    let best2048 = parseInt(localStorage.getItem('best_2048')) || 0;

    const board2048El = document.getElementById('board-2048');
    const score2048El = document.getElementById('score-2048');
    const best2048El = document.getElementById('best-2048');
    const overlay2048El = document.getElementById('overlay-2048');
    const btn2048Reset = document.getElementById('btn-2048-reset');
    const btn2048ResetOverlay = document.getElementById('btn-2048-reset-overlay');
    const dpadBtns = document.querySelectorAll('.btn-2048-dpad');

    if (best2048El) best2048El.textContent = best2048;
    if (btn2048Reset) btn2048Reset.addEventListener('click', init2048);
    if (btn2048ResetOverlay) btn2048ResetOverlay.addEventListener('click', init2048);

    // Virtual D-pad for mobile clicking
    dpadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const dir = btn.getAttribute('data-dir');
            handle2048Move(dir);
        });
    });

    // Keyboard support for 2048
    document.addEventListener('keydown', (e) => {
        // Only trigger if active tab is 2048
        const activeTabBtn = document.querySelector('.tools-tab-btn.active');
        if (!activeTabBtn || activeTabBtn.getAttribute('data-tab') !== 'game-2048') return;

        let moved = false;
        switch (e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                e.preventDefault();
                moved = handle2048Move('up');
                break;
            case 'ArrowDown':
            case 's':
            case 'S':
                e.preventDefault();
                moved = handle2048Move('down');
                break;
            case 'ArrowLeft':
            case 'a':
            case 'A':
                e.preventDefault();
                moved = handle2048Move('left');
                break;
            case 'ArrowRight':
            case 'd':
            case 'D':
                e.preventDefault();
                moved = handle2048Move('right');
                break;
        }
    });

    // Swipe support for mobile touchscreen
    let touchStartX = 0;
    let touchStartY = 0;
    
    if (board2048El) {
        board2048El.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }, { passive: true });

        board2048El.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;

            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;

            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Threshold: swipe must be at least 30px
            if (Math.max(Math.abs(diffX), Math.abs(diffY)) < 30) return;

            if (Math.abs(diffX) > Math.abs(diffY)) {
                // Horizontal Swipe
                if (diffX > 0) {
                    handle2048Move('right');
                } else {
                    handle2048Move('left');
                }
            } else {
                // Vertical Swipe
                if (diffY > 0) {
                    handle2048Move('down');
                } else {
                    handle2048Move('up');
                }
            }

            // Reset
            touchStartX = 0;
            touchStartY = 0;
        }, { passive: true });
    }

    function init2048() {
        score2048 = 0;
        if (score2048El) score2048El.textContent = '0';
        if (overlay2048El) overlay2048El.style.display = 'none';

        // 4x4 Empty board
        board2048 = [
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
            [0, 0, 0, 0]
        ];

        // Spawn first two tiles
        spawn2048Tile();
        spawn2048Tile();

        render2048Board();
    }

    function spawn2048Tile() {
        const empties = [];
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (board2048[r][c] === 0) {
                    empties.push({ r, c });
                }
            }
        }

        if (empties.length > 0) {
            const pick = empties[Math.floor(Math.random() * empties.length)];
            // 90% chance of 2, 10% chance of 4
            board2048[pick.r][pick.c] = Math.random() < 0.9 ? 2 : 4;
        }
    }

    function render2048Board() {
        if (!board2048El) return;
        board2048El.innerHTML = '';

        // Render board placeholders & tiles
        const isMobile = window.innerWidth <= 400;
        const padding = isMobile ? 8 : 10;
        const gap = isMobile ? 8 : 10;
        const cellSize = isMobile ? 58 : 65;

        // 1. Render empty grid backgrounds
        for (let i = 0; i < 16; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell-2048');
            board2048El.appendChild(cell);
        }

        // 2. Overlay absolute tile elements
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                const val = board2048[r][c];
                if (val > 0) {
                    const tile = document.createElement('div');
                    tile.classList.add('tile-2048', `tile-${val}`);
                    tile.textContent = val;
                    
                    // Absolute positioning
                    const x = padding + c * (cellSize + gap);
                    const y = padding + r * (cellSize + gap);
                    tile.style.left = `${x}px`;
                    tile.style.top = `${y}px`;

                    board2048El.appendChild(tile);
                }
            }
        }
    }

    function handle2048Move(dir) {
        if (overlay2048El && overlay2048El.style.display !== 'none') return false;

        const previousBoard = JSON.stringify(board2048);
        
        let moved = false;
        
        if (dir === 'left') {
            for (let r = 0; r < 4; r++) {
                const row = board2048[r];
                const cleanRow = row.filter(x => x !== 0);
                const mergedRow = [];
                for (let i = 0; i < cleanRow.length; i++) {
                    if (cleanRow[i] === cleanRow[i + 1]) {
                        const mergedVal = cleanRow[i] * 2;
                        mergedRow.push(mergedVal);
                        score2048 += mergedVal;
                        i++; // skip next
                    } else {
                        mergedRow.push(cleanRow[i]);
                    }
                }
                while (mergedRow.length < 4) mergedRow.push(0);
                board2048[r] = mergedRow;
            }
        } else if (dir === 'right') {
            for (let r = 0; r < 4; r++) {
                const row = board2048[r];
                const cleanRow = row.filter(x => x !== 0);
                const mergedRow = [];
                for (let i = cleanRow.length - 1; i >= 0; i--) {
                    if (cleanRow[i] === cleanRow[i - 1]) {
                        const mergedVal = cleanRow[i] * 2;
                        mergedRow.unshift(mergedVal);
                        score2048 += mergedVal;
                        i--; // skip next
                    } else {
                        mergedRow.unshift(cleanRow[i]);
                    }
                }
                while (mergedRow.length < 4) mergedRow.unshift(0);
                board2048[r] = mergedRow;
            }
        } else if (dir === 'up') {
            for (let c = 0; c < 4; c++) {
                const col = [board2048[0][c], board2048[1][c], board2048[2][c], board2048[3][c]];
                const cleanCol = col.filter(x => x !== 0);
                const mergedCol = [];
                for (let i = 0; i < cleanCol.length; i++) {
                    if (cleanCol[i] === cleanCol[i + 1]) {
                        const mergedVal = cleanCol[i] * 2;
                        mergedCol.push(mergedVal);
                        score2048 += mergedVal;
                        i++;
                    } else {
                        mergedCol.push(cleanCol[i]);
                    }
                }
                while (mergedCol.length < 4) mergedCol.push(0);
                for (let r = 0; r < 4; r++) board2048[r][c] = mergedCol[r];
            }
        } else if (dir === 'down') {
            for (let c = 0; c < 4; c++) {
                const col = [board2048[0][c], board2048[1][c], board2048[2][c], board2048[3][c]];
                const cleanCol = col.filter(x => x !== 0);
                const mergedCol = [];
                for (let i = cleanCol.length - 1; i >= 0; i--) {
                    if (cleanCol[i] === cleanCol[i - 1]) {
                        const mergedVal = cleanCol[i] * 2;
                        mergedCol.unshift(mergedVal);
                        score2048 += mergedVal;
                        i--;
                    } else {
                        mergedCol.unshift(cleanCol[i]);
                    }
                }
                while (mergedCol.length < 4) mergedCol.unshift(0);
                for (let r = 0; r < 4; r++) board2048[r][c] = mergedCol[r];
            }
        }

        // Update score
        if (score2048El) score2048El.textContent = score2048;
        if (score2048 > best2048) {
            best2048 = score2048;
            if (best2048El) best2048El.textContent = best2048;
            localStorage.setItem('best_2048', best2048);
        }

        // Check if board layout actually changed
        if (JSON.stringify(board2048) !== previousBoard) {
            moved = true;
            spawn2048Tile();
            render2048Board();
            
            // Check if game over
            if (check2048GameOver()) {
                if (overlay2048El) overlay2048El.style.display = 'flex';
            }
        }

        return moved;
    }

    function check2048GameOver() {
        // 1. Any empty cell?
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                if (board2048[r][c] === 0) return false;
            }
        }

        // 2. Any adjacent matching cell horizontally?
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 3; c++) {
                if (board2048[r][c] === board2048[r][c + 1]) return false;
            }
        }

        // 3. Any adjacent matching cell vertically?
        for (let c = 0; c < 4; c++) {
            for (let r = 0; r < 3; r++) {
                if (board2048[r][c] === board2048[r + 1][c]) return false;
            }
        }

        return true; // No moves left
    }

    // Default initialization
    initMinesweeper();
});
