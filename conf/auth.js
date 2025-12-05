// conf/auth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";
import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// Konfigurasi Firebase Anda
const firebaseConfig = {
  apiKey: "AIzaSyApTkDJ5dGhvhcMmKqUZTXExYJmBb2sTa4",
  authDomain: "dulpan-adi-saragih.firebaseapp.com",
  projectId: "dulpan-adi-saragih",
  storageBucket: "dulpan-adi-saragih.firebasestorage.app",
  messagingSenderId: "954515293470",
  appId: "1:954515293470:web:19d5ea5cca079bb178f50f",
  measurementId: "G-DBS8XPPFZN"
};

// Inisialisasi Service
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app); 

// --- FUNGSI RENDER HALAMAN LOGIN ---
// Fungsi ini menangani tampilan saat user belum login
export function renderLoginPage(container) {
    container.innerHTML = `
        <div class="flex items-center justify-center min-h-[80vh] bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div class="text-center w-full max-w-sm px-6">
                <div class="bg-white dark:bg-gray-800 p-8 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700">
                    <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    <h3 class="text-2xl font-extrabold text-gray-800 dark:text-white mb-2">Selamat Datang</h3>
                    <p class="text-gray-500 dark:text-gray-400 mb-8 text-sm leading-relaxed">Silakan masuk untuk mulai mengelola keuangan harian Anda.</p>
                    
                    <button id="google-login-btn" class="w-full py-3.5 px-4 bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-700 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center justify-center shadow-sm gap-3">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5">
                        <span>Masuk dengan Google</span>
                    </button>
                </div>
                <p class="mt-8 text-xs text-gray-400">Dulpan Finance App v1.2</p>
            </div>
        </div>
    `;

    // Event Listener Login
    document.getElementById('google-login-btn')?.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            // Redirect atau perubahan UI akan ditangani otomatis oleh onAuthStateChanged di app.js
        } catch (error) {
            console.error("Login Error:", error);
            alert("Gagal masuk: " + error.message);
        }
    });
}

// Export agar bisa digunakan di main.js dan app.js
export { db, auth, app, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut };