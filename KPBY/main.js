document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const sidebar = document.getElementById("sidebar");
  const toggleSidebar = document.getElementById("toggleSidebar");
  const closeSidebar = document.getElementById("closeSidebar");
  const overlay = document.getElementById("overlay");
  const themeToggle = document.getElementById("themeToggle");
  const datetime = document.getElementById("datetime");

  // Elemen Dropdown Baru
  const dropdownPenghuni = document.getElementById("dropdown-penghuni");
  const toggleDropdownPenghuni = document.getElementById("toggle-dropdown-penghuni");
  const dropdownContent = dropdownPenghuni.querySelector(".dropdown-content");
  const dropdownIcon = dropdownPenghuni.querySelector(".dropdown-icon");
  const submenuLinks = dropdownPenghuni.querySelectorAll(".submenu-link");
  
  // Hash untuk submenu penghuni
  const submenuHashes = ["#data-penghuni", "#daftar-kamar", "#iuran-listrik", "#cctv-live"];

  // --- SIDEBAR TOGGLE ---
  const toggle = () => {
    sidebar.classList.toggle("-translate-x-full");
    overlay.classList.toggle("hidden");
  };
  toggleSidebar.addEventListener("click", toggle);
  closeSidebar.addEventListener("click", toggle);
  overlay.addEventListener("click", toggle);

  // --- REAL-TIME CLOCK ---
  setInterval(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    datetime.textContent = formatter.format(now);
  }, 1000);

  // --- THEME SYSTEM (Tailwind darkMode: 'class') ---
  const setTheme = (theme) => {
    const html = document.documentElement;
    if (theme === "dark") {
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

  // Default terang, abaikan sistem
  const savedTheme = localStorage.getItem("theme") || "light";
  setTheme(savedTheme);

  themeToggle.addEventListener("click", () => {
    const currentTheme = document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
    setTheme(currentTheme === "dark" ? "light" : "dark");
  });

  // --- DROPDOWN LOGIC ---
  
  // Fungsi untuk membuka/menutup dropdown
  const toggleDropdown = (open) => {
    if (open) {
      dropdownContent.style.maxHeight = dropdownContent.scrollHeight + "px";
      dropdownIcon.classList.add("rotate-180");
    } else {
      dropdownContent.style.maxHeight = "0px";
      dropdownIcon.classList.remove("rotate-180");
    }
  };

  // Toggle saat tombol utama di klik
  toggleDropdownPenghuni.addEventListener("click", () => {
    const isOpen = dropdownContent.style.maxHeight !== "0px";
    toggleDropdown(!isOpen);
  });
  
  // Fungsi untuk menentukan apakah hash saat ini adalah submenu
  const isSubmenuActive = (hash) => submenuHashes.includes(hash);

  // --- HASH NAVIGATION & LINK ACTIVATION ---
  const sections = document.querySelectorAll(".content-section");
  const navLinks = document.querySelectorAll("nav a.nav-link");
  const mainLinks = document.querySelectorAll("button.menu-main-link, a.menu-main-link");

  function showSection(hash) {
    sections.forEach((sec) => sec.classList.add("hidden"));
    
    let activeHash = hash;
    // Logika khusus untuk hash beranda dan sub-link di halaman utama
    if (hash === "#fasilitas" || hash.startsWith("#beranda")) {
        activeHash = "#beranda";
    }

    const active = document.querySelector(activeHash);
    if (active) {
      active.classList.remove("hidden");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function updateActiveLink() {
    let hash = location.hash || "#beranda";

    // 1. Kontrol Dropdown
    const isSubActive = isSubmenuActive(hash);
    
    // Buka dropdown jika salah satu submenu di dalamnya aktif
    toggleDropdown(isSubActive);
    
    // 2. Kontrol Styling Navigasi

    // Hapus style aktif dari semua link
    mainLinks.forEach(link => {
        link.classList.remove(
            "bg-blue-50",
            "dark:bg-gray-800",
            "text-blue-600",
            "dark:text-blue-400"
        );
    });
    submenuLinks.forEach(link => {
         link.classList.remove(
            "bg-blue-100", // Submenu menggunakan warna sedikit lebih gelap
            "dark:bg-gray-700",
            "text-blue-600",
            "dark:text-blue-400",
            "font-semibold"
        );
         link.classList.add("text-gray-700", "dark:text-gray-300"); // Reset warna teks default
    });
    
    // Tentukan link utama yang harus aktif
    let activeMainLink = null;
    if (isSubActive) {
      // Jika submenu aktif, aktifkan tombol utama dropdown
      activeMainLink = toggleDropdownPenghuni;
    } else {
      // Jika menu utama lain aktif
      activeMainLink = document.querySelector(`a.menu-main-link[href="${hash}"]`);
    }

    // Terapkan style aktif pada link utama
    if (activeMainLink) {
        activeMainLink.classList.add(
            "bg-blue-50",
            "dark:bg-gray-800",
            "text-blue-600",
            "dark:text-blue-400"
        );
        activeMainLink.classList.remove("text-gray-700", "dark:text-gray-300"); // Pastikan teks utama aktif
    }

    // Terapkan style aktif pada submenu
    if (isSubActive) {
        const activeSubmenu = document.querySelector(`a.submenu-link[href="${hash}"]`);
        if (activeSubmenu) {
            activeSubmenu.classList.add(
                "bg-blue-100",
                "dark:bg-gray-700",
                "text-blue-600",
                "dark:text-blue-400",
                "font-semibold"
            );
            activeSubmenu.classList.remove("text-gray-700", "dark:text-gray-300");
        }
    }
  }

  window.addEventListener("hashchange", () => {
      showSection(location.hash);
      updateActiveLink();
  });
  
  // Panggil saat DOMContentLoaded
  showSection(location.hash || "#beranda");
  updateActiveLink();
});

// --- POPUP DEVELOPER MODAL ---
const devModal = document.getElementById("devModal");
const btnDev = document.getElementById("btn-dev-info");
const closeDevModal = document.getElementById("closeDevModal");
const devDate = document.getElementById("dev-date");

let devClockInterval;

btnDev.addEventListener("click", () => {
  // Tampilkan modal
  devModal.classList.remove("hidden");
  lucide.createIcons();

  // Jalankan jam real-time di dalam modal
  if (devClockInterval) clearInterval(devClockInterval);
  const updateDevTime = () => {
    const now = new Date();
    const formatted = new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }).format(now);
    devDate.textContent = `${formatted} WIB`;
  };
  updateDevTime();
  devClockInterval = setInterval(updateDevTime, 1000);
});

// Tutup modal (klik X)
closeDevModal.addEventListener("click", () => {
  devModal.classList.add("hidden");
  clearInterval(devClockInterval);
});

// Tutup modal bila klik di luar
devModal.addEventListener("click", (e) => {
  if (e.target === devModal) {
    devModal.classList.add("hidden");
    clearInterval(devClockInterval);
  }
});

// --- NAVIGASI HEADER: PENGUMUMAN & ADMIN ---
const notifButton = document.getElementById("notifButton");
const adminButton = document.getElementById("adminButton");

if (notifButton) {
  notifButton.addEventListener("click", () => {
    location.hash = "#pengumuman";
  });
}

if (adminButton) {
  adminButton.addEventListener("click", () => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    location.hash = isLoggedIn ? "#dashboard" : "#login";
  });
}