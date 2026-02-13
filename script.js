document.addEventListener('DOMContentLoaded', () => {
    const saveBtn = document.getElementById('save-btn');

    saveBtn.addEventListener('click', async () => {
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

        try {
            // Check if File System Access API is supported
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `${filename}.txt`,
                    types: [{
                        description: 'Text Files',
                        accept: { 'text/plain': ['.txt'] },
                    }],
                });

                const writable = await handle.createWritable();
                await writable.write(content);
                await writable.close();

                // Refresh immediately after successful save
                location.reload();
            } else {
                // Fallback for browsers that don't support the API
                const blob = new Blob([content], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);

                const a = document.createElement('a');
                a.href = url;
                a.download = `${filename}.txt`;
                document.body.appendChild(a);
                a.click();

                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // Refresh after a short delay to allow download to start
                setTimeout(() => {
                    location.reload();
                }, 1000);
            }
        } catch (err) {
            // User cancelled the picker or an error occurred
            if (err.name !== 'AbortError') {
                console.error('Failed to save file:', err);
                alert('An error occurred while saving the file.');
            }
        }
    });
});
