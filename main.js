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
      <section class="animate-fadeIn max-w-sm mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow">
        <h2 class="text-2xl font-semibold text-blue-600 mb-3 text-center">Masuk Admin</h2>
        <form id="loginForm" class="space-y-3">
          <input type="email" id="email" placeholder="Email" required class="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400 dark:bg-gray-700">
          <input type="password" id="password" placeholder="Kata Sandi" required class="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-400 dark:bg-gray-700">
          <button type="submit" class="w-full bg-blue-600 text-white rounded-lg py-2 hover:bg-blue-700 transition">Masuk</button>
        </form>
        <div class="text-center mt-4">
          <p class="text-sm text-gray-500 mb-2">Atau masuk dengan</p>
          <button id="googleLoginBtn" class="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white rounded-lg py-2 transition">
            <i data-lucide="mail"></i> Google
          </button>
        </div>
        <p id="loginMessage" class="text-center text-sm mt-3"></p>
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
  
  if (hash === "dashboard") {
    const user = auth.currentUser;
    if (!user) {
      alert("⚠️ Anda tidak diberikan akses ke Dashboard. Silakan login terlebih dahulu.");
      location.hash = "login";
      return;
    }
    const main = document.getElementById("main-content");
    main.innerHTML = renderDashboard(user);
    lucide.createIcons();
  } else {
    loadPage(hash); 
  }
}

// =======================================================
// === EVENT LISTENER DAN LOGIC INIT (DOMContentLoaded Scope) ===
// =======================================================

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();
  
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