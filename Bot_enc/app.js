// 1. INITIALIZE FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyAqBq5P0It0bUcugEN6XxNM9DaO7JtFans",
    authDomain: "ciphera-1.firebaseapp.com",
    projectId: "ciphera-1",
    storageBucket: "ciphera-1.firebasestorage.app",
    messagingSenderId: "562339080162",
    appId: "1:562339080162:web:027e5fa3066dea8131bbbb"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. STATE
let userId, roomId, roomKey, isDecoded = false, allMessages = [], unsubscribeMessages = null;

// 3. THEME ENGINE
function setTheme(theme) {
    const root = document.documentElement;
    const themes = {
        blue: { accent: '#38bdf8', secondary: '#c084fc', bg: '#020617' },
        pink: { accent: '#f472b6', secondary: '#fb7185', bg: '#0f0505' },
        green: { accent: '#4ade80', secondary: '#2dd4bf', bg: '#050f05' },
        gold: { accent: '#fbbf24', secondary: '#f59e0b', bg: '#0f0a05' }
    };
    root.style.setProperty('--accent', themes[theme].accent);
    root.style.setProperty('--secondary', themes[theme].secondary);
    root.style.setProperty('--bg', themes[theme].bg);
    localStorage.setItem("preferredTheme", theme);
}
setTheme(localStorage.getItem("preferredTheme") || 'blue');

// 4. AUTH & NAVIGATION
auth.onAuthStateChanged(user => {
    if (user) {
        userId = user.uid;
        document.getElementById("myUidDisplay").innerText = userId;
        document.getElementById("hero").style.display = "none";
        document.getElementById("authBox").style.display = "none";
        document.getElementById("app").style.display = "flex";
        loadGroups();
    } else {
        document.getElementById("hero").style.display = "flex";
        document.getElementById("app").style.display = "none";
    }
});

document.getElementById('enterBtn').addEventListener('click', () => {
    document.getElementById('hero').style.display = 'none';
    document.getElementById('authBox').style.display = 'block';
});

document.getElementById('googleLoginBtn').addEventListener('click', () => auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()));
document.getElementById('loginBtn').addEventListener('click', () => auth.signInWithEmailAndPassword(email.value, password.value));
document.getElementById('signupLink').addEventListener('click', () => auth.createUserWithEmailAndPassword(email.value, password.value));
document.getElementById('logoutBtn').addEventListener('click', () => auth.signOut().then(() => location.reload()));

// 5. MODAL CONTROL
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }
document.getElementById('openGroupModalBtn').addEventListener('click', () => openModal('groupModal'));
document.getElementById('openFriendModalBtn').addEventListener('click', () => openModal('friendModal'));

// 6. GROUPS & FRIENDS
document.getElementById('confirmGroupBtn').addEventListener('click', async () => {
    const name = document.getElementById("newGroupName").value;
    if(!name) return;
    const g = await db.collection("groups").add({ name, members: [userId], createdAt: Date.now() });
    closeModal('groupModal');
    switchGroup(g.id, name);
});

document.getElementById('confirmFriendBtn').addEventListener('click', async () => {
    const fUid = document.getElementById("friendUid").value;
    if(!fUid || !roomId) return alert("Select a group first!");
    await db.collection("groups").doc(roomId).update({ members: firebase.firestore.FieldValue.arrayUnion(fUid) });
    closeModal('friendModal');
    alert("Friend Added!");
});

function loadGroups() {
    db.collection("groups").where("members", "array-contains", userId).onSnapshot(sn => {
        const list = document.getElementById("groupList");
        list.innerHTML = "";
        sn.forEach(doc => {
            const data = doc.data();
            const div = document.createElement("div");
            div.className = `group-item ${roomId === doc.id ? 'active-group' : ''}`;
            div.innerHTML = `<b>${data.name}</b>`;
            div.onclick = () => switchGroup(doc.id, data.name);
            list.appendChild(div);
        });
    });
}

function switchGroup(id, name) {
    roomId = id;
    document.getElementById("activeGroupName").innerText = name;
    document.getElementById("roomDisplay").innerText = id;
    listenMessages();
}

// 7. CHAT & ENCRYPTION
function toggleSecretInput() {
    const box = document.getElementById("lockerRoom");
    box.style.display = (box.style.display === "none") ? "block" : "none";
}
document.getElementById('unlockBtn').addEventListener('click', toggleSecretInput);

function applyKey() {
    roomKey = document.getElementById("masterKey").value;
    if(!roomKey) return;
    isDecoded = true;
    document.getElementById("lockerRoom").style.display = "none";
    renderAllMessages();
}
document.getElementById('applyKeyBtn').addEventListener('click', applyKey);

function renderAllMessages() {
    const chatBox = document.getElementById("chatBox"); chatBox.innerHTML = "";
    allMessages.forEach(m => {
        let d = document.createElement("div"); d.className = "message " + (m.sender === userId ? "sent" : "received");
        let content = isDecoded ? decrypt(m.text) : `<span style="opacity:0.2;">Encrypted</span>`;
        d.innerHTML = `<div>${content}</div>`;
        chatBox.appendChild(d);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

function decrypt(text) {
    try {
        const bytes = CryptoJS.AES.decrypt(text, roomKey);
        return bytes.toString(CryptoJS.enc.Utf8) || "???";
    } catch(e) { return "???"; }
}

function sendMessage() {
    if(!roomId || !isDecoded) return alert("Unlock first!");
    let input = document.getElementById("inputText");
    if(!input.value.trim()) return;
    db.collection("groups").doc(roomId).collection("messages").add({
        text: CryptoJS.AES.encrypt(input.value, roomKey).toString(),
        sender: userId,
        time: Date.now()
    });
    input.value = "";
}
document.getElementById('sendBtn').addEventListener('click', sendMessage);

function listenMessages() {
    if(unsubscribeMessages) unsubscribeMessages();
    unsubscribeMessages = db.collection("groups").doc(roomId).collection("messages").orderBy("time", "asc").onSnapshot(sn => {
        allMessages = []; sn.forEach(doc => allMessages.push(doc.data())); renderAllMessages();
    });
}