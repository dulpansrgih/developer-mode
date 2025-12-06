// source/app.js
import { 
    auth, 
    renderLoginPage, 
    onAuthStateChanged, 
    signOut 
} from "../conf/auth.js"; 
import * as Module from "./module.js";
import { renderCatatanMe } from "../conf/appScript.js";

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
        container.innerHTML = `<button id="profile-btn" class="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow hover:bg-blue-700 transition">${initials}</button>`;
        dropdown.innerHTML = `
            <div class="px-4 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 rounded-t-xl flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">${initials}</div>
                <div class="overflow-hidden">
                    <p class="text-sm font-bold text-gray-800 dark:text-white truncate">${currentUser.email}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Admin Keuangan</p>
                </div>
            </div>
            
            <div class="py-2 text-sm font-medium">
                <a href="#dashboard" class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <svg class="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                    Dashboard Admin
                </a>
                
                <a href="#rundown" class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <svg class="w-5 h-5 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Rundown Saya
                </a>

                <div class="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                <a href="#rekening" class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"><svg class="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>Rekening</a>
                <a href="#kategori" class="flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition"><svg class="w-5 h-5 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg>Kategori</a>
                <button onclick="window.renderExportModal()" class="w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"><svg class="w-5 h-5 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Ekspor Excel</button>
                <button onclick="window.renderInfoModal()" class="w-full flex items-center px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition text-left"><svg class="w-5 h-5 mr-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>Info Aplikasi</button>
            </div>
            <div class="p-2 border-t border-gray-100 dark:border-gray-700"><button id="logout-btn" class="w-full flex items-center px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition font-bold"><svg class="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>Keluar</button></div>
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