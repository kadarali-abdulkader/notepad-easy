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

async function saveNote() {
    const filenameInput = document.getElementById('filename');
    const headingInput = document.getElementById('heading');
    const bodyInput = document.getElementById('body');
    const conclusionInput = document.getElementById('conclusion');

    const filename = filenameInput.value.trim() || 'untitled-note';
    const heading = headingInput.value;
    const body = bodyInput.value;
    const conclusion = conclusionInput.value;

    const content = `Heading: ${heading}\n\n${body}\n\nConclusion: ${conclusion}`;

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

            // Success - proceed to refresh to "show new"
            location.reload();
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
