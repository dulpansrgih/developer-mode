// source/app.js
import { 
    auth, 
    renderLoginPage, 
    onAuthStateChanged, 
    signOut 
} from "../conf/auth.js"; 
import * as Module from "./module.js";
import { renderCatatanMe } from "../conf/appScript.js";
import { renderProfilePage 
} from "./main.js";

// --- STATE UI ---
let isLoggedIn = false; 
let currentUser = null;
let currentTheme = localStorage.getItem('theme') || 'light';

// Unsubscribers Global
let unsub = {
    transactions: null,
    accounts: null,
    categories: null,
    debts: null,
    debtsList: null, // Tambahan untuk list hutang
    activities: null,
    report: null,
    dashboard: null,
    rundown: null,
    catatan: null
};

// --- TEMPLATE SHELL UTAMA ---
const AppTemplate = `
    <div class="flex flex-col min-h-screen relative bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans"> 
        
        <header class="bg-white dark:bg-gray-800 sticky top-0 z-30 px-4 py-3 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 flex justify-between items-center max-w-lg mx-auto w-full relative">
            <h1 id="page-title" class="text-lg font-bold text-gray-800 dark:text-white">Beranda</h1>
            
            <div class="flex items-center space-x-2">
                 <button id="theme-toggle-btn" class="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                    <svg id="theme-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
                 </button>
                 <div id="auth-status-container" class="relative"></div>
            </div>

            <div id="profile-dropdown" class="absolute top-full right-0 mt-2 mr-4 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 transform scale-95 opacity-0 invisible transition duration-200 origin-top-right ring-1 ring-black ring-opacity-5"></div>
        </header>
        
        <div id="modal-container" class="fixed inset-0 z-[60] hidden flex items-end sm:items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm sm:p-4 transition-all duration-300"></div>

        <main class="flex-1 overflow-y-auto pb-24 max-w-lg mx-auto w-full transition-colors duration-300">
            <div id="app-content" class="p-0"></div>
        </main>
        
        <nav id="bottom-nav" class="fixed inset-x-0 bottom-0 z-40 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe hidden transition-colors duration-300 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <div class="flex justify-between items-center h-16 max-w-lg mx-auto px-4 relative">
                
                <a href="#beranda" class="nav-link flex-1 flex flex-col items-center justify-center py-2 text-gray-400 hover:text-blue-600 transition group">
                    <svg class="w-6 h-6 mb-1 group-[.active]:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
                    <span class="text-[10px] font-medium group-[.active]:text-blue-600 transition-colors">Beranda</span>
                </a>

                <a href="#laporan" class="nav-link flex-1 flex flex-col items-center justify-center py-2 text-gray-400 hover:text-blue-600 transition group">
                    <svg class="w-6 h-6 mb-1 group-[.active]:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    <span class="text-[10px] font-medium group-[.active]:text-blue-600 transition-colors">Laporan</span>
                </a>

                <div class="relative -top-6">
                    <button onclick="window.openMenuTambah()" class="w-14 h-14 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg ring-4 ring-gray-50 dark:ring-gray-900 transition transform hover:scale-105 active:scale-95">
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                </div>

                <a href="#pendanaan" class="nav-link flex-1 flex flex-col items-center justify-center py-2 text-gray-400 hover:text-blue-600 transition group">
                    <svg class="w-6 h-6 mb-1 group-[.active]:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <span class="text-[10px] font-medium group-[.active]:text-blue-600 transition-colors">Pendanaan</span>
                </a>

                <a href="#activities" class="nav-link flex-1 flex flex-col items-center justify-center py-2 text-gray-400 hover:text-blue-600 transition group">
                    <svg class="w-6 h-6 mb-1 group-[.active]:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    <span class="text-[10px] font-medium group-[.active]:text-blue-600 transition-colors">Aktivitas</span>
                </a>
            </div>
        </nav>
    </div>
`;

// ... (renderAuthStatus dan toggleDropdown TETAP SAMA seperti sebelumnya) ...
function renderAuthStatus() {
    const container = document.getElementById('auth-status-container');
    const dropdown = document.getElementById('profile-dropdown');
    
    if (isLoggedIn && currentUser) {
        const initials = currentUser.email.charAt(0).toUpperCase();
        
        container.innerHTML = `<button id="profile-btn" class="w-9 h-9 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 transition ring-2 ring-white dark:ring-gray-800">${initials}</button>`;
        
        dropdown.innerHTML = `
            <div onclick="window.location.hash='#profile'" class="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-t-2xl flex items-center gap-4 cursor-pointer hover:opacity-95 transition relative overflow-hidden group">
                <div class="absolute top-0 right-0 w-20 h-20 bg-white opacity-5 rounded-full -mr-10 -mt-10"></div>
                <div class="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-5 rounded-full -ml-8 -mb-8"></div>

                <div class="w-12 h-12 bg-white text-blue-600 rounded-full flex items-center justify-center font-black text-lg shadow-lg relative z-10 group-hover:scale-110 transition duration-300 border-2 border-blue-100">
                    ${initials}
                </div>
                <div class="overflow-hidden relative z-10 flex-1">
                    <p class="text-sm font-bold text-white truncate">${currentUser.email}</p>
                    <div class="flex items-center gap-1 mt-1">
                        <span class="text-[10px] text-blue-100 font-medium">Lihat Profil</span>
                        <svg class="w-3 h-3 text-blue-200 group-hover:translate-x-1 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                </div>
            </div>
            
            <div class="py-2 text-sm font-medium bg-white dark:bg-gray-800 rounded-b-2xl">
                
                <a href="#dashboard" class="flex items-center px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/10 transition group">
                    <div class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3 text-orange-600 group-hover:scale-110 transition shadow-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <span class="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                        DASHBOARD ADMIN
                    </span>
                </a>

                <div class="border-t border-gray-100 dark:border-gray-700 my-1 mx-4"></div>

                <a href="#rekening" class="flex items-center px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition group">
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mr-3 text-indigo-500 group-hover:bg-white group-hover:shadow-sm transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                    </div>
                    Rekening
                </a>
                
                <a href="#kategori" class="flex items-center px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition group">
                    <div class="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mr-3 text-blue-500 group-hover:bg-white group-hover:shadow-sm transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>
                    </div>
                    Kategori
                </a>
                
                <button onclick="window.renderExportModal()" class="w-full flex items-center px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition group text-left">
                    <div class="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center mr-3 text-green-600 group-hover:bg-white group-hover:shadow-sm transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    Ekspor Excel
                </button>

                <a href="#rundown" class="flex items-center px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition group">
                    <div class="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center mr-3 text-purple-500 group-hover:bg-white group-hover:shadow-sm transition">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                    Rundown Saya
                </a>

                <div class="p-3 border-t border-gray-100 dark:border-gray-700 mt-1 flex gap-3">
                    <button id="logout-btn" class="flex-1 flex items-center justify-center px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-xl transition font-bold text-xs shadow-sm">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Keluar
                    </button>
                    <button onclick="window.renderInfoModal()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white transition relative overflow-hidden">
                        <svg class="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span class="absolute top-2 right-2 flex h-2 w-2">
                          <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                          <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                        </span>
                    </button>
                </div>
            </div>
        `;
        
        document.getElementById('profile-btn').addEventListener('click', (e) => { e.stopPropagation(); toggleDropdown(); });
        document.getElementById('logout-btn').addEventListener('click', () => { signOut(auth); toggleDropdown(false); });
        dropdown.querySelectorAll('a').forEach(link => link.addEventListener('click', () => toggleDropdown(false)));
    } else {
        container.innerHTML = '';
        dropdown.innerHTML = '';
    }
}

function toggleDropdown(forceState) {
    const dropdown = document.getElementById('profile-dropdown');
    if (!dropdown) return;
    const isHidden = dropdown.classList.contains('invisible');
    const shouldShow = forceState !== undefined ? forceState : isHidden;
    if (shouldShow) {
        dropdown.classList.remove('invisible', 'opacity-0', 'scale-95');
        dropdown.classList.add('visible', 'opacity-100', 'scale-100');
        setTimeout(() => document.addEventListener('click', closeDropdownOutside), 0);
    } else {
        dropdown.classList.remove('visible', 'opacity-100', 'scale-100');
        dropdown.classList.add('invisible', 'opacity-0', 'scale-95');
        document.removeEventListener('click', closeDropdownOutside);
    }
}
function closeDropdownOutside(e) {
    const dropdown = document.getElementById('profile-dropdown');
    const btn = document.getElementById('profile-btn');
    if (dropdown && !dropdown.contains(e.target) && btn && !btn.contains(e.target)) toggleDropdown(false);
}

// --- ROUTING SYSTEM ---
const routes = {
    '#beranda': { title: 'Beranda', renderer: (c) => Module.renderBeranda(c, unsub) },
    '#pendanaan': { title: 'Pendanaan', renderer: (c) => Module.renderPendanaan(c, unsub) }, // Update Route Name
    '#rekening': { title: 'Rekening', renderer: (c) => Module.renderRekening(c, unsub) },
    '#kategori': { title: 'Kategori', renderer: (c) => Module.renderKategori(c, unsub) },
    '#laporan': { title: 'Laporan Keuangan', renderer: (c) => Module.renderLaporan(c, unsub) },
    '#activities': { title: 'Aktivitas', renderer: (c) => Module.renderActivities(c, unsub) },
    '#dashboard': { title: 'Admin Dashboard', renderer: (c) => Module.renderDashboardAdmin(c, unsub) },
    '#rundown': { title: 'Rundown Saya', renderer: (c) => Module.renderRundown(c, unsub) },
    '#login': { title: 'Dulpan Adi Saragih', renderer: renderLoginPage },
    '#profile': { title: 'Profil Saya', renderer: renderProfilePage },
    '#catatanMe': { title: 'Catatan Pribadi', renderer: (c) => unsub.catatan = renderCatatanMe(c) },
};

function handleHashChange() {
    let hash = window.location.hash || '#beranda';
    if (!isLoggedIn && hash !== '#login') hash = '#login';
    if (isLoggedIn && hash === '#login') hash = '#beranda';
    
    // Clear previous listeners
    Object.values(unsub).forEach(fn => fn && fn());
    for(let key in unsub) unsub[key] = null;

    const route = routes[hash];
    const contentArea = document.getElementById('app-content');
    const bottomNav = document.getElementById('bottom-nav');
    
    if (!route || !contentArea) return;
    if (document.getElementById('page-title')) document.getElementById('page-title').innerText = route.title;
    bottomNav.classList.toggle('hidden', hash === '#login');
    
    route.renderer(contentArea);
    updateNavStatus(hash);
}

function updateNavStatus(hash) {
    document.querySelectorAll('#bottom-nav a.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href === hash) {
            link.classList.add('active', 'text-blue-600');
            link.classList.remove('text-gray-400');
        } else {
            link.classList.remove('active', 'text-blue-600');
            link.classList.add('text-gray-400');
        }
    });
}

// --- INISIALISASI ---
function initializeApp() {
    document.getElementById('app').innerHTML = AppTemplate;
    
    // Inisialisasi fungsi global window (Modal, Delete, dll)
    Module.initGlobalFunctions();

    const toggleTheme = () => { currentTheme = (currentTheme === 'light') ? 'dark' : 'light'; localStorage.setItem('theme', currentTheme); applyTheme(); };
    const applyTheme = () => { const icon = document.getElementById('theme-icon'); if (currentTheme === 'dark') { document.documentElement.classList.add('dark'); if(icon) icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`; } else { document.documentElement.classList.remove('dark'); if(icon) icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`; } };
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme); applyTheme();
    onAuthStateChanged(auth, (user) => { if (user) { isLoggedIn = true; currentUser = user; renderAuthStatus(); if (window.location.hash === '#login' || window.location.hash === '') window.location.hash = '#beranda'; else handleHashChange(); } else { isLoggedIn = false; currentUser = null; renderAuthStatus(); window.location.hash = '#login'; handleHashChange(); } });
    window.addEventListener('hashchange', handleHashChange);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/build/service-worker.js').catch(console.error);
}

initializeApp();