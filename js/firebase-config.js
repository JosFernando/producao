// Importações do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";

// Configuração do Firebase
const firebaseConfig = {
    apiKey: "__REPLACE_WITH_YOUR_API_KEY__",
    authDomain: "plataforma-gestao-narisrec.firebaseapp.com",
    projectId: "plataforma-gestao-narisrec",
    storageBucket: "plataforma-gestao-narisrec.appspot.com",
    messagingSenderId: "176814130489",
    appId: "1:176814130489:web:dc5e2e51afd274da0094e8",
    measurementId: "G-B4NPG8M822"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const appId = firebaseConfig.appId;

export { db, auth, appId };
