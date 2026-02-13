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

function saveNote() {
    const filenameInput = document.getElementById('filename');
    const headingInput = document.getElementById('heading');
    const bodyInput = document.getElementById('body');
    const conclusionInput = document.getElementById('conclusion');

    const filename = filenameInput.value.trim() || 'untitled-note';
    const heading = headingInput.value;
    const body = bodyInput.value;
    const conclusion = conclusionInput.value;

    const content = `Heading: ${heading}\n\n${body}\n\nConclusion: ${conclusion}`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');

    a.href = url;
    a.download = `${filename}.txt`;
    document.body.appendChild(a);
    a.click();

    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Refresh the page immediately as requested
    setTimeout(() => {
        location.reload();
    }, 100);
}
