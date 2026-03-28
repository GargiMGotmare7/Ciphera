// 1. Config
const firebaseConfig = { /* Your Config Here */ };
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. State Variables
let userId, roomId, roomKey, isDecoded = false;

// 3. Event Listeners (The "Modern" Way)
document.getElementById('loginBtn').addEventListener('click', login);
document.getElementById('sendBtn').addEventListener('click', sendMessage);
document.getElementById('unlockBtn').addEventListener('click', toggleSecretInput);
// ... add listeners for all other buttons ...

// 4. Functions (Paste your login, createGroup, listenMessages functions here)
function login() { /* ... */ }
function sendMessage() { /* ... */ }

// Function to transition from Home to Login
document.getElementById('enterBtn').addEventListener('click', () => {
    const hero = document.getElementById('hero');
    const auth = document.getElementById('authBox');

    // Simple fade transition
    hero.style.transition = "opacity 0.5s ease";
    hero.style.opacity = "0";

    setTimeout(() => {
        hero.style.display = "none";
        auth.style.display = "block";
        auth.style.opacity = "0";
        // Fade in the auth box
        setTimeout(() => { auth.style.opacity = "1"; }, 10);
    }, 500);
});