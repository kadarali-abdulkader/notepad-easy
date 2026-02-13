document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-btn');

    saveBtn.addEventListener('click', () => {
        const heading = document.getElementById('heading').value.trim();
        const body = document.getElementById('body').value.trim();
        const conclusion = document.getElementById('conclusion').value.trim();
        let filename = document.getElementById('filename').value.trim();

        // Validation
        if (!heading && !body && !conclusion) {
            alert('Please enter some content before saving.');
            return;
        }

        // Default filename if empty
        if (!filename) {
            filename = 'my-note';
        }

        // Remove file extension if user added it manually
        filename = filename.replace(/\.txt$/, '');

        // Current Date/Time
        const now = new Date();
        const dateStr = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();

        // Construct content
        let content = '';
        if (heading) content += `TITLE: ${heading}\n`;
        content += `DATE: ${dateStr}\n`;
        content += `==========================================\n\n`;
        if (body) content += `${body}\n\n`;
        if (conclusion) {
            content += `==========================================\n`;
            content += `CONCLUSION:\n${conclusion}\n`;
        }

        // Create Blob
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);

        // Create Anchor link to download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}.txt`;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
