import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/12.3.0/firebase-firestore.js";
import { auth, db, appId } from './firebase-config.js';
import { attachFirestoreListeners, detachFirestoreListeners } from './data.js';
import { setButtonLoadingState, showInfoModal } from './ui.js';

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginView = document.getElementById('login-view');
const registerView = document.getElementById('register-view');

let userId = null;
let currentUserNome = '';
let currentUserRole = 'Utilizador';

function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorDiv = document.getElementById('login-error');
    const button = document.getElementById('login-btn');

    errorDiv.classList.add('hidden');
    setButtonLoadingState(button, true, "A entrar...");

    signInWithEmailAndPassword(auth, email, password)
        .catch(error => {
            console.error('Erro de login:', error.message);
            errorDiv.textContent = 'Email ou password inválidos ou conta pendente.';
            errorDiv.classList.remove('hidden');
        })
        .finally(() => {
            setButtonLoadingState(button, false, 'Entrar');
        });
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorDiv = document.getElementById('register-error');
    const button = e.currentTarget.querySelector('button[type="submit"]');

    errorDiv.classList.add('hidden');
    setButtonLoadingState(button, true, "A registar...");

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const userDocRef = doc(db, 'artifacts', appId, 'public/data/utilizadores', user.uid);
        await setDoc(userDocRef, {
            nome: name,
            email: email,
            funcao: 'Utilizador',
            status: 'aprovado'
        });
         await signOut(auth);

        showInfoModal('Registo Concluído', 'A sua conta aguarda aprovação de um administrador.');
        registerView.classList.add('hidden');
        loginView.classList.remove('hidden');
        document.getElementById('register-form').reset();


    } catch (error) {
        console.error('Erro de registo:', error.message);
        if (error.code === 'auth/email-already-in-use') {
             errorDiv.innerHTML = 'Este email já está a ser utilizado. <a href="#" id="switch-to-login-from-register" class="font-bold underline">Tente fazer login.</a>';
             document.getElementById('switch-to-login-from-register').addEventListener('click', (e) => {
                e.preventDefault();
                registerView.classList.add('hidden');
                loginView.classList.remove('hidden');
             });
        } else {
            errorDiv.textContent = 'Não foi possível criar a conta. Tente novamente.';
        }
         errorDiv.classList.remove('hidden');
    } finally {
        setButtonLoadingState(button, false, 'Registar');
    }
}


function handleLogout() {
    signOut(auth).catch(error => console.error('Erro ao terminar sessão:', error));
}

function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-password-email').value;
    const errorDiv = document.getElementById('forgot-password-error');
    const button = document.getElementById('forgot-password-btn');

    errorDiv.classList.add('hidden');

    if (!email) {
        errorDiv.textContent = 'Por favor, insira o seu email para recuperar a senha.';
        errorDiv.classList.remove('hidden');
        return;
    }

    setButtonLoadingState(button, true, "A enviar...");

    sendPasswordResetEmail(auth, email)
        .then(() => {
             showInfoModal('Recuperação de Senha', 'Email de recuperação enviado! Verifique a sua caixa de entrada.');
             forgotPasswordView.classList.add('hidden');
             loginView.classList.remove('hidden');
        })
        .catch((error) => {
            console.error('Erro ao enviar email de recuperação:', error);
            errorDiv.textContent = 'Não foi possível enviar o email. Verifique se o email está correto.';
            errorDiv.classList.remove('hidden');
        })
        .finally(() => {
            setButtonLoadingState(button, false, 'Enviar Email de Recuperação');
        });
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('login-password');
    const toggleIcon = document.getElementById('password-toggle');
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

async function firebaseAuth() {
    onAuthStateChanged(auth, async (user) => {
       if (user) {
           const userDocRef = doc(db, 'artifacts', appId, 'public/data/utilizadores', user.uid);
           const docSnap = await getDoc(userDocRef);

           if (docSnap.exists() && docSnap.data().status === 'aprovado') {
               userId = user.uid;
               const userData = docSnap.data();
               currentUserNome = userData.nome || user.email.split('@')[0];
               currentUserRole = userData.funcao || 'Utilizador';

               authContainer.classList.add('hidden');
               appContainer.classList.remove('hidden');
               appContainer.classList.add('flex');

               document.getElementById('user-email').textContent = user.email;
               document.getElementById('user-name').textContent = currentUserNome;
               const userInitial = currentUserNome ? currentUserNome.charAt(0).toUpperCase() : 'U';
               document.getElementById('user-avatar').src = `https://placehold.co/40x40/059669/ffffff?text=${userInitial}`;

               attachFirestoreListeners();
           } else {
               await signOut(auth);
               const errorDiv = document.getElementById('login-error');
               errorDiv.textContent = docSnap.exists() ? 'A sua conta aguarda aprovação.' : 'Utilizador não encontrado.';
               errorDiv.classList.remove('hidden');
           }
       } else {
           userId = null;
           currentUserNome = '';
           currentUserRole = 'Utilizador';

           authContainer.classList.remove('hidden');
           appContainer.classList.add('hidden');
           appContainer.classList.remove('flex');

           detachFirestoreListeners();
       }
   });
}

function getUserId() {
    return userId;
}

function getCurrentUserNome() {
    return currentUserNome;
}

function getCurrentUserRole() {
    return currentUserRole;
}

export {
    handleLogin,
    handleRegister,
    handleLogout,
    handleForgotPassword,
    togglePasswordVisibility,
    firebaseAuth,
    getUserId,
    getCurrentUserNome,
    getCurrentUserRole
};
