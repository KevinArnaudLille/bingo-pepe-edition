const STORAGE_KEY = 'bingo_pepe_state';
const gridContainer = document.getElementById('bingo-grid');
const resetBtn = document.getElementById('reset-btn');

let state = {
    cells: [], // { text: string, checked: boolean }
    initialized: false
};

async function init() {
    const savedState = localStorage.getItem(STORAGE_KEY);
    
    if (savedState) {
        state = JSON.parse(savedState);
        render();
    } else {
        await loadConfigAndShuffle();
    }
    
    resetBtn.addEventListener('click', handleReset);
}

async function loadConfigAndShuffle() {
    try {
        const response = await fetch('config.json');
        const config = await response.json();
        
        // Shuffle the config
        const shuffled = [...config].sort(() => Math.random() - 0.5);
        
        // Take first 16 (or all if less)
        state.cells = shuffled.slice(0, 16).map(text => ({
            text,
            checked: false
        }));
        
        state.initialized = true;
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
    render();
}

function handleReset() {
    if (confirm('Are you sure you want to reset the board? This will reshuffle everything.')) {
        localStorage.removeItem(STORAGE_KEY);
        loadConfigAndShuffle();
    }
}

function render() {
    gridContainer.innerHTML = '';
    
    state.cells.forEach((cell, index) => {
        const cellEl = document.createElement('div');
        cellEl.className = `bingo-cell ${cell.checked ? 'checked' : ''}`;
        cellEl.textContent = cell.text;
        cellEl.style.animationDelay = `${index * 0.05}s`;
        
        cellEl.addEventListener('click', () => toggleCell(index));
        
        gridContainer.appendChild(cellEl);
    });
}

// Start the app
init();
