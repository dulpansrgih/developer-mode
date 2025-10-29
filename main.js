// =======================================================
// === MODUL DAN ROUTING UTAMA (Global Scope) ===
// =======================================================
import { auth, logoutUser } from "./auth.js";
import { renderDashboard } from "./dashboard.js";

/* === ROUTING PAGES - Data Halaman Publik === */
const pages = {
  beranda: `
    <section class="animate-fadeIn">
      <h2 class="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">Selamat Datang di Kost Bu Yani Jogja</h2>
      <p class="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
        Kost Bu Yani Jogja adalah hunian nyaman dengan fasilitas lengkap dan lingkungan aman,
        cocok bagi mahasiswa dan pekerja muda yang mencari tempat tinggal strategis di Yogyakarta.
      </p>
    </section>`,
    "login": `
      <section class="animate-fadeIn max-w-sm mx-auto">
        <div class="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
          <div class="text-center mb-8">
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Selamat Datang</h2>
            <p class="text-gray-600 dark:text-gray-400 mt-2">Masuk ke panel admin</p>
          </div>
          <form id="loginForm" class="space-y-4">
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Email</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i data-lucide="mail" class="w-5 h-5"></i>
                </span>
                <input type="email" id="email" placeholder="nama@email.com" required 
                  class="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 
                  dark:focus:border-blue-600 dark:bg-gray-700 transition-colors">
              </div>
            </div>
            <div>
              <label class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Kata Sandi</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i data-lucide="lock" class="w-5 h-5"></i>
                </span>
                <input type="password" id="password" placeholder="Masukkan kata sandi" required 
                  class="w-full pl-10 pr-12 py-2 rounded-lg border border-gray-300 dark:border-gray-600 
                  focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600 focus:border-blue-500 
                  dark:focus:border-blue-600 dark:bg-gray-700 transition-colors">
                <button type="button" id="togglePassword" 
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors">
                  <i data-lucide="eye" class="w-5 h-5"></i>
                </button>
              </div>
            </div>
            <button type="submit" 
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg 
              py-2.5 transition-colors focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800">
              Masuk
            </button>
          </form>
          <div class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">atau</span>
            </div>
          </div>
          <button id="googleLoginBtn" 
            class="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 
            dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-50 
            dark:hover:bg-gray-700 transition-colors focus:ring-4 focus:ring-gray-200 dark:focus:ring-gray-700">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" class="w-5 h-5" alt="Google">
            <span>Masuk dengan Google</span>
          </button>
          <p id="loginMessage" class="text-center text-sm mt-4"></p>
        </div>
      </section>`,
  "data-penghuni": `
    <section class="animate-fadeIn"><h2 class="text-xl font-semibold text-blue-600 mb-3">Data Penghuni</h2>
    <table class="min-w-full border rounded-lg overflow-hidden">
    <thead class="bg-blue-50 dark:bg-gray-800"><tr><th class="px-4 py-2 text-left">Nama</th><th>Kamar</th><th>Status</th></tr></thead>
    <tbody class="divide-y divide-gray-200 dark:divide-gray-700"><tr><td class="px-4 py-2">Dulpan AS</td><td>A1</td><td class="text-green-600 font-semibold">Aktif</td></tr></tbody></table></section>`,
  "aturan-kost": `
    <section class="animate-fadeIn"><h2 class="text-xl font-semibold text-blue-600 mb-3">Aturan Kost</h2>
    <ul class="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
    <li>Menjaga kebersihan lingkungan.</li><li>Pembayaran setiap tanggal 5.</li><li>Dilarang membawa tamu menginap tanpa izin.</li></ul></section>`,
  "kontak": `
    <section class="animate-fadeIn"><h2 class="text-xl font-semibold text-blue-600 mb-3">Kontak Pengelola</h2>
    <p class="text-gray-700 dark:text-gray-300">📞 0812-3456-7890<br>📧 kostbuyani@gmail.com<br>📍 Yogyakarta</p></section>`,
  "syarat": `
    <section class="animate-fadeIn"><h2 class="text-2xl font-semibold text-blue-600 mb-3">Syarat & Ketentuan</h2>
    <ul class="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
    <li>Pengguna wajib menjaga privasi akun.</li><li>Dilarang menyalahgunakan layanan.</li><li>Admin dapat mengubah ketentuan sewaktu-waktu.</li></ul></section>`,
  "privasi": `
    <section class="animate-fadeIn"><h2 class="text-2xl font-semibold text-blue-600 mb-3">Kebijakan Privasi</h2>
    <p class="text-gray-700 dark:text-gray-300 leading-relaxed">Kami menghargai privasi pengguna. Data pribadi tidak akan dibagikan tanpa izin, kecuali untuk keperluan hukum atau operasional resmi KostBuYani.jogja.</p></section>`
};

const loadPage = (id) => {
  const mainContent = document.getElementById("main-content");
  mainContent.innerHTML = pages[id] || "<p class='p-6 text-gray-500'>Halaman tidak ditemukan.</p>";
  lucide.createIcons();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

function handleRoute() {
  const hash = location.hash.replace("#", "") || "beranda";
  const user = auth.currentUser;

  // If user tries to open dashboard but isn't logged, redirect to home
  if (hash === "dashboard") {
    if (!user) {
      // Redirect to homepage instead of showing login hash on reload
      location.hash = "beranda";
      return;
    }
    const main = document.getElementById("main-content");
    main.innerHTML = renderDashboard(user);
    lucide.createIcons();
    return;
  }

  // If already logged in, prevent showing the login page - redirect to dashboard
  if (hash === "login") {
    if (user) {
      location.hash = "dashboard";
      return;
    }
    loadPage("login");
    return;
  }

  loadPage(hash);
}

// =======================================================
// === EVENT LISTENER DAN LOGIC INIT (DOMContentLoaded Scope) ===
// =======================================================

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  
  // Password visibility toggle
  document.addEventListener('click', (e) => {
    if (e.target.closest('#togglePassword')) {
      const pwdInput = document.getElementById('password');
      const pwdIcon = e.target.closest('#togglePassword').querySelector('i');
      if (pwdInput.type === 'password') {
        pwdInput.type = 'text';
        pwdIcon.setAttribute('data-lucide', 'eye-off');
      } else {
        pwdInput.type = 'password';
        pwdIcon.setAttribute('data-lucide', 'eye');
      }
      lucide.createIcons();
    }
  });
  
  const themeToggle = document.getElementById("themeToggle");

  /* === THEME === */
  const setTheme = (mode) => {
    const html = document.documentElement;
    if (mode === "dark") {
      html.classList.add("dark");
      themeToggle.innerHTML = '<i data-lucide="sun"></i>';
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      themeToggle.innerHTML = '<i data-lucide="moon"></i>';
      localStorage.setItem("theme", "light");
    }
    lucide.createIcons();
  };
  const saved = localStorage.getItem("theme") || "light";
  setTheme(saved);
  themeToggle.onclick = () => {
    const current = document.documentElement.classList.contains("dark") ? "dark" : "light";
    setTheme(current === "dark" ? "light" : "dark");
  };

  /* === INIT ROUTING === */
  handleRoute(); 
  
  /* === WAKTU REALTIME === */
  setInterval(() => {
    const el = document.getElementById("datetime");
    if (el) {
      el.textContent = new Intl.DateTimeFormat("id-ID", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
        hour: "2-digit", minute: "2-digit", second: "2-digit"
      }).format(new Date()) + " WIB";
    }
  }, 1000);

  /* === SIDEBAR EVENT HANDLERS === */
  const rebindSidebarEvents = () => {
    const sidebar = document.getElementById("sidebar");
    const toggleSidebar = document.getElementById("toggleSidebar");
    const closeSidebar = document.getElementById("closeSidebar");
    const overlay = document.getElementById("overlay");

    if (!sidebar || !toggleSidebar) return;

    toggleSidebar.onclick = () => {
      sidebar.classList.remove("-translate-x-full");
      overlay.classList.remove("hidden");
    };

    closeSidebar.onclick = () => {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    };

    overlay.onclick = () => {
      sidebar.classList.add("-translate-x-full");
      overlay.classList.add("hidden");
    };

    document.querySelectorAll(".menu-link, .submenu-link").forEach(link => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const id = link.getAttribute("href").replace("#", "");
        location.hash = id;
        sidebar.classList.add("-translate-x-full");
        overlay.classList.add("hidden");
      });
    });
  };

  setTimeout(rebindSidebarEvents, 200);

  /* === TOMBOL ADMIN/LOGIN === */
  const adminButton = document.getElementById("adminButton");
  if (adminButton) {
    adminButton.onclick = () => {
      const user = auth.currentUser;
      location.hash = user ? "dashboard" : "login";
    };
  }
});

// Event listener untuk hashchange
window.addEventListener("hashchange", handleRoute);

// Tombol logout (untuk dropdown di header)
document.addEventListener("click", async (e) => {
  if (e.target.id === "logoutBtn" || e.target.id === "logoutBtnHeader") {
    await logoutUser();
  }
});