const STORAGE_KEY = 'bingo_pepe_state';
const gridContainer = document.getElementById('bingo-grid');
const resetBtn = document.getElementById('reset-btn');

let state = {
    cells: [], // { text: string, checked: boolean }
    initialized: false,
    victoryTriggered: false
};

async function init() {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (savedState) {
        state = JSON.parse(savedState);
        // Ensure new state properties exist for backward compatibility
        if (state.victoryTriggered === undefined) state.victoryTriggered = false;
        render();
    } else {
        await loadConfigAndShuffle();
    }

    resetBtn.addEventListener('click', handleReset);
}

async function loadConfigAndShuffle() {
    try {
        // Add cache-busting timestamp
        const response = await fetch(`config.json?t=${Date.now()}`);
        const config = await response.json();

        // Shuffle the config
        const shuffled = [...config].sort(() => Math.random() - 0.5);

        // Take first 16 (or all if less)
        state.cells = shuffled.slice(0, 16).map(text => ({
            text,
            checked: false
        }));

        state.initialized = true;
        state.victoryTriggered = false;
        saveState();
        render();
    } catch (error) {
        console.error('Failed to load config:', error);
        gridContainer.innerHTML = '<div class="loader">Error loading configuration.</div>';
    }
}

function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toggleCell(index) {
    state.cells[index].checked = !state.cells[index].checked;
    saveState();

    // Update only the specific cell DOM element
    const cellEl = document.querySelector(`[data-index="${index}"]`);
    if (cellEl) {
        cellEl.classList.toggle('checked', state.cells[index].checked);
    }

    checkBingo(true); // Pass true to allow victory trigger on click
}

function checkBingo(isManualClick = false) {
    const size = 4;
    const grid = [];
    for (let i = 0; i < size; i++) {
        grid.push(state.cells.slice(i * size, (i + 1) * size));
    }

    let winningIndices = new Set();

    // Check rows
    for (let r = 0; r < size; r++) {
        if (grid[r].every(cell => cell.checked)) {
            for (let c = 0; c < size; c++) winningIndices.add(r * size + c);
        }
    }

    // Check columns
    for (let c = 0; c < size; c++) {
        let colChecked = true;
        for (let r = 0; r < size; r++) {
            if (!grid[r][c].checked) colChecked = false;
        }
        if (colChecked) {
            for (let r = 0; r < size; r++) winningIndices.add(r * size + c);
        }
    }

    // Check diagonals
    let diag1Checked = true;
    for (let i = 0; i < size; i++) {
        if (!grid[i][i].checked) diag1Checked = false;
    }
    if (diag1Checked) {
        for (let i = 0; i < size; i++) winningIndices.add(i * size + i);
    }

    let diag2Checked = true;
    for (let i = 0; i < size; i++) {
        if (!grid[i][size - 1 - i].checked) diag2Checked = false;
    }
    if (diag2Checked) {
        for (let i = 0; i < size; i++) winningIndices.add(i * size + (size - 1 - i));
    }

    // Update winning cells visuals
    document.querySelectorAll('.bingo-cell').forEach((el, idx) => {
        el.classList.toggle('winning', winningIndices.has(idx));
    });

    // Trigger victory only if it's a manual click and victory hasn't been triggered yet for this bingo
    if (winningIndices.size > 0 && isManualClick && !state.victoryTriggered) {
        state.victoryTriggered = true;
        saveState();
        triggerVictory();
    } else if (winningIndices.size === 0) {
        // Reset victory flag if no bingo is present (user unchecked a cell)
        state.victoryTriggered = false;
        saveState();
    }
}

function triggerVictory() {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0ea5e9', '#6366f1', '#f43f5e']
    });
}

function handleReset() {
    if (confirm('Are you sure you want to reset the board? This will reshuffle everything.')) {
        localStorage.removeItem(STORAGE_KEY);
        // Reset local state object to be safe
        state = {
            cells: [],
            initialized: false,
            victoryTriggered: false
        };
        loadConfigAndShuffle();
    }
}

function render() {
    gridContainer.innerHTML = '';

    state.cells.forEach((cell, index) => {
        const cellEl = document.createElement('div');
        cellEl.className = `bingo-cell ${cell.checked ? 'checked' : ''}`;
        cellEl.textContent = cell.text;
        cellEl.setAttribute('data-index', index);
        cellEl.style.animationDelay = `${index * 0.05}s`;

        cellEl.addEventListener('click', () => toggleCell(index));

        gridContainer.appendChild(cellEl);
    });

    checkBingo(false); // Initial render check, don't trigger confetti
}

// Start the app
init();
