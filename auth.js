// === FIREBASE AUTH CONFIGURATION ===
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";

// === KONFIGURASI FIREBASE ===
const firebaseConfig = {
  apiKey: "AIzaSyBr0KXohh0kjTo6LbQimSj_oLC_1-4JFI8",
  authDomain: "kostputrabuyanijogja.firebaseapp.com",
  projectId: "kostputrabuyanijogja",
  storageBucket: "kostputrabuyanijogja.appspot.com",
  messagingSenderId: "538188330415",
  appId: "1:538188330415:web:48af3661a089a7a4342b5a",
  measurementId: "G-N62YJ8J4WJ"
};

// === INISIALISASI APP DAN AUTH ===
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// === LOGIN EMAIL DAN PASSWORD ===
export async function loginUser(email, password) {
  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.hash = "dashboard";
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      alert("⚠️ Akun tidak ditemukan. Silakan periksa kembali email Anda.");
    } else if (err.code === "auth/wrong-password") {
      alert("🔒 Kata sandi salah. Silakan coba lagi.");
    } else {
      alert("Login gagal: " + err.message);
    }
  }
}

// === LOGIN MENGGUNAKAN GOOGLE ===
export async function loginWithGoogle() {
  try {
    await signInWithPopup(auth, provider);
    location.hash = "dashboard";
  } catch (err) {
    alert("Login Google gagal: " + err.message);
  }
}

// === LOGOUT USER ===
export async function logoutUser() {
  try {
    await signOut(auth);
    document.getElementById("profileDropdown")?.remove();
    alert("Anda telah logout.");
    location.hash = "login";
  } catch (err) {
    alert("Gagal logout: " + err.message);
  }
}

// === MONITOR PERUBAHAN STATUS LOGIN ===
export function watchAuth(callback) {
  onAuthStateChanged(auth, callback);
}

// === TAMPILKAN STATUS USER DI HEADER ===
watchAuth((user) => {
  const adminButton = document.getElementById("adminButton");
  if (!adminButton) return;

  // Hapus dropdown lama (jika ada)
  document.getElementById("profileDropdown")?.remove();

  if (user) {
    // Jika login, tampilkan foto profil
    const photo = user.photoURL || "assets/images/default-profile.png";
    adminButton.innerHTML = `
      <img src="${photo}" alt="Profile" class="w-9 h-9 rounded-full border border-blue-400 object-cover cursor-pointer" id="profileAvatar">
    `;

    // === DROPDOWN PROFIL ===
    adminButton.onclick = (e) => {
      e.stopPropagation();
      const existing = document.getElementById("profileDropdown");
      if (existing) return existing.remove();

      adminButton.style.position = "relative";
      const dropdown = document.createElement("div");
      dropdown.id = "profileDropdown";
      dropdown.className = `
        absolute right-0 top-[110%] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
        rounded-xl shadow-lg p-3 w-56 z-[9999] animate-fadeIn
      `;
      dropdown.innerHTML = `
        <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-2">
          <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">${user.email}</p>
          <p class="text-xs text-gray-500">Admin</p>
        </div>
        <ul class="text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li><a href="#dashboard" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition">
            <i data-lucide="layout-dashboard" class="w-4 h-4"></i> Dashboard</a></li>
          <li><a href="#notifikasi" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition">
            <i data-lucide="bell" class="w-4 h-4"></i> Pemberitahuan</a></li>
          <li><a href="#pengaturan" class="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition">
            <i data-lucide="settings" class="w-4 h-4"></i> Pengaturan</a></li>
        </ul>
        <div class="border-t border-gray-200 dark:border-gray-700 mt-2 pt-2">
          <button id="logoutBtnHeader" class="w-full bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 text-sm font-medium transition">
            Keluar
          </button>
        </div>
      `;
      adminButton.appendChild(dropdown);
      lucide.createIcons();

      // Tutup dropdown bila klik di luar
      document.addEventListener("click", (ev) => {
        if (!adminButton.contains(ev.target)) dropdown.remove();
      });

      // Tombol logout di dropdown
      document.getElementById("logoutBtnHeader").onclick = () => logoutUser();
    };
  } else {
    // Jika belum login
    adminButton.innerHTML = "Masuk";
    adminButton.onclick = () => (location.hash = "login");
  }
});

// === EVENT LISTENER UNTUK FORM LOGIN ===
document.addEventListener("submit", async (e) => {
  if (e.target.id === "loginForm") {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    await loginUser(email, password);
  }
});

// === EVENT LISTENER UNTUK LOGIN GOOGLE ===
document.addEventListener("click", (e) => {
  if (e.target.id === "googleLoginBtn") {
    loginWithGoogle();
  }
});