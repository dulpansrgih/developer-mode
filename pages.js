document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;

  const sidebarHTML = `
  <aside id="sidebar"
    class="fixed top-0 left-0 w-[85%] sm:w-[65%] md:w-[45%] lg:w-[30%] max-w-sm h-full
    bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800
    transform -translate-x-full transition-transform duration-300 ease-in-out
    z-[90] shadow-2xl flex flex-col">

    <div class="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-950 border-b border-blue-100 dark:border-gray-800 p-4 flex justify-between items-center">
      <div class="flex items-center gap-2">
        <i data-lucide="clock" class="text-blue-600 dark:text-blue-400 w-5 h-5"></i>
        <p id="datetime" class="text-sm font-semibold text-gray-700 dark:text-gray-300">Memuat waktu...</p>
      </div>
      <button id="closeSidebar" class="text-gray-600 dark:text-gray-300 hover:text-blue-600 transition"><i data-lucide="x"></i></button>
    </div>

    <nav class="flex-1 overflow-y-auto p-3 font-medium space-y-2">
      <a href="#beranda" class="menu-link flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition"><i data-lucide="home"></i>Beranda</a>

      <div class="relative py-2"><div class="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div></div>

      <button id="toggleDropdown" class="flex items-center justify-between w-full p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition">
        <div class="flex items-center gap-3"><i data-lucide="users"></i>Informasi Penghuni</div>
        <i id="dropdownIcon" data-lucide="chevron-down" class="transition-transform"></i>
      </button>
      <div id="dropdownContent" class="hidden pl-8 space-y-1.5">
        <a href="#data-penghuni" class="submenu-link flex items-center gap-2 py-2 px-3 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition"><i data-lucide="clipboard-list"></i>Data Penghuni</a>
        <a href="#daftar-kamar" class="submenu-link flex items-center gap-2 py-2 px-3 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-lg transition"><i data-lucide="door-open"></i>Daftar Kamar</a>
      </div>

      <div class="relative py-2"><div class="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div></div>

      <a href="#aturan-kost" class="menu-link flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition"><i data-lucide="scale"></i>Aturan Kost</a>

      <div class="relative py-2"><div class="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-gray-300 dark:via-gray-700 to-transparent"></div></div>

      <a href="#kontak" class="menu-link flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition"><i data-lucide="phone"></i>Kontak</a>

      <a href="#syarat" class="menu-link flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition"><i data-lucide="scroll"></i>Syarat & Ketentuan</a>
      <a href="#privasi" class="menu-link flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-gray-800 transition"><i data-lucide="shield"></i>Kebijakan Privasi</a>
    </nav>

    <div class="p-4 border-t border-gray-200 dark:border-gray-800 flex flex-col gap-3">
      <div class="flex items-center justify-between bg-slate-100 dark:bg-slate-800 rounded-xl px-4 py-2 text-sm text-slate-600 dark:text-slate-300 shadow-inner">
        <div class="flex items-center gap-2"><i data-lucide="users" class="w-[16px] h-[16px]"></i><span>Jumlah Pengunjung</span></div>
        <span id="visitors" class="font-semibold text-slate-900 dark:text-white">1.055 orang</span>
      </div>
      <div class="flex items-center justify-between gap-3 mt-4 mb-3 px-2">
        <div class="flex items-center gap-3 min-w-0">
          <img src="assets/dulpans-url.png" alt="Foto Profil" class="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-700">
          <div>
            <div class="text-sm font-medium leading-tight flex items-center gap-1">
              <span>Dulpan AS</span>
              <svg class="w-4 h-4" viewBox="0 0 512 512"><path fill="#1DA1F2" d="M512 197.4l-73.1-42.2..."/></svg>
            </div>
            <div class="text-xs text-slate-500">Yogyakarta</div>
          </div>
        </div>
        <button id="btn-dev-info" class="rounded-lg px-3 py-1.5 text-xs font-medium bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90">Developer</button>
      </div>
    </div>
  </aside>`;
  body.insertAdjacentHTML("afterbegin", sidebarHTML);
  lucide.createIcons();

  /* === DROPDOWN === */
  const drop = document.getElementById("toggleDropdown");
  drop.onclick = () => {
    document.getElementById("dropdownContent").classList.toggle("hidden");
    document.getElementById("dropdownIcon").classList.toggle("rotate-180");
  };

  /* === CLOSE SIDEBAR === */
  document.getElementById("closeSidebar").onclick = () => {
    document.getElementById("sidebar").classList.add("-translate-x-full");
    document.getElementById("overlay").classList.add("hidden");
  };

  /* === POPUP DEVELOPER (versi baru) === */
  document.getElementById("btn-dev-info").onclick = () => {
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fadeIn";
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full p-8 relative text-center">
        <button id="closeDevModal" class="absolute top-3 right-3 text-gray-500 hover:text-blue-600"><i data-lucide='x'></i></button>
        <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-1">KostBuYani.<span class="text-blue-600">jogja</span></h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">KostBuYani.jogja adalah proyek penginapan digital yang dikembangkan oleh satu developer. Dukungan dan masukan Anda sangat berarti untuk keberlanjutan proyek ini.</p>
        <div class="text-sm text-gray-700 dark:text-gray-300 mb-4">
          <p><b>Hari Ini:</b> ${new Intl.DateTimeFormat("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }).format(new Date())} WIB</p>
          <p><b>Terakhir Diperbarui:</b> 21 Oktober 2025</p>
          <p><b>Rilis:</b> 21 Maret 2024</p>
        </div>
        <img src="assets/dulpans-url.png" alt="Foto Developer" class="mx-auto w-24 h-24 rounded-full border-4 border-blue-500 mb-3 shadow-lg">
        <h3 class="font-semibold text-gray-900 dark:text-gray-100">Dulpan Adi Saragih</h3>
        <p class="text-xs text-gray-500 mb-3">Terima kasih atas dukungan Anda!</p>
        <button class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 flex items-center gap-2 mx-auto"><i data-lucide="user"></i>Author</button>
        <p class="text-[11px] text-gray-400 mt-4">© 2024 - 2025 Dulpan Adi Saragih</p>
      </div>`;
    document.body.appendChild(modal);
    lucide.createIcons();
    modal.querySelector("#closeDevModal").onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
  };
});
