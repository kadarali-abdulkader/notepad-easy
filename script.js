function setTheme(themeName) {
    if (themeName === 'light') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', themeName);
    }
    localStorage.setItem('theme', themeName);
}

// Load saved theme on startup
(function () {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    }
})();

// History Management
let notesHistory = JSON.parse(localStorage.getItem('notesHistory')) || [];
let currentNoteId = null; // Track currently open note ID

function saveToHistory(filename, heading, body) {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB').replace(/\//g, '-'); // Format: DD-MM-YYYY
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newNote = {
        id: Date.now(),
        filename,
        heading,
        body,
        date: dateStr,
        time: timeStr
    };

    notesHistory.unshift(newNote); // Add to beginning
    localStorage.setItem('notesHistory', JSON.stringify(notesHistory));
    renderHistory();
    return newNote.id; // Return ID for context
}

function updateHistory(id, filename, heading, body) {
    const noteIndex = notesHistory.findIndex(note => note.id === id);
    if (noteIndex !== -1) {
        // Update fields
        notesHistory[noteIndex].filename = filename;
        notesHistory[noteIndex].heading = heading;
        notesHistory[noteIndex].body = body;

        // Optional: Update timestamp? Keeping original date for "History" grouping usually better, 
        // or update 'time' field. Let's keep date, update time.
        const now = new Date();
        notesHistory[noteIndex].time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        localStorage.setItem('notesHistory', JSON.stringify(notesHistory));
        renderHistory();
    }
}

function renderHistory(filterText = '') {
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';

    // Filter notes based on search
    const filteredNotes = notesHistory.filter(note => {
        const searchText = filterText.toLowerCase();
        return (
            note.filename.toLowerCase().includes(searchText) ||
            note.heading.toLowerCase().includes(searchText) ||
            note.body.toLowerCase().includes(searchText)
        );
    });

    // Group by Date
    const groupedNotes = filteredNotes.reduce((groups, note) => {
        if (!groups[note.date]) {
            groups[note.date] = [];
        }
        groups[note.date].push(note);
        return groups;
    }, {});

    // Render Groups
    const shouldExpand = filterText.length > 0;

    for (const [date, notes] of Object.entries(groupedNotes)) {
        const dateGroup = document.createElement('div');
        dateGroup.className = 'date-group';

        const dateHeader = document.createElement('div');
        dateHeader.className = 'date-header';
        dateHeader.innerText = `📅 ${date} (${notes.length})`;
        dateHeader.onclick = () => {
            const list = dateGroup.querySelector('.note-items-container');
            list.style.display = list.style.display === 'none' ? 'block' : 'none';
        };

        const itemsContainer = document.createElement('div');
        itemsContainer.className = 'note-items-container';
        itemsContainer.style.display = shouldExpand ? 'block' : 'none';

        notes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item';

            // Highlight matching text in display
            const displayFilename = highlightText(note.filename, filterText);
            const displayHeading = highlightText(note.heading, filterText);

            noteItem.innerHTML = `
                <h4>${displayFilename}</h4>
                <p>${displayHeading}</p>
            `;
            noteItem.onclick = () => loadNote(note);
            itemsContainer.appendChild(noteItem);
        });

        dateGroup.appendChild(dateHeader);
        dateGroup.appendChild(itemsContainer);
        historyList.appendChild(dateGroup);
    }
}

function highlightText(text, filter) {
    if (!filter) return text;
    const regex = new RegExp(`(${filter})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

function loadNote(note) {
    currentNoteId = note.id; // Set current ID for editing
    document.getElementById('filename').value = note.filename;
    document.getElementById('heading').value = note.heading;
    document.getElementById('body').value = note.body;

    // Optional: Visual cue that we are editing?
    // Could change Save button text, but keeping it simple for now.
}

function newNote() {
    // Reloads the page to clear everything and start fresh
    location.reload();
}

function filterHistory() {
    const searchText = document.getElementById('history-search').value;
    renderHistory(searchText);
}

// Initial Render
renderHistory();

async function saveNote() {
    const filenameInput = document.getElementById('filename');
    const headingInput = document.getElementById('heading');
    const bodyInput = document.getElementById('body');

    const filename = filenameInput.value.trim() || 'untitled-note';
    const heading = headingInput.value;
    const body = bodyInput.value;

    const content = `Heading: ${heading}\n\n${body}`;

    // Logic: If currentNoteId exists, Update. Else, Create New.
    if (currentNoteId) {
        updateHistory(currentNoteId, filename, heading, body);
        // Note: We do NOT reload the page on Update, so user can keep working.
        // We still trigger the file download/save dialog so they can save the file to disk.
    } else {
        saveToHistory(filename, heading, body);
    }

    // Modern browsers: Try using the File System Access API
    if (window.showSaveFilePicker) {
        try {
            const handle = await window.showSaveFilePicker({
                suggestedName: filename + '.txt',
                types: [{
                    description: 'Text Files',
                    accept: { 'text/plain': ['.txt'] },
                }],
            });
            const writable = await handle.createWritable();
            await writable.write(content);
            await writable.close();

            // Only reload if it was a NEW note. If editing, we stay on page.
            if (!currentNoteId) {
                location.reload();
            } else {
                alert('Note updated successfully!');
            }
        } catch (err) {
            // User likely cancelled save or error occurred.
            // If they cancelled, we probably shouldn't refresh immediately
            // unless we strictly follow "when click save note button, immediately refresh".
            // However, interrupting the workflow on cancel is bad UX.
            // But to be safe and literal to the user request "immediately refresh the page and show new", 
            // the refresh is likely intended as a 'reset' for a new note.
            // Let's only reload on success to avoid data loss on accidental cancel.
            if (err.name !== 'AbortError') {
                console.error(err);
                alert('Failed to save file using Save As dialog.');
            }
        }
    } else {
        // Fallback for browsers that don't support showSaveFilePicker
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = `${filename}.txt`;
        document.body.appendChild(a);
        a.click();

        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Immediate refresh for fallback
        setTimeout(() => {
            location.reload();
        }, 100);
    }
}
