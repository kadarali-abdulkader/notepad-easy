import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// TODO: REPLACE WITH YOUR FIREBASE CONFIGURATION
// 1. Go to console.firebase.google.com
// 2. Create a new project
// 3. Add a Web App
// 4. Copy the config object below
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
let app;
let auth;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
} catch (error) {
    console.error("Firebase initialization failed. Did you update the config?", error);
    // Optionally alert the user if config is still default
    if (firebaseConfig.apiKey === "YOUR_API_KEY") {
        alert("Please update script.js with your valid Firebase Configuration to enable Google Sign-In.");
    }
}

// DOM Elements
const loginOverlay = document.getElementById('login-overlay');
const appContainer = document.getElementById('app-container');
const googleSigninBtn = document.getElementById('google-signin-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const userPhoto = document.getElementById('user-photo');
const userName = document.getElementById('user-name');
const saveBtn = document.getElementById('save-btn');
const themeSelector = document.getElementById('theme-selector');

// Theme Management
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme !== 'light') {
    document.body.classList.add(`theme-${currentTheme}`);
    themeSelector.value = currentTheme;
}

themeSelector.addEventListener('change', (e) => {
    const selectedTheme = e.target.value;

    // Remove all theme classes
    document.body.classList.remove('theme-dark', 'theme-midnight', 'theme-nature');

    // Add new theme class if not light (default)
    if (selectedTheme !== 'light') {
        document.body.classList.add(`theme-${selectedTheme}`);
    }

    // Save preference
    localStorage.setItem('theme', selectedTheme);
});

// Authentication State Observer
if (auth) {
    onAuthStateChanged(auth, (user) => {
        if (user) {
            // User is signed in
            console.log("User signed in:", user.email);
            showApp(user);
        } else {
            // User is signed out
            console.log("User signed out");
            showLogin();
        }
    });
}

// Sign In Function
googleSigninBtn.addEventListener('click', () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
        .then((result) => {
            // Successful sign-in handled by onAuthStateChanged
        }).catch((error) => {
            console.error("Sign in error:", error);
            alert("Sign in failed: " + error.message);
        });
});

// Sign Out Function
signOutBtn.addEventListener('click', () => {
    if (!auth) return;
    signOut(auth).then(() => {
        // Sign-out successful.
    }).catch((error) => {
        console.error("Sign out error:", error);
    });
});

function showApp(user) {
    loginOverlay.style.display = 'none';
    appContainer.style.display = 'block';

    // Update User Info
    userName.textContent = user.displayName || user.email;
    if (user.photoURL) {
        userPhoto.src = user.photoURL;
        userPhoto.style.display = 'block';
    } else {
        userPhoto.style.display = 'none';
    }
}

function showLogin() {
    loginOverlay.style.display = 'flex';
    appContainer.style.display = 'none';
}

// ----- Note Saving Logic (Existing) -----

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
        // Check if writable file system is supported
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
            // Fallback
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `${filename}.txt`;
            document.body.appendChild(a);
            a.click();

            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Refresh after a short delay
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
