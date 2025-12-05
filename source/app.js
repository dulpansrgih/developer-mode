// source/app.js
import { 
    subscribeToTransactions, 
    addData, 
    addTransfer,
    updateData,
    deleteData, 
    subscribeToData, 
    subscribeToRundowns,
    getDataOnce,
    getTransactionsByDateRange,
    subscribeToDebtsSummary,
    subscribeToMonthlyReport,
    subscribeToFinancialSummary,
    updateActivityStatus,
    formatRupiah 
} from "./main.js"; 
import { 
    auth, 
    renderLoginPage, 
    onAuthStateChanged, 
    signOut 
} from "../conf/auth.js"; 

// --- STATE UI ---
let isLoggedIn = false; 
let currentUser = null;
let currentTheme = localStorage.getItem('theme') || 'light';

// Beranda State
let viewState = {
    filter: 'bulanan', // 'harian', 'bulanan'
    date: new Date()   // Tanggal yang sedang dilihat
};

// Unsubscribers
let unsub = {
    transactions: null,
    accounts: null,
    categories: null,
    debts: null,
    activities: null,
    report: null,
    dashboard: null,
    rundown: null
};

// --- HELPERS ---
const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

// --- TEMPLATE SHELL UTAMA ---
const AppTemplate = `
    <div class="flex flex-col min-h-screen relative bg-gray-50 dark:bg-gray-900 transition-colors duration-300 font-sans"> 
        
        <header class="bg-white dark:bg-gray-800 sticky top-0 z-30 px-4 py-3 border-b border-gray-200 dark:border-gray-700 transition-colors duration-300 flex justify-between items-center max-w-lg mx-auto w-full">
            <h1 id="page-title" class="text-lg font-bold text-gray-800 dark:text-white">Beranda</h1>
            
            <div class="flex items-center space-x-2">
                 <button id="theme-toggle-btn" class="p-2 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
                    <svg id="theme-icon" class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"></svg>
                 </button>
                 <div id="auth-status-container" class="relative"></div>
            </div>
        </header>

        <!-- Dropdown Profil -->
        <div id="profile-dropdown" class="absolute top-16 right-0 m-4 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-2xl z-50 transform scale-95 opacity-0 invisible transition duration-200 origin-top-right ring-1 ring-black ring-opacity-5"></div>
        
        <!-- Modal Container -->
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

                <a href="#hutang" class="nav-link flex-1 flex flex-col items-center justify-center py-2 text-gray-400 hover:text-blue-600 transition group">
                    <svg class="w-6 h-6 mb-1 group-[.active]:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    <span class="text-[10px] font-medium group-[.active]:text-blue-600 transition-colors">Hutang</span>
                </a>

                <a href="#activities" class="nav-link flex-1 flex flex-col items-center justify-center py-2 text-gray-400 hover:text-blue-600 transition group">
                    <svg class="w-6 h-6 mb-1 group-[.active]:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                    <span class="text-[10px] font-medium group-[.active]:text-blue-600 transition-colors">Aktivitas</span>
                </a>
            </div>
        </nav>
    </div>
`;


// --- FUNGSI AUTH & DROPDOWN ---
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
                
                <!-- NEW: RundownMe Link -->
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
    '#beranda': { title: 'Beranda', renderer: renderBeranda },
    '#hutang': { title: 'Hutang', renderer: renderHutang },
    '#rekening': { title: 'Rekening', renderer: renderRekening },
    '#kategori': { title: 'Kategori', renderer: renderKategori },
    '#laporan': { title: 'Laporan Keuangan', renderer: renderLaporan },
    '#activities': { title: 'Aktivitas', renderer: renderActivities },
    '#dashboard': { title: 'Admin Dashboard', renderer: renderDashboardAdmin },
    '#rundown': { title: 'Rundown Saya', renderer: renderRundown }, // NEW
    '#login': { title: 'Dulpan Adi Saragih', renderer: renderLoginPage },
};

function handleHashChange() {
    let hash = window.location.hash || '#beranda';
    if (!isLoggedIn && hash !== '#login') hash = '#login';
    if (isLoggedIn && hash === '#login') hash = '#beranda';
    
    Object.values(unsub).forEach(fn => fn && fn());
    unsub = { transactions: null, accounts: null, categories: null, debts: null, activities: null, report: null, dashboard: null, rundown: null };

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

// --- BERANDA (NEW: FILTER & NAVIGATION) ---
function renderBeranda(container) {
    const updateHeader = () => {
        let label = '';
        if(viewState.filter === 'bulanan') {
            label = viewState.date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        } else {
            label = viewState.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
        }
        
        container.innerHTML = `
            <div class="px-4 py-4 min-h-screen">
                <!-- Navigation & Filter Bar -->
                <div class="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm mb-4 border border-gray-100 dark:border-gray-700">
                    <button id="toggle-filter" class="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-gray-600 dark:text-gray-300">
                        ${viewState.filter === 'bulanan' ? '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>' : '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'}
                    </button>
                    
                    <div class="flex items-center gap-3">
                        <button id="prev-date" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
                        <span class="font-bold text-gray-800 dark:text-white text-sm min-w-[100px] text-center select-none">${label}</span>
                        <button id="next-date" class="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"><svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
                    </div>
                </div>

                <div class="bg-gradient-to-r from-blue-600 to-blue-500 p-6 rounded-2xl shadow-lg mb-6 text-white relative overflow-hidden">
                    <div class="relative z-10">
                        <p class="text-blue-100 text-sm mb-1">Saldo ${viewState.filter === 'bulanan' ? 'Bulan Ini' : 'Hari Ini'}</p>
                        <h2 class="text-3xl font-extrabold" id="total-balance">Rp 0</h2>
                        <div class="grid grid-cols-2 gap-4 mt-6">
                            <div><p class="text-blue-100 text-xs">Pemasukan</p><p class="font-bold text-lg" id="total-income">Rp 0</p></div>
                            <div><p class="text-blue-100 text-xs">Pengeluaran</p><p class="font-bold text-lg" id="total-expense">Rp 0</p></div>
                        </div>
                    </div>
                </div>
                
                <h3 class="font-bold text-gray-800 dark:text-white mb-4 text-lg">Riwayat Transaksi</h3>
                <div id="transaction-list" class="space-y-6 pb-20"><div class="flex flex-col items-center justify-center py-10 text-gray-400 animate-pulse"><p>Memuat data...</p></div></div>
            </div>
        `;

        // Listeners for Nav
        document.getElementById('toggle-filter').onclick = () => {
            viewState.filter = viewState.filter === 'bulanan' ? 'harian' : 'bulanan';
            refreshDataDisplay();
            updateHeader(); // Re-render header to update icon/label
        };
        document.getElementById('prev-date').onclick = () => {
            if(viewState.filter === 'bulanan') viewState.date.setMonth(viewState.date.getMonth() - 1);
            else viewState.date.setDate(viewState.date.getDate() - 1);
            refreshDataDisplay();
            updateHeader();
        };
        document.getElementById('next-date').onclick = () => {
            if(viewState.filter === 'bulanan') viewState.date.setMonth(viewState.date.getMonth() + 1);
            else viewState.date.setDate(viewState.date.getDate() + 1);
            refreshDataDisplay();
            updateHeader();
        };
    };

    // Helper untuk filter data
    let allTransactions = [];
    const refreshDataDisplay = () => {
        const listContainer = document.getElementById('transaction-list');
        const incEl = document.getElementById('total-income');
        const expEl = document.getElementById('total-expense');
        const balEl = document.getElementById('total-balance');
        
        if(!listContainer) return; // Guard if removed

        // Filter Logic
        const filtered = allTransactions.filter(t => {
            const d = new Date(t.date);
            const v = viewState.date;
            if(viewState.filter === 'bulanan') {
                return d.getMonth() === v.getMonth() && d.getFullYear() === v.getFullYear();
            } else {
                return d.getDate() === v.getDate() && d.getMonth() === v.getMonth() && d.getFullYear() === v.getFullYear();
            }
        });

        // Calc Totals
        let inc = 0, exp = 0;
        filtered.forEach(t => {
            const val = parseInt(t.amount);
            if(t.type === 'pemasukan') inc += val; else exp += val;
        });
        
        incEl.innerText = formatRupiah(inc);
        expEl.innerText = formatRupiah(exp);
        balEl.innerText = formatRupiah(inc - exp);

        // Grouping for List
        const groups = {};
        filtered.forEach(trx => {
            const dateKey = trx.date;
            if (!groups[dateKey]) groups[dateKey] = { date: dateKey, total: 0, items: [] };
            const amountVal = trx.type === 'pengeluaran' ? -parseInt(trx.amount) : parseInt(trx.amount);
            groups[dateKey].total += amountVal;
            groups[dateKey].items.push(trx);
        });
        const groupedData = Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));

        // Render List
        listContainer.innerHTML = '';
        if (groupedData.length === 0) {
            listContainer.innerHTML = `<div class="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600"><p class="text-sm font-medium">Tidak ada transaksi pada periode ini</p></div>`;
            return;
        }

        groupedData.forEach(group => {
            const dateObj = new Date(group.date);
            const dateNum = dateObj.getDate().toString().padStart(2, '0');
            const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
            
            // Simpan JSON data di attribute agar bisa dibaca saat klik detail
            const groupHTML = `
                <div class="relative">
                    <div class="flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-2 mb-4 bg-gray-50 dark:bg-gray-900 sticky top-0 z-10 pt-2">
                        <div class="flex items-center space-x-3">
                            <span class="text-4xl font-bold text-gray-800 dark:text-white tracking-tighter">${dateNum}</span>
                            <span class="font-bold text-sm text-gray-800 dark:text-gray-200">${dayName}</span>
                        </div>
                        <span class="font-bold text-sm ${group.total >= 0 ? 'text-green-500' : 'text-red-500'} mb-1">${group.total >= 0 ? '+' : ''}${formatRupiah(group.total)}</span>
                    </div>
                    <div class="space-y-3 pl-1">
                        ${group.items.map(item => {
                            // Encode item data to string
                            const itemData = encodeURIComponent(JSON.stringify(item));
                            return `
                            <div onclick="window.openDetailTransaction('${itemData}')" class="flex items-center justify-between bg-white dark:bg-gray-800 p-3.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition">
                                <div class="absolute left-0 top-0 bottom-0 w-1.5 ${item.type === 'pemasukan' ? 'bg-green-500' : 'bg-red-500'}"></div>
                                <div class="flex items-center gap-3 pl-2">
                                    <div class="w-10 h-10 ${item.type === 'pemasukan' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'} rounded-lg flex items-center justify-center shadow-sm">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.type === 'pemasukan' ? 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'}"></path></svg>
                                    </div>
                                    <div>
                                        <p class="font-bold text-gray-800 dark:text-white text-sm">${item.categoryName || item.category || 'Umum'}</p>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">${item.accountName || 'Tunai'} ${item.note ? `• ${item.note}` : ''}</p>
                                    </div>
                                </div>
                                <div class="text-right">
                                    <p class="font-bold ${item.type === 'pemasukan' ? 'text-green-500' : 'text-red-500'} text-sm">
                                        ${item.type === 'pengeluaran' ? '-' : ''}${formatRupiah(item.amount)}
                                    </p>
                                </div>
                            </div>
                        `}).join('')}
                    </div>
                </div>`;
            listContainer.innerHTML += groupHTML;
        });
    };

    updateHeader(); // Init Render
    unsub.transactions = subscribeToTransactions((result) => {
        allTransactions = result.allItems;
        refreshDataDisplay();
    });
}

// --- NEW: DETAIL TRANSACTION MODAL (EDIT/DELETE) ---
window.openDetailTransaction = (encodedData) => {
    const item = JSON.parse(decodeURIComponent(encodedData));
    const modal = document.getElementById('modal-container');
    modal.classList.remove('hidden');
    
    const renderView = () => `
        <div class="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-2xl p-6 m-4 animate-scale-up shadow-2xl relative">
            <button onclick="window.closeModal()" class="absolute top-4 right-4 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            
            <div class="text-center mb-6">
                <div class="w-16 h-16 ${item.type === 'pemasukan' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.type === 'pemasukan' ? 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' : 'M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'}"></path></svg>
                </div>
                <h3 class="text-2xl font-extrabold ${item.type === 'pemasukan' ? 'text-green-600' : 'text-red-600'}">${formatRupiah(item.amount)}</h3>
                <p class="text-gray-500 font-bold">${item.categoryName || item.category}</p>
                <p class="text-gray-400 text-xs mt-1">${item.date}</p>
            </div>

            <div class="space-y-3 mb-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl text-sm">
                <div class="flex justify-between border-b border-gray-200 dark:border-gray-600 pb-2">
                    <span class="text-gray-500">Akun</span>
                    <span class="font-bold text-gray-800 dark:text-white">${item.accountName || '-'}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-gray-500">Catatan</span>
                    <span class="font-bold text-gray-800 dark:text-white text-right max-w-[60%] truncate">${item.note || '-'}</span>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
                <button id="btn-edit-trx" class="py-3 rounded-xl font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition">Edit</button>
                <button onclick="window.hapusItem('transactions', '${item.id}'); window.closeModal()" class="py-3 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition">Hapus</button>
            </div>
        </div>
    `;

    // Render Edit Form
    const renderEditForm = () => {
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-2xl p-6 m-4 animate-scale-up shadow-2xl relative">
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Edit Transaksi</h3>
                <form id="form-edit-trx" class="space-y-3">
                    <div>
                        <label class="text-xs font-bold text-gray-500">JUMLAH</label>
                        <input type="number" name="amount" value="${item.amount}" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-xl font-bold">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-500">CATATAN</label>
                        <input type="text" name="note" value="${item.note || ''}" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    </div>
                    <div>
                        <label class="text-xs font-bold text-gray-500">TANGGAL</label>
                        <input type="date" name="date" value="${item.date}" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    </div>
                    <div class="grid grid-cols-2 gap-3 mt-4">
                        <button type="button" onclick="window.closeModal()" class="py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200">Batal</button>
                        <button type="submit" class="py-3 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700">Simpan</button>
                    </div>
                </form>
            </div>
        `;
        
        document.getElementById('form-edit-trx').onsubmit = async (e) => {
            e.preventDefault();
            const newData = {
                amount: e.target.amount.value,
                note: e.target.note.value,
                date: e.target.date.value
            };
            if(await updateData('transactions', item.id, newData)) {
                window.closeModal();
            } else {
                alert("Gagal update.");
            }
        };
    };

    modal.innerHTML = renderView();
    // Bind Edit Button
    setTimeout(() => {
        document.getElementById('btn-edit-trx').onclick = renderEditForm;
    }, 0);
};


// --- HALAMAN RUNDOWN ME (NEW) ---
function renderRundown(container) {
    container.innerHTML = `
        <div class="p-4 min-h-screen pb-24 relative">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Jurnal Harian Saya</h2>
                <span class="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-lg font-bold">24 Jam</span>
            </div>
            
            <!-- List Container -->
            <div id="rundown-list" class="space-y-6 pb-20">
                <div class="text-center py-10 text-gray-400">Memuat jurnal...</div>
            </div>

            <!-- Floating Action Button -->
            <button onclick="document.getElementById('form-rundown-modal').classList.remove('hidden')" class="fixed bottom-24 right-4 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition z-40">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
            
            <!-- Modal Add Rundown -->
            <div id="form-rundown-modal" class="fixed inset-0 z-[70] hidden flex items-end sm:items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm sm:p-4">
                <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up shadow-2xl relative">
                    <button onclick="document.getElementById('form-rundown-modal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    <h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-white">Tambah Kegiatan</h3>
                    <form id="form-rundown" class="space-y-3">
                        <div class="grid grid-cols-3 gap-3">
                            <div class="col-span-1">
                                <label class="text-xs font-bold text-gray-500">JAM</label>
                                <input type="time" name="time" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required>
                            </div>
                            <div class="col-span-2">
                                <label class="text-xs font-bold text-gray-500">TANGGAL</label>
                                <input type="date" name="date" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required>
                            </div>
                        </div>
                        <div>
                            <label class="text-xs font-bold text-gray-500">KEGIATAN</label>
                            <input type="text" name="activity" placeholder="Ngoding, Makan, Tidur..." class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required>
                        </div>
                        <button type="submit" class="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition">Simpan</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // Default Values
    const now = new Date();
    const timeString = now.toTimeString().split(' ')[0].substring(0,5);
    document.querySelector('#form-rundown [name="date"]').value = now.toISOString().split('T')[0];
    document.querySelector('#form-rundown [name="time"]').value = timeString;

    // Submit Logic
    document.getElementById('form-rundown').onsubmit = async (e) => {
        e.preventDefault();
        const data = {
            time: e.target.time.value,
            date: e.target.date.value,
            activity: e.target.activity.value
        };
        if(await addData('rundowns', data)) {
            e.target.reset();
            // Reset to current time again for convenience
            document.querySelector('#form-rundown [name="date"]').value = new Date().toISOString().split('T')[0];
            document.getElementById('form-rundown-modal').classList.add('hidden');
        }
    };

    // Render List
    unsub.rundown = subscribeToRundowns((items) => {
        const list = document.getElementById('rundown-list');
        list.innerHTML = '';
        if(items.length === 0) { list.innerHTML = `<div class="text-center py-10 text-gray-400">Belum ada catatan kegiatan.</div>`; return; }
        
        // Group by Date
        const groups = {};
        items.forEach(item => {
            if(!groups[item.date]) groups[item.date] = [];
            groups[item.date].push(item);
        });

        // Sort Dates Descending
        const sortedDates = Object.keys(groups).sort((a,b) => new Date(b) - new Date(a));

        sortedDates.forEach(dateKey => {
            const dateObj = new Date(dateKey);
            const dateLabel = dateObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
            
            let itemsHTML = groups[dateKey].sort((a,b) => a.time.localeCompare(b.time)).map(r => `
                <div class="flex gap-4 relative pl-4 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-0 last:pb-0">
                    <div class="absolute -left-[9px] top-0 w-4 h-4 bg-purple-500 rounded-full border-4 border-white dark:border-gray-900"></div>
                    <div class="w-16 pt-0.5">
                        <span class="text-sm font-bold text-gray-500">${r.time}</span>
                    </div>
                    <div class="flex-1 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 -mt-2">
                        <p class="text-gray-800 dark:text-white font-medium text-sm">${r.activity}</p>
                    </div>
                    <button onclick="window.hapusItem('rundowns', '${r.id}')" class="self-start mt-1 text-gray-300 hover:text-red-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                </div>
            `).join('');

            list.innerHTML += `
                <div>
                    <h3 class="font-bold text-gray-800 dark:text-white mb-4 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10">${dateLabel}</h3>
                    <div class="ml-2">
                        ${itemsHTML}
                    </div>
                </div>
            `;
        });
    });
}

// --- DASHBOARD ADMIN (DIPERBAIKI & DETAIL) ---
function renderDashboardAdmin(container) {
    container.innerHTML = `
        <div class="p-4 min-h-screen pb-24 space-y-5">
            <!-- 1. Wealth Card -->
            <div class="bg-gray-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div class="relative z-10">
                    <div class="flex justify-between items-start mb-4">
                        <div>
                            <p class="text-gray-400 text-xs font-bold uppercase tracking-wider">Net Worth</p>
                            <h2 class="text-3xl font-extrabold mt-1" id="admin-networth">...</h2>
                        </div>
                        <div class="bg-gray-800 p-2 rounded-lg">
                            <svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                        <div>
                            <span class="block text-gray-500 text-xs mb-1">Aset (Cash)</span>
                            <span id="admin-assets" class="font-bold text-green-400 text-lg">...</span>
                        </div>
                        <div>
                            <span class="block text-gray-500 text-xs mb-1">Kewajiban (Hutang)</span>
                            <span id="admin-liabilities" class="font-bold text-red-400 text-lg">...</span>
                        </div>
                    </div>
                </div>
                <!-- Background Pattern -->
                <div class="absolute -right-6 -bottom-10 opacity-10">
                    <svg class="w-48 h-48" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                </div>
            </div>

            <!-- 2. Cash Flow Summary -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-white mb-4 text-sm">Arus Kas (Semua Waktu)</h3>
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-gray-500">Pemasukan</span>
                            <span class="font-bold text-green-600" id="cf-in">...</span>
                        </div>
                        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div id="bar-in" class="bg-green-500 h-2 rounded-full" style="width: 0%"></div>
                        </div>
                    </div>
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="text-gray-500">Pengeluaran</span>
                            <span class="font-bold text-red-500" id="cf-out">...</span>
                        </div>
                        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                            <div id="bar-out" class="bg-red-500 h-2 rounded-full" style="width: 0%"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- 3. Top Expense Categories -->
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-white mb-4 text-sm">Top Pengeluaran Kategori</h3>
                <div id="top-categories" class="space-y-3">
                    <p class="text-xs text-gray-400">Memuat data...</p>
                </div>
            </div>

            <!-- 4. Quick Actions -->
            <h3 class="font-bold text-gray-700 dark:text-gray-300 text-sm">Menu Cepat</h3>
            <div class="grid grid-cols-3 gap-3">
                <button onclick="window.location.hash='#rekening'" class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition">
                    <div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg></div>
                    <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">Rekening</span>
                </button>
                <button onclick="window.renderExportModal()" class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition">
                    <div class="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div>
                    <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">Export</span>
                </button>
                <button onclick="window.renderInfoModal()" class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition">
                    <div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                    <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">Info</span>
                </button>
            </div>
        </div>
    `;

    // 1. Data Transaksi untuk Analisis Dashboard
    unsub.transactions = subscribeToTransactions(({groupedData, summary}) => {
        // Flatkan semua transaksi untuk analisis
        let allTrx = [];
        groupedData.forEach(g => allTrx.push(...g.items));

        // -- Hitung Top Categories (Pengeluaran) --
        const catMap = {};
        let totalExp = 0;
        allTrx.forEach(t => {
            if(t.type === 'pengeluaran') {
                const amount = parseInt(t.amount);
                const name = t.categoryName || 'Lainnya';
                catMap[name] = (catMap[name] || 0) + amount;
                totalExp += amount;
            }
        });

        const sortedCats = Object.entries(catMap).sort((a,b) => b[1] - a[1]).slice(0, 3); // Top 3
        const catContainer = document.getElementById('top-categories');
        catContainer.innerHTML = '';
        
        if (sortedCats.length === 0) {
            catContainer.innerHTML = `<p class="text-xs text-gray-400 italic">Belum ada pengeluaran.</p>`;
        } else {
            sortedCats.forEach(([name, amount]) => {
                const percent = ((amount / totalExp) * 100).toFixed(0);
                catContainer.innerHTML += `
                    <div>
                        <div class="flex justify-between text-xs mb-1">
                            <span class="font-medium text-gray-700 dark:text-gray-300">${name}</span>
                            <span class="text-gray-500">${percent}% (${formatRupiah(amount)})</span>
                        </div>
                        <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                            <div class="bg-blue-500 h-1.5 rounded-full" style="width: ${percent}%"></div>
                        </div>
                    </div>
                `;
            });
        }

        // -- Update Cash Flow Bars --
        const maxFlow = Math.max(summary.income, summary.expense) || 1;
        document.getElementById('cf-in').innerText = formatRupiah(summary.income);
        document.getElementById('cf-out').innerText = formatRupiah(summary.expense);
        document.getElementById('bar-in').style.width = `${(summary.income / maxFlow) * 100}%`;
        document.getElementById('bar-out').style.width = `${(summary.expense / maxFlow) * 100}%`;

        // -- Update Assets Value (from summary) --
        document.getElementById('admin-assets').innerText = formatRupiah(summary.total);
        
        // -- Calculate Net Worth (Need Liabilities first) --
        getDataOnce('debts').then(debts => {
            let liabilities = 0;
            debts.forEach(d => { if(d.type === 'hutang') liabilities += parseInt(d.amount); });
            document.getElementById('admin-liabilities').innerText = formatRupiah(liabilities);
            document.getElementById('admin-networth').innerText = formatRupiah(summary.total - liabilities);
        });
    });
}

// --- RENDER REKENING (SAMA) ---
function renderRekening(container) {
    container.innerHTML = `<div class="p-4 min-h-screen pb-24"><div class="flex justify-between items-center mb-6"><h2 class="text-gray-500 dark:text-gray-400 text-sm">Kelola Sumber Dana</h2><button onclick="document.getElementById('form-rekening').classList.toggle('hidden')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg transition">+ Tambah</button></div><form id="form-rekening" class="hidden bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 animate-slide-up"><input type="text" name="name" placeholder="Nama Bank / E-Wallet" class="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-3 outline-none" required><input type="text" name="holder" placeholder="Atas Nama" class="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-3 outline-none"><button type="submit" class="w-full bg-gray-900 dark:bg-gray-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-black transition">Simpan Rekening</button></form><div id="accounts-list" class="grid gap-3"><p class="text-center text-gray-400 py-10">Memuat rekening...</p></div></div>`;
    document.getElementById('form-rekening').onsubmit = async (e) => { e.preventDefault(); const data = { name: e.target.name.value, holder: e.target.holder.value }; if(await addData('accounts', data)) { e.target.reset(); e.target.classList.add('hidden'); } };
    unsub.accounts = subscribeToData('accounts', (items) => { const list = document.getElementById('accounts-list'); list.innerHTML = ''; if(items.length === 0) { list.innerHTML = `<div class="text-center text-gray-400 py-10">Belum ada rekening.</div>`; return; } items.forEach(acc => { list.innerHTML += `<div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center group"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">${acc.name.substring(0,2).toUpperCase()}</div><div><h4 class="font-bold text-gray-800 dark:text-white">${acc.name}</h4><p class="text-xs text-gray-500">${acc.holder || 'Tanpa Nama'}</p></div></div><button onclick="window.hapusItem('accounts', '${acc.id}')" class="p-2 text-gray-300 hover:text-red-500 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>`; }); });
}

// --- RENDER KATEGORI (SAMA) ---
function renderKategori(container) {
    container.innerHTML = `<div class="p-4 min-h-screen pb-24"><div class="flex justify-center mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl"><button id="tab-expense" class="flex-1 py-2 text-sm font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition">Pengeluaran</button><button id="tab-income" class="flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 transition">Pemasukan</button></div><form id="form-kategori" class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6"><div class="flex gap-2"><input type="text" name="name" placeholder="Nama Kategori" class="flex-1 p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" required><button type="submit" class="bg-blue-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-blue-700 transition">Tambah</button></div></form><div id="categories-list" class="grid gap-2"></div></div>`;
    let activeType = 'pengeluaran'; let allCategories = []; const renderList = () => { const list = document.getElementById('categories-list'); const filtered = allCategories.filter(c => c.type === activeType); list.innerHTML = ''; if(filtered.length === 0) { list.innerHTML = `<div class="text-center text-gray-400 py-10">Belum ada kategori ${activeType}.</div>`; return; } filtered.forEach(cat => { list.innerHTML += `<div class="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between items-center"><span class="font-medium text-gray-700 dark:text-gray-200 text-sm">${cat.name}</span><button onclick="window.hapusItem('categories', '${cat.id}')" class="text-xs text-red-400 hover:text-red-600">Hapus</button></div>`; }); };
    const tabExp = document.getElementById('tab-expense'); const tabInc = document.getElementById('tab-income');
    tabExp.onclick = () => { activeType = 'pengeluaran'; tabExp.className = "flex-1 py-2 text-sm font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition"; tabInc.className = "flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 transition"; renderList(); };
    tabInc.onclick = () => { activeType = 'pemasukan'; tabInc.className = "flex-1 py-2 text-sm font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition"; tabExp.className = "flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 transition"; renderList(); };
    document.getElementById('form-kategori').onsubmit = async (e) => { e.preventDefault(); const data = { name: e.target.name.value, type: activeType }; if(await addData('categories', data)) e.target.reset(); };
    unsub.categories = subscribeToData('categories', (items) => { allCategories = items; renderList(); });
}

// --- RENDER HUTANG (SAMA) ---
function renderHutang(container) {
    container.innerHTML = `<div class="p-4 min-h-screen pb-24"><div class="grid grid-cols-2 gap-3 mb-6"><div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800"><p class="text-xs text-red-500 font-bold uppercase mb-1">Hutang Saya</p><h3 class="text-xl font-extrabold text-red-600 dark:text-red-400" id="total-hutang">Rp 0</h3></div><div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800"><p class="text-xs text-green-500 font-bold uppercase mb-1">Piutang</p><h3 class="text-xl font-extrabold text-green-600 dark:text-green-400" id="total-piutang">Rp 0</h3></div></div><button onclick="document.getElementById('form-hutang').classList.toggle('hidden')" class="w-full bg-gray-800 text-white py-3 rounded-xl font-bold text-sm mb-6 hover:bg-gray-900 transition shadow-lg">+ Catat Hutang Baru</button><form id="form-hutang" class="hidden bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-6 animate-slide-up relative"><div class="grid grid-cols-2 gap-3 mb-4"><label class="cursor-pointer"><input type="radio" name="type" value="hutang" checked class="peer sr-only"><div class="py-2 text-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 peer-checked:bg-red-500 peer-checked:text-white transition text-sm font-bold">Saya Berhutang</div></label><label class="cursor-pointer"><input type="radio" name="type" value="piutang" class="peer sr-only"><div class="py-2 text-center rounded-lg border border-gray-200 dark:border-gray-600 text-gray-500 peer-checked:bg-green-500 peer-checked:text-white transition text-sm font-bold">Saya Meminjamkan</div></label></div><input type="text" name="person" placeholder="Nama Orang" class="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-3 outline-none" required><input type="number" name="amount" placeholder="Jumlah (Rp)" class="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-3 outline-none" required><input type="text" name="note" placeholder="Catatan" class="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-4 outline-none"><button type="submit" class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700">Simpan</button></form><div id="debts-list" class="space-y-3"></div></div>`;
    document.getElementById('form-hutang').onsubmit = async (e) => { e.preventDefault(); const data = { type: e.target.type.value, person: e.target.person.value, amount: e.target.amount.value, note: e.target.note.value }; if(await addData('debts', data)) { e.target.reset(); e.target.classList.add('hidden'); } };
    unsub.debts = subscribeToDebtsSummary((res) => { document.getElementById('total-hutang').innerText = formatRupiah(res.hutang); document.getElementById('total-piutang').innerText = formatRupiah(res.piutang); });
    unsub.debtsList = subscribeToData('debts', (items) => { const list = document.getElementById('debts-list'); list.innerHTML = ''; items.forEach(item => { const amt = parseInt(item.amount); list.innerHTML += `<div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center"><div><div class="flex items-center gap-2 mb-1"><span class="text-xs font-bold uppercase px-2 py-0.5 rounded ${item.type === 'hutang' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}">${item.type === 'hutang' ? 'Hutang' : 'Piutang'}</span><span class="font-bold text-gray-800 dark:text-white">${item.person}</span></div><p class="text-xs text-gray-500">${item.note || '-'}</p></div><div class="text-right"><p class="font-bold ${item.type === 'hutang' ? 'text-red-600' : 'text-green-600'}">${formatRupiah(amt)}</p><button onclick="window.hapusItem('debts', '${item.id}')" class="text-[10px] text-gray-300 hover:text-red-500 mt-1">Hapus</button></div></div>`; }); });
}

// --- RENDER AKTIVITAS (SAMA) ---
function renderActivities(container) {
    container.innerHTML = `<div class="p-4 min-h-screen pb-24 relative"><h2 class="text-gray-500 dark:text-gray-400 text-sm mb-4 font-bold uppercase">To-Do List & Aktivitas</h2><div id="activities-list" class="space-y-3 pb-20"><div class="text-center py-10 text-gray-400">Memuat aktivitas...</div></div><button onclick="document.getElementById('form-activity-modal').classList.remove('hidden')" class="fixed bottom-20 right-4 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition z-40"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></button><div id="form-activity-modal" class="fixed inset-0 z-[70] hidden flex items-end sm:items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm sm:p-4"><div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up shadow-2xl relative"><button onclick="document.getElementById('form-activity-modal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-white">Tambah Aktivitas</h3><form id="form-activity" class="space-y-3"><input type="text" name="title" placeholder="Judul" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required><input type="text" name="desc" placeholder="Keterangan" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"><input type="date" name="date" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required><button type="submit" class="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition">Simpan</button></form></div></div></div>`;
    document.querySelector('#form-activity [name="date"]').value = new Date().toISOString().split('T')[0];
    document.getElementById('form-activity').onsubmit = async (e) => { e.preventDefault(); const data = { title: e.target.title.value, desc: e.target.desc.value, date: e.target.date.value, isDone: false }; if(await addData('activities', data)) { e.target.reset(); document.getElementById('form-activity-modal').classList.add('hidden'); } };
    unsub.activities = subscribeToData('activities', (items) => { const list = document.getElementById('activities-list'); list.innerHTML = ''; if(items.length === 0) { list.innerHTML = `<div class="text-center py-10 text-gray-400">Belum ada aktivitas.</div>`; return; } items.forEach(act => { const isDone = act.isDone; list.innerHTML += `<div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start gap-3 transition ${isDone ? 'opacity-60' : ''}"><input type="checkbox" onchange="window.toggleActivity('${act.id}', this.checked)" ${isDone ? 'checked' : ''} class="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-purple-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 cursor-pointer"><div class="flex-1"><h4 class="font-bold text-gray-800 dark:text-white ${isDone ? 'line-through text-gray-500' : ''}">${act.title}</h4><p class="text-xs text-gray-500">${act.desc || '-'}</p><span class="text-[10px] text-gray-400 mt-1 block">${act.date}</span></div><button onclick="window.hapusItem('activities', '${act.id}')" class="text-gray-300 hover:text-red-500"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>`; }); });
    window.toggleActivity = async (id, checked) => { await updateActivityStatus(id, checked); };
}

// --- RENDER LAPORAN (SAMA) ---
function renderLaporan(container) {
    // 1. Render Skeleton UI
    container.innerHTML = `
        <div class="p-4 min-h-screen pb-24">
            <h2 class="text-gray-500 dark:text-gray-400 text-sm mb-4 font-bold uppercase">Laporan Keuangan</h2>
            
            <!-- Filter Tabs -->
            <div class="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-xl mb-6">
                <button id="filter-harian" class="flex-1 py-2 text-xs font-bold rounded-lg text-gray-500 transition">Harian</button>
                <button id="filter-mingguan" class="flex-1 py-2 text-xs font-bold rounded-lg text-gray-500 transition">Mingguan</button>
                <button id="filter-bulanan" class="flex-1 py-2 text-xs font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition">Bulanan</button>
                <button id="filter-tahunan" class="flex-1 py-2 text-xs font-bold rounded-lg text-gray-500 transition">Tahunan</button>
            </div>

            <!-- Summary Cards -->
            <div class="grid grid-cols-2 gap-3 mb-6">
                <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                    <span class="text-xs text-green-600 font-bold uppercase">Pemasukan</span>
                    <h3 class="text-lg font-bold text-green-700 dark:text-green-400 mt-1" id="report-income">...</h3>
                </div>
                <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-800">
                    <span class="text-xs text-red-600 font-bold uppercase">Pengeluaran</span>
                    <h3 class="text-lg font-bold text-red-700 dark:text-red-400 mt-1" id="report-expense">...</h3>
                </div>
            </div>
            
            <!-- Chart Container -->
            <div id="chart-container" class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 min-h-[250px] flex items-end justify-center gap-3 relative overflow-x-auto">
                <p class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-400 text-sm" id="chart-loading">Memuat data...</p>
            </div>

            <!-- Detail List -->
            <h3 class="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Rincian Periode</h3>
            <div id="stats-detail" class="grid grid-cols-1 gap-3"></div>
        </div>
    `;

    // 2. State & Logic
    let currentFilter = 'bulanan';
    let rawTransactions = [];

    // Fungsi Render Content berdasarkan filter
    const updateUI = () => {
        const chartEl = document.getElementById('chart-container');
        const detailEl = document.getElementById('stats-detail');
        const incEl = document.getElementById('report-income');
        const expEl = document.getElementById('report-expense');
        
        // Reset
        document.getElementById('chart-loading')?.remove();
        chartEl.innerHTML = '';
        detailEl.innerHTML = '';

        if(rawTransactions.length === 0) {
            chartEl.innerHTML = `<p class="text-gray-400 text-sm m-auto">Belum ada data.</p>`;
            incEl.innerText = formatRupiah(0);
            expEl.innerText = formatRupiah(0);
            return;
        }

        // Grouping Logic
        const groups = {};
        let totalInc = 0;
        let totalExp = 0;

        rawTransactions.forEach(t => {
            const date = new Date(t.date);
            let key, label;

            if (currentFilter === 'harian') {
                key = t.date; // YYYY-MM-DD
                label = date.toLocaleDateString('id-ID', {day: 'numeric', month: 'short'});
            } else if (currentFilter === 'mingguan') {
                const week = getWeekNumber(date);
                const year = date.getFullYear();
                key = `${year}-W${week}`;
                label = `Mgg ${week}`;
            } else if (currentFilter === 'bulanan') {
                key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
                label = date.toLocaleDateString('id-ID', {month: 'short', year: '2-digit'});
            } else { // tahunan
                key = `${date.getFullYear()}`;
                label = `${date.getFullYear()}`;
            }

            if(!groups[key]) groups[key] = { income:0, expense:0, label: label, items: [] };
            
            const amt = parseInt(t.amount);
            if(t.type === 'pemasukan') {
                groups[key].income += amt;
                totalInc += amt;
            } else {
                groups[key].expense += amt;
                totalExp += amt;
            }
            groups[key].items.push(t);
        });

        // Update Summary Headers
        incEl.innerText = formatRupiah(totalInc);
        expEl.innerText = formatRupiah(totalExp);

        // Convert groups to array & sort
        const sortedData = Object.entries(groups).sort((a,b) => a[0].localeCompare(b[0])).map(x => x[1]);
        
        // Limit chart bars if too many
        const chartData = currentFilter === 'harian' ? sortedData.slice(-7) : sortedData.slice(-12);

        // Render Chart
        const maxVal = Math.max(...chartData.map(d => Math.max(d.income, d.expense))) || 1;
        
        chartData.forEach(d => {
            const hInc = (d.income / maxVal) * 100;
            const hExp = (d.expense / maxVal) * 100;
            
            chartEl.innerHTML += `
                <div class="flex flex-col items-center justify-end h-full w-full max-w-[40px] group">
                    <div class="flex gap-0.5 items-end h-[80%] w-full justify-center">
                        <div style="height: ${hInc}%" class="w-1/2 bg-green-400 rounded-t-sm relative"></div>
                        <div style="height: ${hExp}%" class="w-1/2 bg-red-400 rounded-t-sm relative"></div>
                    </div>
                    <span class="text-[9px] text-gray-500 mt-2 font-bold truncate w-full text-center">${d.label}</span>
                </div>
            `;
        });

        // Render Detail List (Reverse order for list)
        sortedData.reverse().forEach(d => {
            const surplus = d.income - d.expense;
            detailEl.innerHTML += `
                <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h4 class="font-bold text-gray-800 dark:text-white text-sm">${d.label} ${currentFilter === 'harian' ? '' : (currentFilter === 'bulanan' ? new Date().getFullYear() : '')}</h4>
                        <div class="flex gap-3 text-xs mt-1">
                            <span class="text-green-600">Masuk: ${formatRupiah(d.income)}</span>
                            <span class="text-red-500">Keluar: ${formatRupiah(d.expense)}</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="block text-xs text-gray-400">Selisih</span>
                        <span class="font-bold ${surplus >= 0 ? 'text-blue-600' : 'text-orange-500'}">${formatRupiah(surplus)}</span>
                    </div>
                </div>
            `;
        });
    };

    // 3. Tab Listeners
    const btns = ['harian', 'mingguan', 'bulanan', 'tahunan'];
    btns.forEach(id => {
        document.getElementById(`filter-${id}`).onclick = () => {
            currentFilter = id;
            btns.forEach(b => {
                const el = document.getElementById(`filter-${b}`);
                if(b === id) {
                    el.className = "flex-1 py-2 text-xs font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition";
                } else {
                    el.className = "flex-1 py-2 text-xs font-bold rounded-lg text-gray-500 transition";
                }
            });
            updateUI();
        };
    });

    // 4. Data Subscription
    unsub.report = subscribeToTransactions(({groupedData}) => {
        // Flatten data untuk diproses manual
        rawTransactions = [];
        groupedData.forEach(g => rawTransactions.push(...g.items));
        updateUI(); // Initial render
    });
}

// --- MODAL & MENU (SAMA SPT SEBELUMNYA) ---
window.openMenuTambah = () => {
    const modal = document.getElementById('modal-container');
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-6 animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
            <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Buat Transaksi Baru</h3>
            <div class="space-y-2">
                <button onclick="window.renderTambahModal()" class="w-full flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition group"><div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></div><div class="text-left"><p class="font-bold text-gray-800 dark:text-white">Tambah Transaksi</p><p class="text-xs text-gray-500">Pemasukan & Pengeluaran Harian</p></div></button>
                <button onclick="window.renderTransferModal()" class="w-full flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition group"><div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg></div><div class="text-left"><p class="font-bold text-gray-800 dark:text-white">Transfer Saldo</p><p class="text-xs text-gray-500">Pindah dana antar rekening</p></div></button>
                <button onclick="window.location.hash='#hutang'; window.closeModal()" class="w-full flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition group"><div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg></div><div class="text-left"><p class="font-bold text-gray-800 dark:text-white">Hutang / Piutang</p><p class="text-xs text-gray-500">Catat pinjaman teman</p></div></button>
            </div>
            <button onclick="window.closeModal()" class="w-full mt-6 py-3 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-white transition">Batal</button>
        </div>`;
    modal.onclick = (e) => { if (e.target === modal) window.closeModal(); };
};
window.closeModal = () => { document.getElementById('modal-container').classList.add('hidden'); };

window.renderTambahModal = async () => {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `<div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up relative h-[90vh] sm:h-auto overflow-y-auto"><div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div><button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white text-center">Tambah Transaksi</h3><form id="form-transaksi" class="space-y-5 pb-10"><div class="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl"><label class="cursor-pointer"><input type="radio" name="type" value="pengeluaran" checked class="peer sr-only" onchange="window.updateCategoryDropdown(this.value)"><div class="py-3 text-center rounded-lg text-gray-500 dark:text-gray-300 font-bold text-sm transition peer-checked:bg-white dark:peer-checked:bg-gray-600 peer-checked:text-red-500 peer-checked:shadow-sm">Pengeluaran</div></label><label class="cursor-pointer"><input type="radio" name="type" value="pemasukan" class="peer sr-only" onchange="window.updateCategoryDropdown(this.value)"><div class="py-3 text-center rounded-lg text-gray-500 dark:text-gray-300 font-bold text-sm transition peer-checked:bg-white dark:peer-checked:bg-gray-600 peer-checked:text-green-500 peer-checked:shadow-sm">Pemasukan</div></label></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Kategori</label><div class="relative"><select name="categoryId" id="select-category" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none"><option value="">Memuat...</option></select><div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Rekening / Dompet</label><div class="relative"><select name="accountId" id="select-account" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none"><option value="">Memuat...</option></select><div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">JUMLAH</label><div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span><input type="number" name="amount" required class="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white text-2xl font-bold outline-none" placeholder="0"></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">CATATAN (OPSIONAL)</label><input type="text" name="note" class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" placeholder="Keterangan transaksi..."></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Tanggal</label><input type="date" name="date" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none"></div><button type="submit" class="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg mt-4">Simpan Transaksi</button></form></div>`;
    const [categories, accounts] = await Promise.all([getDataOnce('categories'), getDataOnce('accounts')]);
    const selectCat = document.getElementById('select-category'); const selectAcc = document.getElementById('select-account');
    window.updateCategoryDropdown = (type) => { selectCat.innerHTML = ''; const filtered = categories.filter(c => c.type === type); if(filtered.length === 0) { selectCat.innerHTML = `<option value="">Belum ada kategori ${type}</option>`; } else { filtered.forEach(c => { const opt = document.createElement('option'); opt.value = c.id; opt.text = c.name; opt.setAttribute('data-name', c.name); selectCat.appendChild(opt); }); } };
    selectAcc.innerHTML = ''; if(accounts.length === 0) { selectAcc.innerHTML = `<option value="">Belum ada rekening</option>`; } else { accounts.forEach(a => { const opt = document.createElement('option'); opt.value = a.id; opt.text = `${a.name} (${a.holder || '-'})`; opt.setAttribute('data-name', a.name); selectAcc.appendChild(opt); }); }
    window.updateCategoryDropdown('pengeluaran'); modal.querySelector('[name="date"]').value = new Date().toISOString().split('T')[0];
    document.getElementById('form-transaksi').onsubmit = async (e) => { e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); const catSelect = e.target.categoryId; const accSelect = e.target.accountId; const catName = catSelect.options[catSelect.selectedIndex]?.getAttribute('data-name') || 'Unknown'; const accName = accSelect.options[accSelect.selectedIndex]?.getAttribute('data-name') || 'Unknown'; const data = { amount: e.target.amount.value, type: e.target.type.value, categoryId: e.target.categoryId.value, categoryName: catName, accountId: e.target.accountId.value, accountName: accName, date: e.target.date.value, note: e.target.note.value }; btn.innerHTML = 'Menyimpan...'; btn.disabled = true; if(await addData('transactions', data)) { window.closeModal(); } else { alert("Gagal menyimpan."); btn.innerHTML = 'Simpan Transaksi'; btn.disabled = false; } };
}
window.renderTransferModal = async () => {
    const modal = document.getElementById('modal-container');
    modal.innerHTML = `<div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up relative h-[90vh] sm:h-auto overflow-y-auto"><div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div><button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white text-center">Transfer Saldo</h3><form id="form-transfer" class="space-y-4"><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">DARI REKENING</label><div class="relative"><select name="fromAccountId" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none"><option value="">Pilih Rekening Asal</option></select><div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">KE REKENING</label><div class="relative"><select name="toAccountId" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none"><option value="">Pilih Rekening Tujuan</option></select><div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">JUMLAH</label><div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span><input type="number" name="amount" required class="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white text-xl font-bold outline-none" placeholder="0"></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">BIAYA ADMIN (OPSIONAL)</label><div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span><input type="number" name="adminFee" class="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white text-sm font-bold outline-none" placeholder="0"></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">TANGGAL</label><input type="date" name="date" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none"></div><button type="submit" class="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition shadow-lg mt-4">Proses Transfer</button></form></div>`;
    const accounts = await getDataOnce('accounts');
    const fromSelect = modal.querySelector('[name="fromAccountId"]'); const toSelect = modal.querySelector('[name="toAccountId"]');
    const populate = (sel) => { accounts.forEach(a => { const opt = document.createElement('option'); opt.value = a.id; opt.text = `${a.name} (${a.holder || '-'})`; opt.setAttribute('data-name', a.name); sel.appendChild(opt); }); };
    populate(fromSelect); populate(toSelect); modal.querySelector('[name="date"]').value = new Date().toISOString().split('T')[0];
    document.getElementById('form-transfer').onsubmit = async (e) => { e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); const fromSel = e.target.fromAccountId; const toSel = e.target.toAccountId; if (fromSel.value === toSel.value) { alert("Rekening asal dan tujuan tidak boleh sama!"); return; } const data = { fromAccountId: fromSel.value, fromAccountName: fromSel.options[fromSel.selectedIndex].getAttribute('data-name'), toAccountId: toSel.value, toAccountName: toSel.options[toSel.selectedIndex].getAttribute('data-name'), amount: parseInt(e.target.amount.value), adminFee: parseInt(e.target.adminFee.value) || 0, date: e.target.date.value }; btn.innerHTML = 'Memproses...'; btn.disabled = true; if (await addTransfer(data)) { window.closeModal(); } else { alert("Transfer Gagal."); btn.innerHTML = 'Proses Transfer'; btn.disabled = false; } };
}
window.renderExportModal = () => { toggleDropdown(false); const modal = document.getElementById('modal-container'); modal.classList.remove('hidden'); modal.innerHTML = `<div class="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-2xl p-6 m-4 animate-slide-up shadow-2xl relative"><button onclick="window.closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Ekspor Data Transaksi</h3><form id="form-export" class="space-y-4"><div><label class="block text-xs font-bold text-gray-500 mb-1">DARI TANGGAL</label><input type="date" name="startDate" required class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"></div><div><label class="block text-xs font-bold text-gray-500 mb-1">SAMPAI TANGGAL</label><input type="date" name="endDate" required class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"></div><button type="submit" class="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg flex items-center justify-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Unduh CSV / Excel</button></form></div>`; const today = new Date(); const firstDay = new Date(today.getFullYear(), today.getMonth(), 1); modal.querySelector('[name="startDate"]').value = firstDay.toISOString().split('T')[0]; modal.querySelector('[name="endDate"]').value = today.toISOString().split('T')[0]; document.getElementById('form-export').onsubmit = async (e) => { e.preventDefault(); const btn = e.target.querySelector('button'); const start = e.target.startDate.value; const end = e.target.endDate.value; btn.innerHTML = 'Memproses...'; btn.disabled = true; const data = await getTransactionsByDateRange(start, end); if (data.length === 0) { alert("Tidak ada data pada rentang tanggal tersebut."); btn.innerHTML = 'Unduh CSV / Excel'; btn.disabled = false; return; } const headers = ["Tanggal", "Tipe", "Kategori", "Akun", "Jumlah", "Catatan"]; const csvRows = [headers.join(",")]; data.forEach(row => { const values = [row.date, row.type, `"${row.categoryName || row.category}"`, `"${row.accountName || '-'}"`, row.amount, `"${row.note || ''}"`]; csvRows.push(values.join(",")); }); const csvString = csvRows.join("\n"); const blob = new Blob([csvString], { type: "text/csv" }); const url = window.URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `Laporan_Transaksi_${start}_sd_${end}.csv`; a.click(); window.closeModal(); }; };
window.renderInfoModal = () => { toggleDropdown(false); const modal = document.getElementById('modal-container'); modal.classList.remove('hidden'); modal.innerHTML = `<div class="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-2xl p-6 m-4 animate-scale-up text-center shadow-2xl relative"><button onclick="window.closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4"><svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><h3 class="text-xl font-bold text-gray-800 dark:text-white mb-2">Dulpan Finance</h3><p class="text-gray-500 text-sm mb-6">Versi 1.3.0<br>Sistem manajemen keuangan pribadi terintegrasi.</p><button onclick="window.closeModal()" class="w-full bg-blue-600 text-white py-2 rounded-lg font-bold">Tutup</button></div>`; };

// --- INISIALISASI ---
function initializeApp() {
    document.getElementById('app').innerHTML = AppTemplate;
    window.hapusItem = async (col, id) => { if(confirm("Hapus data ini?")) await deleteData(col, id); };
    const toggleTheme = () => { currentTheme = (currentTheme === 'light') ? 'dark' : 'light'; localStorage.setItem('theme', currentTheme); applyTheme(); };
    const applyTheme = () => { const icon = document.getElementById('theme-icon'); if (currentTheme === 'dark') { document.documentElement.classList.add('dark'); if(icon) icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>`; } else { document.documentElement.classList.remove('dark'); if(icon) icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>`; } };
    document.getElementById('theme-toggle-btn').addEventListener('click', toggleTheme); applyTheme();
    onAuthStateChanged(auth, (user) => { if (user) { isLoggedIn = true; currentUser = user; renderAuthStatus(); if (window.location.hash === '#login' || window.location.hash === '') window.location.hash = '#beranda'; else handleHashChange(); } else { isLoggedIn = false; currentUser = null; renderAuthStatus(); window.location.hash = '#login'; handleHashChange(); } });
    window.addEventListener('hashchange', handleHashChange);
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/public/service-worker.js').catch(console.error);
}

initializeApp();