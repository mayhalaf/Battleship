document.addEventListener('DOMContentLoaded', (event) => {
    const settings = JSON.parse(localStorage.getItem('battleshipSettings')); //זיכון גודל הלוח
  
    //גודל הספינות
    const boardSize = parseInt(settings.boardSize);
    const shipCounts = {
        2: parseInt(settings.shipSizes[2]),
        3: parseInt(settings.shipSizes[3]),
        4: parseInt(settings.shipSizes[4]),
        5: parseInt(settings.shipSizes[5])
    };   
    // משתנים לקבוע
    const boardElement = document.querySelector('#board');
    const remainingShipsElement = document.querySelector('#remainingShips');
    const explosionSound = document.querySelector('#explosionSound');

    //משתנים לא קבועים של הלוח
    let board = [];
    //להעתיק את המאפיינים של האובייקט לאובייקט החדש 
    let remainingShips = {}; //אובקייט חדש קשור לאחסון בגיסון
    for (let key in shipCounts) {
    if (shipCounts.hasOwnProperty(key)) {
        remainingShips[key] = shipCounts[key];
    }
    }
    let shipLocations = [];

    //מסדר את הספינות בצורה רנדומלית
    function placeShipsRandomly(boardSize, shipCounts) {
        for (let size in shipCounts) {
            if (shipCounts.hasOwnProperty(size)) { //משמש לבדיקה האם האובייקט מכיל מאפיין מסוים
                let count = shipCounts[size];
                for (let i = 0; i < count; i++) {
                    placeShip(parseInt(size), boardSize);
                }
            }
        }
    }   
    //ממקם את הספנות על הלוח
    function placeShip(size, boardSize) {
        let placed = false;
        while (!placed) {
            const orientation = Math.random() < 0.5 ? 'horizontal' : 'vertical'; //בוחנת אם האורך של התא הוא אופקי או אנכי 
            const row = Math.floor(Math.random() * boardSize);
            const col = Math.floor(Math.random() * boardSize);

            if (orientation === 'horizontal') {
                if (col + size > boardSize) continue;
                if (isAreaClear(row, col, size, orientation)) {
                    for (let i = 0; i < size; i++) {
                        board[row][col + i] = size;
                        shipLocations.push({ row, col: col + i }); //הוספה
                    }
                    placed = true;
                }
            } else {
                if (row + size > boardSize) continue;
                if (isAreaClear(row, col, size, orientation)) {
                    for (let i = 0; i < size; i++) {
                        board[row + i][col] = size;
                        shipLocations.push({ row: row + i, col });
                    }
                    placed = true;
                }
            }
        }
    }
    //  בודקת אם האזור הנבדק פנוי לפני מיקום הספינה
    function isAreaClear(row, col, size, orientation) {
        const boardRows = board.length;
        const boardCols = board[0].length;
    
        for (let i = -1; i <= size; i++) { // -1 לוודא שיש רווח בין הספינות
            for (let j = -1; j <= 1; j++) {
                let r, c;
    
                if (orientation === 'horizontal') {
                    r = row + j;
                    c = col + i;
                } else {
                    r = row + i;
                    c = col + j;
                }
    
                if (r >= 0 && r < boardRows && c >= 0 && c < boardCols && board[r][c] !== 0) {
                    return false;
                }
            }
        }
        return true;
    }
    
    // מסדר את הגודל 
    function renderBoard(boardSize) {
        boardElement.innerHTML = '';
        boardElement.style.gridTemplateRows = `repeat(${boardSize}, 30px)`; //אורך
        boardElement.style.gridTemplateColumns = `repeat(${boardSize}, 30px)`;//רוחב

        for (let i = 0; i < boardSize; i++) {
            for (let j = 0; j < boardSize; j++) {
                const cell = document.createElement('div');
                cell.classList.add('cell');
                cell.dataset.row = i;
                cell.dataset.col = j;
                cell.addEventListener('click', onCellClick);
                boardElement.appendChild(cell);
            }
        }
    }
    //בודק אם יש ספינה בשדה
    function onCellClick(event) {
        const row = parseInt(event.target.dataset.row); //קוראים את השורה והעמודה מה dataset של התא שנלחץ
        const col = parseInt(event.target.dataset.col);

        if (board[row][col] > 0) { //אם יש פגיעה בספינה, התא קיבל פגיעה (hit)
            event.target.classList.add('hit');
            const shipSize = board[row][col];
            shipLocations = removeLocation(shipLocations, row, col); 
                    
            if (isShipSunk(shipSize)) {
                remainingShips[shipSize]--;
                updateRemainingShips();
                playExplosionSound();
                showExplosionAnimation(event.target);
            }
        } else {
            event.target.classList.add('miss'); // התא קיבל בעיטה חופשית (miss)
        }
    }

    function removeLocation(locations, row, col) {  //שמכיל את כל המיקומים שלא הוסרו
        const newLocations = [];
        for (let i = 0; i < locations.length; i++) {
            if (locations[i].row !== row || locations[i].col !== col) {
                newLocations.push(locations[i]);
            }
        }
        return newLocations;
    }

    //סואנד
    function playExplosionSound() {
        explosionSound.currentTime = 0; 
        explosionSound.play();
    }
    //צבע אדום שמוציאים ספינה 
    function showExplosionAnimation(cell) {
        const explosionAnimation = document.createElement('div');
        explosionAnimation.classList.add('explosion-animation');
        cell.appendChild(explosionAnimation);
        setTimeout(function() {
            explosionAnimation.remove();
        }, 1000);// Remove the animation after 1 second
    }
    //בדיקה אם מצאנו את הספינה
    function isShipSunk(shipSize) {
        return !shipLocations.some(loc => board[loc.row][loc.col] === shipSize); //בדיקה אם לפחות אחד מהאיברים במערך מקיים תנאי מסוים 
    }
    //בודקים כמה ספינות נשארו
    function updateRemainingShips() {
        remainingShipsElement.innerHTML = 'ספינות קרב שנותרו<br>';
        for (const [size, count] of Object.entries(remainingShips)) {    //משמשת להמיר אובייקט למערך של מערכים Object.entries
            remainingShipsElement.innerHTML += `גודל ${size}: ${count}<br>`;
        }
    }
    // מאתחל את הלוח
    for (let i = 0; i < boardSize; i++) {
        board[i] = [];
        for (let j = 0; j < boardSize; j++) {
            board[i][j] = 0;
        }
    }
    //משתמשים בפונקציות
    placeShipsRandomly(boardSize, shipCounts);
    renderBoard(boardSize);
    updateRemainingShips();
});