// source/module.js

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
    subscribeToFinancialSummary, 
    updateActivityStatus,
    formatRupiah 
} from "./main.js"; 
import { auth } from "../conf/auth.js";

// --- STATE LOKAL MODUL ---
let viewState = {
    filter: 'bulanan', 
    date: new Date(),
    // State Pendanaan Baru
    pendanaanView: 'dashboard', // 'dashboard' atau 'detail'
    pendanaanType: 'hutang',    // 'hutang' atau 'piutang' (untuk view detail)
    pendanaanStatus: 'belum'    // 'belum' atau 'lunas'
};

// --- HELPERS ---
export const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

// --- CUSTOM ALERTS & MODALS ---
export function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl z-[100] font-bold text-sm animate-slide-down transition-all duration-300 ${type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`;
    toast.innerText = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('opacity-0', '-translate-y-full');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

export function showConfirmModal(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = "fixed inset-0 z-[80] flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm p-4 animate-fade-in";
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl scale-95 animate-scale-up">
            <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2">${title}</h3>
            <p class="text-gray-500 dark:text-gray-400 text-sm mb-6">${message}</p>
            <div class="grid grid-cols-2 gap-3">
                <button id="btn-cancel-confirm" class="py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Batal</button>
                <button id="btn-yes-confirm" class="py-2.5 rounded-xl font-bold text-white bg-red-600 hover:bg-red-700 transition">Ya, Lanjutkan</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btn-cancel-confirm').onclick = () => modal.remove();
    document.getElementById('btn-yes-confirm').onclick = () => { onConfirm(); modal.remove(); };
}


// --- KONFIGURASI ICON
const Icons = {
    // === 1. REKENING & E-WALLET (INDONESIA) ===
    // Bank Umum
    'wallet': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="5" width="20" height="14" rx="3" fill="#3B82F6"/><path d="M18 12H22" stroke="white" stroke-width="2" stroke-linecap="round"/><path d="M2 9V15" stroke="white" stroke-opacity="0.2" stroke-width="2"/></svg>`,
    'cash': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" fill="#10B981"/><circle cx="12" cy="12" r="3" fill="white" fill-opacity="0.3"/><path d="M18 12H18.01" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`,
    'bca': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#00529C"/><path d="M6 12L10 16L18 8" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`, // Biru BCA
    'mandiri': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#003D79"/><circle cx="12" cy="12" r="4" fill="#FFB700"/><path d="M12 12L16 8" stroke="#FFB700" stroke-width="2"/></svg>`, // Biru Mandiri + Kuning
    'bri': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#00529C"/><path d="M2 12H22" stroke="#F37021" stroke-width="4"/></svg>`, // Biru + Orange BRI
    'bni': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#006885"/><path d="M7 8H17M7 12H17M7 16H12" stroke="#F15A23" stroke-width="3" stroke-linecap="round"/></svg>`, // Tosca BNI + Orange
    'jago': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#FBBA00"/><path d="M12 8V16M8 12H16" stroke="#262626" stroke-width="3" stroke-linecap="round"/></svg>`, // Kuning Jago
    'seabank': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#FF5600"/><path d="M6 14L10 10L14 14L18 10" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`, // Orange Seabank
    
    // E-Wallet
    'gopay': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#00AEEF"/><circle cx="12" cy="12" r="5" fill="white"/><circle cx="12" cy="12" r="2" fill="#00AA13"/></svg>`, // Biru + Hijau Gojek
    'ovo': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#4C3494"/><circle cx="12" cy="12" r="5" stroke="white" stroke-width="2"/></svg>`, // Ungu OVO
    'shopeepay': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#EE4D2D"/><path d="M12 7V17M15 10H9" stroke="white" stroke-width="3" stroke-linecap="round"/></svg>`, // Orange Shopee
    'dana': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#118EEA"/><path d="M7 12L12 17L17 7" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>`, // Biru Dana
    'linkaja': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="4" width="20" height="16" rx="3" fill="#ED1C24"/><circle cx="12" cy="12" r="4" fill="white"/></svg>`, // Merah LinkAja

    // === 2. PENGELUARAN (MORE CATEGORIES) ===
    // Makanan & Harian
    'food': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><circle cx="12" cy="12" r="10" fill="#FCA5A5"/><path d="M12 6V18" stroke="#B91C1C" stroke-width="2"/><path d="M7 10L17 10" stroke="#B91C1C" stroke-width="2"/><path d="M8 14H16" stroke="#B91C1C" stroke-width="2"/></svg>`, // Makan Berat
    'drink': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M6 5H18V15C18 18.3137 15.3137 21 12 21C8.68629 21 6 18.3137 6 15V5Z" fill="#93C5FD"/><path d="M18 8H21C21.5523 8 22 8.44772 22 9V11C22 11.5523 21.5523 12 21 12H18" stroke="#3B82F6" stroke-width="2"/><path d="M8 5V3" stroke="#3B82F6" stroke-width="2"/></svg>`, // Minuman/Kopi
    'snack': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><circle cx="12" cy="12" r="10" fill="#FDE68A"/><path d="M8 12L16 12" stroke="#D97706" stroke-width="3" stroke-linecap="round"/><path d="M12 8V16" stroke="#D97706" stroke-width="3" stroke-linecap="round"/></svg>`, // Jajan/Cemilan
    'groceries': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M3 6h18l-2 13H5L3 6z" fill="#FCD34D"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#D97706" stroke-width="2"/></svg>`, // Belanja Bulanan

    // Transport & Kendaraan
    'transport': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="3" y="10" width="18" height="10" rx="2" fill="#A78BFA"/><path d="M5 10L7 4H17L19 10" fill="#8B5CF6"/><circle cx="7" cy="16" r="2" fill="white"/><circle cx="17" cy="16" r="2" fill="white"/></svg>`, // Umum/Ojol
    'fuel': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M4 22V8C4 6.89543 4.89543 6 6 6H12C13.1046 6 14 6.89543 14 8V22" fill="#FBBF24"/><path d="M14 6H16C17.1046 6 18 6.89543 18 8V11C18 13 17 14 15 14" stroke="#D97706" stroke-width="2"/><path d="M8 10H10" stroke="#D97706" stroke-width="2"/></svg>`, // Bensin
    'parking': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><circle cx="12" cy="12" r="10" fill="#E5E7EB"/><path d="M9 7H13C15.2091 7 17 8.79086 17 11C17 13.2091 15.2091 15 13 15H9V7Z" stroke="#4B5563" stroke-width="2"/><path d="M9 15V19" stroke="#4B5563" stroke-width="2"/></svg>`, // Parkir
    'service': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><circle cx="12" cy="12" r="10" fill="#9CA3AF"/><path d="M14.5 9.5L9.5 14.5M9.5 9.5L14.5 14.5" stroke="white" stroke-width="2" stroke-linecap="round"/></svg>`, // Bengkel

    // Rumah & Tagihan
    'house': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M2 10L12 2L22 10V20C22 20.55 21.55 21 21 21H3C2.45 21 2 20.55 2 20V10Z" fill="#6EE7B7"/><rect x="9" y="14" width="6" height="7" fill="#059669"/></svg>`, // Sewa/KPR
    'pln': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="#F59E0B" stroke="#D97706" stroke-width="2" stroke-linejoin="round"/></svg>`, // Listrik
    'water': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M12 22C16.4183 22 20 18.4183 20 14C20 8 12 2 12 2C12 2 4 8 4 14C4 18.4183 7.58172 22 12 22Z" fill="#3B82F6"/></svg>`, // Air/PDAM
    'wifi': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M5 12.55C5 12.55 8.13 9 12 9C15.87 9 19 12.55 19 12.55" stroke="#60A5FA" stroke-width="3" stroke-linecap="round"/><path d="M2 8.55C2 8.55 6.67 4 12 4C17.33 4 22 8.55 22 8.55" stroke="#2563EB" stroke-width="3" stroke-linecap="round"/><circle cx="12" cy="19" r="2" fill="#2563EB"/></svg>`, // Internet
    'laundry': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" fill="#A7F3D0"/><circle cx="12" cy="12" r="5" stroke="#059669" stroke-width="2"/><path d="M12 10V14M10 12H14" stroke="#059669" stroke-width="2"/></svg>`, // Laundry

    // Gaya Hidup & Hiburan
    'shopping': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M9 20C9 21.1046 8.10457 22 7 22C5.89543 22 5 21.1046 5 20C5 18.8954 5.89543 18 7 18C8.10457 18 9 18.8954 9 20Z" fill="#F87171"/><path d="M20 20C20 21.1046 19.1046 22 18 22C16.8954 22 16 21.1046 16 20C16 18.8954 16.8954 18 18 18C19.1046 18 20 18.8954 20 20Z" fill="#F87171"/><path d="M1 1H4L6.68 14.39C6.77144 14.8504 7.02191 15.264 7.38755 15.5583C7.75318 15.8526 8.2107 16.009 8.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    'skincare': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="7" y="10" width="10" height="12" rx="2" fill="#FBCFE8"/><path d="M12 10V6C12 4.34315 13.3431 3 15 3" stroke="#EC4899" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16" r="3" fill="#EC4899" fill-opacity="0.3"/></svg>`, // Skincare/Makeup
    'entertainment': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="6" width="20" height="12" rx="2" fill="#818CF8"/><path d="M7 6L5 2M17 6L19 2M2 10H22M12 10V18M7 14L12 18L17 14" stroke="#312E81" stroke-width="2" stroke-linecap="round"/></svg>`, // Nonton/Game
    'travel': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" stroke="#3B82F6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="#93C5FD"/></svg>`, // Jalan-jalan/Tiket
    'gadget': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="7" y="2" width="10" height="20" rx="2" fill="#D1D5DB"/><circle cx="12" cy="18" r="1.5" fill="black"/><path d="M10 5H14" stroke="black" stroke-width="1.5" stroke-linecap="round"/></svg>`, // HP/Elektronik

    // Lain-lain
    'health': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5Z" fill="#FCA5A5"/><path d="M12 9V15" stroke="#B91C1C" stroke-width="3" stroke-linecap="round"/><path d="M9 12H15" stroke="#B91C1C" stroke-width="3" stroke-linecap="round"/></svg>`, // Dokter/Obat
    'education': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M12 3L1 9L12 15L21 10.09V17H23V9L12 3Z" fill="#FBBF24"/><path d="M7 12.28V18C7 18 7 21 12 21C17 21 17 18 17 18V12.28" stroke="#D97706" stroke-width="2" stroke-linecap="round"/></svg>`,
    'pets': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M12 9C12 9 14.5 11 16 11C17.5 11 19 9.5 19 7.5C19 5.5 17.5 4 16 4C14.5 4 13.5 5 12 6.5C10.5 5 9.5 4 8 4C6.5 4 5 5.5 5 7.5C5 9.5 6.5 11 8 11C9.5 11 12 9 12 9Z" fill="#F472B6"/><circle cx="8" cy="15" r="2" fill="#F472B6"/><circle cx="16" cy="15" r="2" fill="#F472B6"/><circle cx="12" cy="19" r="2" fill="#F472B6"/></svg>`, // Anabul
    'charity': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#EC4899"/></svg>`, // Sedekah

    // === 3. PEMASUKAN ===
    'salary': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="2" y="7" width="20" height="14" rx="2" fill="#34D399"/><path d="M12 7V3" stroke="#059669" stroke-width="2"/><path d="M8 3H16" stroke="#059669" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="14" r="3" fill="white" fill-opacity="0.4"/></svg>`, // Gaji
    'bonus': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><circle cx="12" cy="12" r="10" fill="#FCD34D"/><path d="M12 6V12L16 16" stroke="#B45309" stroke-width="2" stroke-linecap="round"/><path d="M12 2V4" stroke="#B45309" stroke-width="2"/></svg>`, // Bonus/THR
    'freelance': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="3" y="4" width="18" height="14" rx="2" fill="#60A5FA"/><path d="M8 22H16" stroke="#2563EB" stroke-width="3" stroke-linecap="round"/><path d="M12 18V22" stroke="#2563EB" stroke-width="3"/></svg>`, // Proyek Luar
    'selling': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M3 3H21" stroke="#10B981" stroke-width="3" stroke-linecap="round"/><path d="M12 3V21" stroke="#10B981" stroke-width="3" stroke-linecap="round"/><path d="M3 21H21" stroke="#10B981" stroke-width="3" stroke-linecap="round"/></svg>`, // Hasil Jualan
    'gift': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><rect x="3" y="8" width="18" height="14" rx="2" fill="#F472B6"/><path d="M12 8V22" stroke="#BE185D" stroke-width="2"/><path d="M3 13H21" stroke="#BE185D" stroke-width="2"/><path d="M12 8H7.5C5.5 8 4 6.5 4 4.5C4 2.5 5.5 1 7.5 1C9.5 1 12 3 12 8Z" stroke="#BE185D" stroke-width="2"/><path d="M12 8H16.5C18.5 8 20 6.5 20 4.5C20 2.5 18.5 1 16.5 1C14.5 1 12 3 12 8Z" stroke="#BE185D" stroke-width="2"/></svg>`, // Hadiah
    'investment': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M3 21H21" stroke="#10B981" stroke-width="2" stroke-linecap="round"/><path d="M5 21V16" stroke="#34D399" stroke-width="3"/><path d="M9 21V12" stroke="#34D399" stroke-width="3"/><path d="M13 21V8" stroke="#34D399" stroke-width="3"/><path d="M17 21V4" stroke="#34D399" stroke-width="3"/><path d="M5 16L17 4" stroke="#059669" stroke-width="2" stroke-linecap="round"/></svg>`,
    'refund': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><path d="M4 12C4 7.58172 7.58172 4 12 4C16.4183 4 20 7.58172 20 12" stroke="#60A5FA" stroke-width="3" stroke-linecap="round"/><path d="M20 12L16 8M20 12L16 16" stroke="#60A5FA" stroke-width="3" stroke-linecap="round"/></svg>`, // Pengembalian Dana
    
    // --- DEFAULT ---
    'default': `<svg viewBox="0 0 24 24" class="w-full h-full" fill="none"><circle cx="12" cy="12" r="10" fill="#E5E7EB"/><path d="M12 7V17" stroke="#9CA3AF" stroke-width="2"/><path d="M7 12H17" stroke="#9CA3AF" stroke-width="2"/></svg>`
};

// Daftar Kategori untuk Pilihan (UPDATE)
const IconLists = {
    accounts: ['wallet', 'cash', 'bca', 'mandiri', 'bri', 'bni', 'jago', 'seabank', 'gopay', 'ovo', 'dana', 'shopeepay', 'linkaja'],
    expense: ['food', 'drink', 'snack', 'groceries', 'transport', 'fuel', 'parking', 'service', 'house', 'pln', 'water', 'wifi', 'laundry', 'shopping', 'skincare', 'entertainment', 'travel', 'gadget', 'health', 'education', 'pets', 'charity'],
    income: ['salary', 'bonus', 'freelance', 'selling', 'gift', 'investment', 'refund']
};

// --- GLOBAL FUNCTIONS SETUP ---
export function initGlobalFunctions() {
    // Helper Hapus Global
    window.hapusItem = (col, id) => {
        showConfirmModal("Hapus Data?", "Data yang dihapus tidak dapat dikembalikan.", async () => {
            if(await deleteData(col, id)) { showToast("Data berhasil dihapus"); window.closeModal(); } 
            else { showToast("Gagal menghapus data", "error"); }
        });
    };

    // FIX: Fungsi Close Modal dengan Animasi Swipe
    window.closeModal = () => { 
        const modal = document.getElementById('modal-container');
        const modalContent = modal.querySelector('.modal-content-sheet');
        if (modalContent) {
            modalContent.style.transform = 'translateY(100%)';
            modalContent.style.transition = 'transform 0.3s ease-in';
            setTimeout(() => {
                 modal.classList.add('hidden'); 
                 modalContent.style.transform = '';
                 modalContent.style.transition = '';
            }, 300);
        } else {
             modal.classList.add('hidden');
        }
    }
    window.toggleActivity = async (id, checked) => { await updateActivityStatus(id, checked); };

    // --- 1. MODAL REKENING (BARU) ---
    window.renderAccountModal = (encodedItem = null) => {
        const item = encodedItem ? JSON.parse(decodeURIComponent(encodedItem)) : null;
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        
        // Render Icon Grid dari IconLists
        const iconsHTML = IconLists.accounts.map(key => `
            <label class="cursor-pointer group">
                <input type="radio" name="icon" value="${key}" ${item && item.icon === key ? 'checked' : ''} class="peer sr-only">
                <div class="w-14 h-14 p-2 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent peer-checked:border-blue-500 peer-checked:bg-blue-50 dark:peer-checked:bg-blue-900/20 hover:scale-105 transition-all shadow-sm">
                    ${Icons[key] || Icons['default']}
                </div>
            </label>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content-sheet bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up relative shadow-2xl h-[85vh] sm:h-auto overflow-y-auto">
                <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                <button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                <h3 class="font-bold text-lg mb-6 text-gray-800 dark:text-white text-center">${item ? 'Edit Rekening' : 'Tambah Rekening Baru'}</h3>
                
                <form id="form-account" class="space-y-5">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Pilih Ikon</label>
                        <div class="flex flex-wrap gap-3 justify-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-600">
                            ${iconsHTML}
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Nama Akun / Bank</label>
                        <input type="text" name="name" value="${item ? item.name : ''}" placeholder="Contoh: BCA, OVO, Tunai" class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none font-bold" required>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Pemilik (Opsional)</label>
                        <input type="text" name="holder" value="${item ? (item.holder || '') : ''}" placeholder="Atas Nama" class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none">
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Saldo Awal</label>
                        <input type="number" name="initialBalance" value="${item ? (item.initialBalance || 0) : ''}" placeholder="0" class="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white text-xl font-bold outline-none" required>
                    </div>

                    <div class="grid ${item ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-4">
                        ${item ? `<button type="button" onclick="window.hapusItem('accounts', '${item.id}')" class="py-3.5 font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition">Hapus</button>` : ''}
                        <button type="submit" class="bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 shadow-lg transition shadow-blue-500/30">${item ? 'Simpan Perubahan' : 'Buat Rekening'}</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('form-account').onsubmit = async (e) => {
            e.preventDefault();
            const icon = document.querySelector('input[name="icon"]:checked')?.value || 'wallet';
            const data = {
                name: e.target.name.value,
                holder: e.target.holder.value,
                initialBalance: parseInt(e.target.initialBalance.value) || 0,
                icon: icon
            };

            let success = false;
            if(item) success = await updateData('accounts', item.id, data);
            else success = await addData('accounts', data);

            if(success) { showToast("Data rekening tersimpan"); window.closeModal(); }
        };
    };
    
    // --- 2. MODAL KATEGORI (BARU) ---
    window.renderCategoryModal = (encodedItem = null) => {
        const item = encodedItem ? JSON.parse(decodeURIComponent(encodedItem)) : null;
        const currentType = item ? item.type : 'pengeluaran'; 
        // Pilih list kunci icon yang sesuai
        const listToUse = currentType === 'pemasukan' ? IconLists.income : IconLists.expense;

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        // Render Icon Grid menggunakan SVG dari objek 'Icons'
        const iconsHTML = listToUse.map(key => `
            <label class="cursor-pointer group">
                <input type="radio" name="icon" value="${key}" ${item && item.icon === key ? 'checked' : ''} class="peer sr-only">
                <div class="w-14 h-14 p-2 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent peer-checked:border-indigo-500 peer-checked:bg-indigo-50 dark:peer-checked:bg-indigo-900/20 hover:scale-105 transition-all shadow-sm">
                    ${Icons[key] || Icons['default']}
                </div>
            </label>
        `).join('');

        modal.innerHTML = `
            <div class="modal-content-sheet bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up relative shadow-2xl h-[70vh] sm:h-auto overflow-y-auto">
                <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                <button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                <h3 class="font-bold text-lg mb-6 text-gray-800 dark:text-white text-center">${item ? 'Edit Kategori' : 'Tambah ' + currentType}</h3>
                
                <form id="form-kategori-modal" class="space-y-5">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Pilih Ikon</label>
                        <div class="flex flex-wrap gap-3 justify-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-3xl border border-dashed border-gray-200 dark:border-gray-600">
                            ${iconsHTML}
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Nama Kategori</label>
                        <input type="text" name="name" value="${item ? item.name : ''}" placeholder="Contoh: Makanan, Gaji" class="w-full p-4 rounded-2xl border bg-gray-50 dark:bg-gray-700 border-gray-100 dark:border-gray-600 outline-none font-bold" required>
                    </div>

                    <input type="hidden" name="type" value="${currentType}">

                    <div class="grid ${item ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-4">
                        ${item ? `<button type="button" onclick="window.hapusItem('categories', '${item.id}')" class="py-3.5 font-bold text-red-500 bg-red-50 rounded-xl">Hapus</button>` : ''}
                        <button type="submit" class="bg-indigo-600 text-white font-bold py-3.5 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/30">${item ? 'Simpan' : 'Tambah'}</button>
                    </div>
                </form>
            </div>
        `;

        document.getElementById('form-kategori-modal').onsubmit = async (e) => {
            e.preventDefault();
            // Ambil value icon, default fallback jika tidak ada
            const iconKey = document.querySelector('input[name="icon"]:checked')?.value || (currentType==='pemasukan'?'salary':'food');
            const data = { 
                name: e.target.name.value, 
                type: e.target.type.value,
                icon: iconKey // Simpan Key (misal 'food'), bukan SVG-nya
            }; 
            
            let success = false;
            if(item) success = await updateData('categories', item.id, data);
            else success = await addData('categories', data);

            if(success) { window.closeModal(); showToast("Kategori tersimpan"); }
        };
    };
    
    // --- 3. MODAL AKTIVITAS (FIX SCOPE) ---
    window.renderEditActivityModal = (encodedItem = null) => {
        const item = encodedItem ? JSON.parse(decodeURIComponent(encodedItem)) : null;
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        
        modal.innerHTML = `<div class="modal-content-sheet bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up relative shadow-2xl"><div class="handle-bar w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div><button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-white text-center">${item ? 'Edit Aktivitas' : 'Tambah Aktivitas'}</h3><form id="form-activity-edit" class="space-y-4"><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Judul Kegiatan</label><input type="text" name="title" value="${item ? item.title : ''}" placeholder="Contoh: Meeting Proyek" class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Deskripsi</label><input type="text" name="desc" value="${item ? (item.desc || '') : ''}" placeholder="Detail tambahan..." class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Tanggal Target</label><input type="date" name="date" value="${item ? item.date : new Date().toISOString().split('T')[0]}" class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required></div><div class="grid ${item ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-2">${item ? `<button type="button" onclick="window.hapusItem('activities', '${item.id}')" class="py-3 font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition">Hapus</button>` : ''}<button type="submit" class="bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 shadow-lg transition">${item ? 'Simpan' : 'Tambah'}</button></div></form></div>`;
        document.getElementById('form-activity-edit').onsubmit = async (e) => { e.preventDefault(); const data = { title: e.target.title.value, desc: e.target.desc.value, date: e.target.date.value }; if(!item) data.isDone = false; let success = false; if(item) success = await updateData('activities', item.id, data); else success = await addData('activities', data); if(success) { showToast(item ? "Aktivitas diperbarui" : "Aktivitas ditambahkan"); window.closeModal(); } };
    };

    // --- MENU FAB ---
    window.openMenuTambah = () => {
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        modal.innerHTML = `
            <div class="modal-content-sheet bg-white dark:bg-gray-800 w-full rounded-t-3xl p-6 animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.2)] relative touch-pan-y">
                <div class="handle-bar w-16 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-6 cursor-grab active:cursor-grabbing"></div>
                
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4 px-2">Menu Cepat</h3>
                <div class="space-y-3">
                    <button onclick="window.renderTambahModal()" class="w-full flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-2xl transition group border border-transparent hover:border-blue-100 dark:hover:border-gray-600">
                        <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mr-4 shadow-sm group-hover:scale-105 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></div>
                        <div class="text-left"><p class="font-bold text-gray-800 dark:text-white text-base">Transaksi Baru</p><p class="text-xs text-gray-500">Pemasukan & Pengeluaran</p></div>
                    </button>
                    <button onclick="window.renderTransferModal()" class="w-full flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-2xl transition group border border-transparent hover:border-blue-100 dark:hover:border-gray-600">
                        <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mr-4 shadow-sm group-hover:scale-105 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg></div>
                        <div class="text-left"><p class="font-bold text-gray-800 dark:text-white text-base">Transfer Saldo</p><p class="text-xs text-gray-500">Antar rekening sendiri</p></div>
                    </button>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="window.renderTambahHutangModal()" class="w-full flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-2xl transition group border border-transparent hover:border-blue-100 dark:hover:border-gray-600 text-center">
                            <div class="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>
                            <div><p class="font-bold text-gray-800 dark:text-white text-sm">Catat Pendanaan</p><p class="text-[10px] text-gray-500">Hutang & Piutang</p></div>
                        </button>
                         <button onclick="window.renderEditActivityModal()" class="w-full flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-2xl transition group border border-transparent hover:border-blue-100 dark:hover:border-gray-600 text-center">
                            <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg></div>
                            <div><p class="font-bold text-gray-800 dark:text-white text-sm">Tambah Aktivitas</p><p class="text-[10px] text-gray-500">Target & To-Do</p></div>
                        </button>
                    </div>
                </div>
                <button onclick="window.closeModal()" class="w-full mt-8 py-4 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition text-sm">Tutup Menu</button>
            </div>`;
        modal.onclick = (e) => { if (e.target === modal) window.closeModal(); };
    
    // --- LOGIKA GESTURE TARIK-TUTUP (Apple Style) ---
        const sheet = modal.querySelector('.modal-content-sheet');
        const handle = modal.querySelector('.handle-bar');
        let startY, currentY, dragging = false;

        handle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            dragging = true;
            sheet.style.transition = 'none'; // Matikan animasi saat drag
        }, {passive: true});

        handle.addEventListener('touchmove', (e) => {
            if (!dragging) return;
            currentY = e.touches[0].clientY;
            const deltaY = currentY - startY;
            // Hanya izinkan tarik ke bawah (deltaY positif)
            if (deltaY > 0) {
                sheet.style.transform = `translateY(${deltaY}px)`;
            }
        }, {passive: true});

        handle.addEventListener('touchend', (e) => {
            if (!dragging) return;
            dragging = false;
            const deltaY = currentY - startY;
            sheet.style.transition = 'transform 0.3s ease-out'; // Hidupkan lagi animasi
            
            // Jika ditarik lebih dari 150px, tutup modal
            if (deltaY > 150) {
                window.closeModal();
            } else {
                // Jika tidak, kembalikan ke posisi semula (snap back)
                sheet.style.transform = 'translateY(0)';
            }
            startY = null; currentY = null;
        });
    };
    

    // --- FORM PENDANAAN LENGKAP (ADD / EDIT / CICIL) ---
    window.renderTambahHutangModal = async (editItemString = null) => {
        let editItem = null;
        if(editItemString) editItem = JSON.parse(decodeURIComponent(editItemString));

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        
        // Ambil Data Akun
        const accounts = await getDataOnce('accounts');
        
        let activeTab = 'riwayat'; 

        const renderContent = async () => {
            
            // === KONDISI 1: INPUT DATA BARU ===
            if (!editItem) {
                let defaultType = viewState.pendanaanType || 'hutang';
                
                modal.innerHTML = `
                    <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up relative h-[90vh] sm:h-auto overflow-y-auto">
                        <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                        <button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><i class="ph-bold ph-x text-xl"></i></button>
                        <h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white text-center">Catat Pendanaan</h3>
                        
                        <form id="form-new-debt" class="space-y-4">
                            <div class="grid grid-cols-3 gap-2 mb-2">
                                <label class="cursor-pointer"><input type="radio" name="type" value="hutang" ${defaultType==='hutang'?'checked':''} class="peer sr-only"><div class="py-3 text-center rounded-xl border-2 border-transparent bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 peer-checked:bg-red-50 dark:peer-checked:bg-red-900/30 peer-checked:border-red-500 peer-checked:text-red-600 font-bold transition">Berhutang</div></label>
                                <label class="cursor-pointer"><input type="radio" name="type" value="piutang" ${defaultType==='piutang'?'checked':''} class="peer sr-only"><div class="py-3 text-center rounded-xl border-2 border-transparent bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 peer-checked:bg-green-50 dark:peer-checked:bg-green-900/30 peer-checked:border-green-500 peer-checked:text-green-600 font-bold transition">Piutang</div></label>
                                <label class="cursor-pointer"><input type="radio" name="type" value="titipan" ${defaultType==='titipan'?'checked':''} class="peer sr-only"><div class="py-3 text-center rounded-xl border-2 border-transparent bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 peer-checked:bg-purple-50 dark:peer-checked:bg-purple-900/30 peer-checked:border-purple-500 peer-checked:text-purple-600 font-bold transition">Titipan</div></label>
                            </div>
                            
                            <div><label class="text-[10px] font-bold text-gray-500 uppercase">Nama Pihak / Penitip</label><input type="text" name="person" placeholder="Nama orang..." class="w-full p-3 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white outline-none font-bold" required></div>
                            
                            <div><label class="text-[10px] font-bold text-gray-500 uppercase">Total Nominal</label><input type="number" name="amount" placeholder="0" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white outline-none font-bold text-lg" required></div>
                            
                            <div><label class="text-[10px] font-bold text-gray-500 uppercase">Masuk ke Akun</label>
                            <select name="accountId" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none">
                                ${accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                            </select></div>

                            <div class="grid grid-cols-2 gap-3">
                                <div><label class="text-[10px] font-bold text-gray-500 uppercase">Tanggal</label><input type="date" name="startDate" value="${new Date().toISOString().split('T')[0]}" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white text-sm"></div>
                                <div><label class="text-[10px] font-bold text-gray-500 uppercase">Tempo (Opsional)</label><input type="date" name="dueDate" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white text-sm"></div>
                            </div>
                            
                            <div><label class="text-[10px] font-bold text-gray-500 uppercase">Catatan</label><input type="text" name="note" placeholder="Keterangan..." class="w-full p-3 rounded-xl border bg-white dark:bg-gray-900 dark:border-gray-600 dark:text-white text-sm"></div>
                            
                            <button type="submit" class="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold shadow-lg mt-2">Simpan Data</button>
                        </form>
                    </div>`;
                
                document.getElementById('form-new-debt').onsubmit = async (e) => {
                    e.preventDefault();
                    await handleSaveNew(e.target, accounts);
                };
                return;
            }

            // === KONDISI 2: MODE DETAIL / PENGELOLAAN ===
            
            // Hitung Data Realtime
            const totalHutang = parseInt(editItem.totalAmount || editItem.amount);
            const totalDibayar = parseInt(editItem.paidAmount || 0); // Di konteks titipan, ini = Total Belanja
            const sisa = totalHutang - totalDibayar;
            const percent = Math.min((totalDibayar / totalHutang) * 100, 100);

            // Teks Dinamis
            const isTitipan = editItem.type === 'titipan';
            const labelBayar = isTitipan ? 'Total Belanja' : 'Terbayar';
            const labelSisa = isTitipan ? 'Sisa Uang Titipan' : 'Sisa Tagihan';
            const labelForm = isTitipan ? 'Catat Belanjaan' : 'Input Pembayaran / Cicilan';
            const themeColor = isTitipan ? 'text-purple-600 bg-purple-100' : (editItem.type==='hutang'?'text-red-600 bg-red-100':'text-green-600 bg-green-100');
            const progressColor = isTitipan ? 'bg-purple-500' : (editItem.type==='hutang'?'bg-red-500':'bg-green-500');

            // Ambil Riwayat
            const allTrx = await getDataOnce('transactions');
            const history = allTrx.filter(t => 
                t.category === 'Pendanaan' && 
                t.note.includes(editItem.person)
            ).sort((a,b) => new Date(b.date) - new Date(a.date));

            modal.innerHTML = `
                <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-0 shadow-2xl animate-slide-up relative h-[90vh] sm:h-auto flex flex-col overflow-hidden">
                    
                    <div class="p-6 pb-0 bg-white dark:bg-gray-800 z-10 border-b border-gray-100 dark:border-gray-700">
                        <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
                        <button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><i class="ph-bold ph-x text-xl"></i></button>
                        
                        <div class="text-center mb-4">
                            <h3 class="text-xl font-bold text-gray-800 dark:text-white capitalize">${editItem.person}</h3>
                            <span class="text-[10px] font-bold px-2 py-1 rounded-md ${themeColor} uppercase tracking-wide">${isTitipan ? 'Pengelolaan Dana' : editItem.type}</span>
                        </div>

                        <div class="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-600 mb-4">
                            <div class="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                                <span>${labelBayar}: <b>${formatRupiah(totalDibayar)}</b></span>
                                <span>Awal: ${formatRupiah(totalHutang)}</span>
                            </div>
                            <div class="w-full bg-gray-200 dark:bg-gray-600 h-2.5 rounded-full overflow-hidden mb-2">
                                <div class="${progressColor} h-full rounded-full transition-all" style="width: ${percent}%"></div>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-xs font-bold text-gray-400">${labelSisa}</span>
                                <span class="text-xl font-black ${isTitipan ? 'text-purple-600' : (editItem.type==='hutang'?'text-red-600':'text-green-600')}">${formatRupiah(sisa)}</span>
                            </div>
                        </div>

                        <div class="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4">
                            <button id="tab-riwayat" class="flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'riwayat' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
                                ${isTitipan ? 'Kelola & Belanja' : 'Bayar & Riwayat'}
                            </button>
                            <button id="tab-edit" class="flex-1 py-2 text-xs font-bold rounded-lg transition ${activeTab === 'edit' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
                                Edit Data
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-6 pt-4 bg-white dark:bg-gray-800">
                        
                        <div id="content-riwayat" class="${activeTab === 'riwayat' ? '' : 'hidden'} space-y-6">
                            
                            <form id="form-cicilan" class="${isTitipan ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-100' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100'} p-4 rounded-2xl border space-y-3">
                                <h4 class="text-[10px] font-bold ${isTitipan ? 'text-purple-600' : 'text-blue-600'} uppercase flex items-center gap-2">
                                    <i class="ph-bold ${isTitipan ? 'ph-shopping-cart' : 'ph-plus-circle'}"></i> ${labelForm}
                                </h4>
                                
                                <div class="relative">
                                    <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                    <input type="number" name="amount" placeholder="0" class="w-full pl-10 pr-4 py-3 rounded-xl border-none bg-white dark:bg-gray-800 dark:text-white font-bold outline-none shadow-sm" required>
                                </div>

                                <div class="grid grid-cols-2 gap-2">
                                    <select name="accountId" class="w-full p-2.5 rounded-xl border-none bg-white dark:bg-gray-800 dark:text-white text-xs outline-none shadow-sm">
                                        ${accounts.map(a => `<option value="${a.id}">${a.name}</option>`).join('')}
                                    </select>
                                    <input type="date" name="date" class="w-full p-2.5 rounded-xl border-none bg-white dark:bg-gray-800 dark:text-white text-xs shadow-sm" value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                                
                                ${isTitipan ? `<input type="text" name="itemNote" placeholder="Beli apa? (Opsional)" class="w-full p-2.5 rounded-xl border-none bg-white dark:bg-gray-800 dark:text-white text-xs shadow-sm">` : ''}

                                <button type="submit" class="w-full py-3 ${isTitipan ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-xl font-bold text-xs shadow-lg transition">
                                    ${isTitipan ? 'Simpan Pengeluaran' : 'Simpan Pembayaran'}
                                </button>
                            </form>

                            <div>
                                <h4 class="text-xs font-bold text-gray-400 mb-3 ml-1 uppercase">${isTitipan ? 'Rincian Belanja' : 'Riwayat Transaksi'}</h4>
                                <div class="space-y-3 pl-2 border-l-2 border-gray-100 dark:border-gray-700">
                                    ${history.length === 0 ? '<p class="text-xs text-gray-400 pl-4 py-2">Belum ada data.</p>' : ''}
                                    ${history.map(h => {
                                        const isPayment = h.categoryName.includes('Bayar') || h.categoryName.includes('Terima') || h.categoryName.includes('Belanja');
                                        const dateStr = new Date(h.date).toLocaleDateString('id-ID', {day:'numeric', month:'short'});
                                        
                                        // Bersihkan note dari prefix sistem
                                        let noteDisplay = h.note.replace(`Cicilan: ${editItem.person}`, '').replace(`Belanja: ${editItem.person}`, '').trim();
                                        if(!noteDisplay) noteDisplay = "Pembayaran";

                                        return `
                                        <div class="relative pl-4 pb-2">
                                            <div class="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${isPayment ? (isTitipan ? 'bg-purple-500' : 'bg-green-500') : 'bg-gray-300'} border-2 border-white dark:border-gray-800"></div>
                                            <div class="flex justify-between items-start">
                                                <div>
                                                    <p class="text-xs font-bold text-gray-800 dark:text-white">${noteDisplay}</p>
                                                    <p class="text-[10px] text-gray-400">${dateStr} • ${h.accountName || '-'}</p>
                                                </div>
                                                <span class="text-xs font-bold ${isPayment ? (isTitipan ? 'text-purple-600' : 'text-green-600') : 'text-gray-500'}">
                                                    ${formatRupiah(h.amount)}
                                                </span>
                                            </div>
                                        </div>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>

                        <div id="content-edit" class="${activeTab === 'edit' ? '' : 'hidden'} space-y-5">
                            <form id="form-edit-data" class="space-y-4">
                                <div><label class="text-[10px] font-bold text-gray-500 uppercase">Nama Pihak</label><input type="text" name="person" value="${editItem.person}" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white font-bold" required></div>
                                <div><label class="text-[10px] font-bold text-gray-500 uppercase">Nominal Awal</label><input type="number" name="totalAmount" value="${editItem.totalAmount || editItem.amount}" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white font-bold"></div>
                                <div class="grid grid-cols-2 gap-3">
                                    <div><label class="text-[10px] font-bold text-gray-500 uppercase">Tgl Mulai</label><input type="date" name="startDate" value="${editItem.startDate}" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"></div>
                                    <div><label class="text-[10px] font-bold text-gray-500 uppercase">Tempo</label><input type="date" name="dueDate" value="${editItem.dueDate}" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"></div>
                                </div>
                                <div><label class="text-[10px] font-bold text-gray-500 uppercase">Catatan</label><input type="text" name="note" value="${editItem.note || ''}" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm"></div>
                                <div class="pt-4 flex gap-3">
                                    <button type="button" onclick="window.hapusItem('debts', '${editItem.id}')" class="flex-1 py-3 bg-red-50 text-red-600 dark:bg-red-900/20 rounded-xl font-bold text-sm hover:bg-red-100 transition"><i class="ph-bold ph-trash"></i> Hapus</button>
                                    <button type="submit" class="flex-[2] py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:opacity-90 transition">Simpan Perubahan</button>
                                </div>
                            </form>
                        </div>

                    </div>
                </div>
            `;

            document.getElementById('tab-riwayat').onclick = () => { activeTab = 'riwayat'; renderContent(); };
            document.getElementById('tab-edit').onclick = () => { activeTab = 'edit'; renderContent(); };

            const formCicilan = document.getElementById('form-cicilan');
            if(formCicilan) formCicilan.onsubmit = async (e) => { e.preventDefault(); await handlePayInstallment(e.target, editItem, accounts); };

            const formEdit = document.getElementById('form-edit-data');
            if(formEdit) formEdit.onsubmit = async (e) => { e.preventDefault(); await handleEditData(e.target, editItem); };
        };

        // --- LOGIKA SIMPAN & UPDATE ---
        
        const handleSaveNew = async (form, accounts) => {
            const btn = form.querySelector('button'); btn.innerHTML = 'Menyimpan...'; btn.disabled = true;
            try {
                const total = parseInt(form.amount.value);
                const accId = form.accountId.value;
                const accName = accounts.find(a => a.id === accId)?.name || 'Unknown';
                const type = form.type.value;

                const debtData = {
                    type: type, person: form.person.value,
                    totalAmount: total, amount: total, paidAmount: 0,
                    note: form.note.value, accountId: accId, accountName: accName,
                    startDate: form.startDate.value, dueDate: form.dueDate.value,
                    createdAt: new Date()
                };
                
                // Tentukan arah transaksi awal
                // Hutang: Uang Masuk | Piutang: Uang Keluar | Titipan: Uang Masuk (Kita terima uang orang)
                const trxType = (type === 'hutang' || type === 'titipan') ? 'pemasukan' : 'pengeluaran'; 
                
                let trxCatName = 'Terima Hutang';
                if(type === 'piutang') trxCatName = 'Beri Pinjaman';
                if(type === 'titipan') trxCatName = 'Terima Titipan Dana';

                await Promise.all([
                    addData('debts', debtData),
                    addData('transactions', {
                        date: debtData.startDate, amount: total, accountId: accId, accountName: accName,
                        type: trxType, category: 'Pendanaan', categoryName: trxCatName, icon: 'wallet',
                        note: `Pendanaan Baru: ${debtData.person}`
                    })
                ]);
                showToast("Berhasil dicatat!"); window.closeModal();
            } catch(e) { showToast("Gagal menyimpan", "error"); btn.innerHTML = 'Coba Lagi'; btn.disabled = false; }
        };

        const handlePayInstallment = async (form, item, accounts) => {
            const btn = form.querySelector('button'); btn.innerHTML = 'Memproses...'; btn.disabled = true;
            try {
                const amount = parseInt(form.amount.value);
                const accId = form.accountId.value;
                const accName = accounts.find(a => a.id === accId)?.name || 'Unknown';
                const itemNote = form.itemNote ? form.itemNote.value : ''; // Hanya untuk titipan
                
                // Logika Transaksi Balik (Pembayaran/Belanja)
                // Hutang: Bayar (Keluar) | Piutang: Terima (Masuk) | Titipan: Belanja (Keluar)
                const trxType = (item.type === 'hutang' || item.type === 'titipan') ? 'pengeluaran' : 'pemasukan';
                
                let trxCatName = 'Bayar Hutang';
                let notePrefix = 'Cicilan: ';
                
                if(item.type === 'piutang') { trxCatName = 'Terima Cicilan'; }
                if(item.type === 'titipan') { trxCatName = 'Belanja Titipan'; notePrefix = 'Belanja: '; }

                const finalNote = item.type === 'titipan' && itemNote ? `${notePrefix}${item.person} - ${itemNote}` : `${notePrefix}${item.person}`;

                await addData('transactions', {
                    date: form.date.value, amount: amount, accountId: accId, accountName: accName,
                    type: trxType, category: 'Pendanaan', categoryName: trxCatName, icon: 'shopping',
                    note: finalNote
                });

                await updateData('debts', item.id, { paidAmount: parseInt(item.paidAmount||0) + amount });
                showToast(item.type==='titipan' ? "Belanja dicatat!" : "Pembayaran berhasil!");
                editItem.paidAmount = parseInt(editItem.paidAmount||0) + amount; 
                renderContent(); 
            } catch(e) { showToast("Gagal memproses", "error"); btn.innerHTML = 'Coba Lagi'; btn.disabled = false; }
        };

        const handleEditData = async (form, item) => {
            const btn = form.querySelector('button[type="submit"]'); btn.innerHTML = 'Menyimpan...'; btn.disabled = true;
            try {
                await updateData('debts', item.id, {
                    person: form.person.value,
                    totalAmount: parseInt(form.totalAmount.value),
                    amount: parseInt(form.totalAmount.value),
                    startDate: form.startDate.value,
                    dueDate: form.dueDate.value,
                    note: form.note.value
                });
                showToast("Data diperbarui!"); window.closeModal();
            } catch(e) { showToast("Gagal update", "error"); btn.innerHTML = 'Simpan Perubahan'; btn.disabled = false; }
        };

        renderContent();
    };

    // --- FORM TRANSAKSI (SWAPPED TABS) ---
    window.renderTambahModal = async (editItemString = null) => {
        let editItem = null;
        if(editItemString) editItem = JSON.parse(decodeURIComponent(editItemString));

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');

        // Ambil Data Master
        const [categories, accounts] = await Promise.all([getDataOnce('categories'), getDataOnce('accounts')]);
        
        // Default State
        let currentType = editItem ? editItem.type : 'pengeluaran';

        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up relative h-[90vh] sm:h-auto overflow-y-auto">
                <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                <button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><i class="ph-bold ph-x text-xl"></i></button>
                <h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white text-center">${editItem ? 'Edit Transaksi' : 'Transaksi Baru'}</h3>
                
                <form id="form-transaksi" class="space-y-5">
                    <div class="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-2xl">
                        <button type="button" id="btn-type-pemasukan" class="py-3 rounded-xl text-sm font-bold transition ${currentType === 'pemasukan' ? 'bg-white dark:bg-gray-600 text-green-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
                            Pemasukan
                        </button>
                        <button type="button" id="btn-type-pengeluaran" class="py-3 rounded-xl text-sm font-bold transition ${currentType === 'pengeluaran' ? 'bg-white dark:bg-gray-600 text-red-500 shadow-sm' : 'text-gray-500 dark:text-gray-400'}">
                            Pengeluaran
                        </button>
                    </div>
                    <input type="hidden" name="type" id="input-type" value="${currentType}">

                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">Nominal</label>
                        <div class="relative">
                            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                            <input type="number" name="amount" value="${editItem ? editItem.amount : ''}" placeholder="0" class="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-2xl font-bold outline-none focus:border-blue-500 transition" required>
                        </div>
                    </div>

                    <div class="relative">
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">Kategori</label>
                        <input type="hidden" name="categoryId" id="input-cat-id" required>
                        <button type="button" id="trigger-cat" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 flex items-center justify-between transition hover:border-blue-400">
                            <div class="flex items-center gap-3" id="display-cat">
                                <span class="text-gray-400 text-sm">Pilih Kategori...</span>
                            </div>
                            <i class="ph-bold ph-caret-down text-gray-400"></i>
                        </button>
                        <div id="list-cat" class="hidden absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1"></div>
                    </div>

                    <div class="relative">
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">Dompet / Rekening</label>
                        <input type="hidden" name="accountId" id="input-acc-id" required>
                        <button type="button" id="trigger-acc" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 flex items-center justify-between transition hover:border-blue-400">
                            <div class="flex items-center gap-3" id="display-acc">
                                <span class="text-gray-400 text-sm">Pilih Akun...</span>
                            </div>
                            <i class="ph-bold ph-caret-down text-gray-400"></i>
                        </button>
                        <div id="list-acc" class="hidden absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto p-1"></div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">Tanggal</label>
                            <input type="date" name="date" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" required>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">Catatan</label>
                            <input type="text" name="note" value="${editItem ? (editItem.note||'') : ''}" placeholder="Opsional..." class="w-full p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none">
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4 transition flex items-center justify-center gap-2">
                        ${editItem ? 'Simpan Perubahan' : 'Simpan Transaksi'} <i class="ph-bold ph-check"></i>
                    </button>
                </form>
            </div>
        `;

        // --- LOGIC UI ---
        
        // 1. Switcher Type Logic
        const btnMasuk = document.getElementById('btn-type-pemasukan');
        const btnKeluar = document.getElementById('btn-type-pengeluaran');
        const inputType = document.getElementById('input-type');

        const setType = (type) => {
            currentType = type;
            inputType.value = type;
            if(type === 'pemasukan') {
                btnMasuk.className = "py-3 rounded-xl text-sm font-bold transition bg-white dark:bg-gray-600 text-green-600 shadow-sm";
                btnKeluar.className = "py-3 rounded-xl text-sm font-bold transition text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800";
            } else {
                btnKeluar.className = "py-3 rounded-xl text-sm font-bold transition bg-white dark:bg-gray-600 text-red-500 shadow-sm";
                btnMasuk.className = "py-3 rounded-xl text-sm font-bold transition text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800";
            }
            renderCategoryOptions(type); // Refresh kategori sesuai tipe
        };

        btnMasuk.onclick = () => setType('pemasukan');
        btnKeluar.onclick = () => setType('pengeluaran');

        // 2. Custom Dropdown Kategori
        const catList = document.getElementById('list-cat');
        const catTrigger = document.getElementById('trigger-cat');
        const catDisplay = document.getElementById('display-cat');
        const catInput = document.getElementById('input-cat-id');

        const renderCategoryOptions = (type) => {
            catList.innerHTML = '';
            const filtered = categories.filter(c => c.type === type);
            
            if(filtered.length === 0) {
                catList.innerHTML = `<div class="p-3 text-center text-xs text-gray-400">Belum ada kategori ${type}. <br><a href="#kategori" onclick="window.closeModal()" class="text-blue-500 font-bold">Buat dulu</a></div>`;
                return;
            }

            filtered.forEach(c => {
                const el = document.createElement('div');
                el.className = "flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition";
                // Gunakan icon dari mapping global Icons
                const iconHtml = Icons[c.icon] || Icons['default']; 
                el.innerHTML = `<div class="w-8 h-8 p-1.5 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-600">${iconHtml}</div><span class="text-sm font-bold text-gray-800 dark:text-white">${c.name}</span>`;
                el.onclick = () => {
                    catInput.value = c.id;
                    catInput.setAttribute('data-name', c.name);
                    catInput.setAttribute('data-icon', c.icon);
                    catDisplay.innerHTML = `<div class="w-8 h-8 p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">${iconHtml}</div><span class="text-sm font-bold text-gray-800 dark:text-white">${c.name}</span>`;
                    catList.classList.add('hidden');
                };
                catList.appendChild(el);
            });
        };

        catTrigger.onclick = () => {
            catList.classList.toggle('hidden');
            document.getElementById('list-acc').classList.add('hidden'); // Tutup dropdown sebelah
        };

        // 3. Custom Dropdown Akun
        const accList = document.getElementById('list-acc');
        const accTrigger = document.getElementById('trigger-acc');
        const accDisplay = document.getElementById('display-acc');
        const accInput = document.getElementById('input-acc-id');

        accounts.forEach(a => {
            const el = document.createElement('div');
            el.className = "flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg cursor-pointer transition";
            const iconHtml = Icons[a.icon] || Icons['wallet'];
            el.innerHTML = `<div class="w-8 h-8 p-1.5 bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center text-gray-600">${iconHtml}</div><div><p class="text-sm font-bold text-gray-800 dark:text-white">${a.name}</p><p class="text-[10px] text-gray-500">${formatRupiah(a.initialBalance)}</p></div>`;
            el.onclick = () => {
                accInput.value = a.id;
                accInput.setAttribute('data-name', a.name);
                accDisplay.innerHTML = `<div class="w-8 h-8 p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg flex items-center justify-center">${iconHtml}</div><span class="text-sm font-bold text-gray-800 dark:text-white">${a.name}</span>`;
                accList.classList.add('hidden');
            };
            accList.appendChild(el);
        });

        accTrigger.onclick = () => {
            accList.classList.toggle('hidden');
            document.getElementById('list-cat').classList.add('hidden');
        };

        // 4. Initial Set & Pre-fill (Edit Mode)
        renderCategoryOptions(currentType);
        
        // Set Tanggal
        modal.querySelector('[name="date"]').value = editItem ? editItem.date : new Date().toISOString().split('T')[0];

        // Pre-select Kategori & Akun jika Edit
        if (editItem) {
            // Cari Kategori
            const foundCat = categories.find(c => c.id === editItem.categoryId);
            if (foundCat) {
                catInput.value = foundCat.id;
                catInput.setAttribute('data-name', foundCat.name);
                catInput.setAttribute('data-icon', foundCat.icon);
                const iconHtml = Icons[foundCat.icon] || Icons['default'];
                catDisplay.innerHTML = `<div class="w-8 h-8 p-1.5 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">${iconHtml}</div><span class="text-sm font-bold text-gray-800 dark:text-white">${foundCat.name}</span>`;
            }
            // Cari Akun
            const foundAcc = accounts.find(a => a.id === editItem.accountId);
            if (foundAcc) {
                accInput.value = foundAcc.id;
                accInput.setAttribute('data-name', foundAcc.name);
                const iconHtml = Icons[foundAcc.icon] || Icons['wallet'];
                accDisplay.innerHTML = `<div class="w-8 h-8 p-1.5 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">${iconHtml}</div><span class="text-sm font-bold text-gray-800 dark:text-white">${foundAcc.name}</span>`;
            }
        }

        // --- SUBMIT ---
        document.getElementById('form-transaksi').onsubmit = async (e) => { 
            e.preventDefault(); 
            const btn = e.target.querySelector('button[type="submit"]'); 
            
            if(!catInput.value || !accInput.value) { showToast("Lengkapi data kategori & akun!", "error"); return; }

            const catName = catInput.getAttribute('data-name');
            const catIcon = catInput.getAttribute('data-icon');
            const accName = accInput.getAttribute('data-name');
            
            const data = { 
                amount: parseInt(e.target.amount.value), 
                type: e.target.type.value, 
                categoryId: catInput.value, 
                categoryName: catName,
                icon: catIcon,
                accountId: accInput.value, 
                accountName: accName, 
                date: e.target.date.value, 
                note: e.target.note.value 
            };
            
            btn.innerHTML = 'Menyimpan...'; btn.disabled = true; 

            let success = false;
            if(editItem) success = await updateData('transactions', editItem.id, data);
            else success = await addData('transactions', data);

            if(success) { 
                showToast(editItem ? "Transaksi diperbarui" : "Transaksi disimpan"); 
                window.closeModal(); 
            } else { 
                showToast("Gagal menyimpan data", "error"); 
                btn.innerHTML = 'Coba Lagi'; btn.disabled = false; 
            } 
        };
    };

    // --- [BARU & FIX] FORM TRANSFER ---
    window.renderTransferModal = async () => {
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        
        const accounts = await getDataOnce('accounts');

        modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up relative h-[90vh] sm:h-auto overflow-y-auto">
            <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
            <button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><i class="ph-bold ph-x text-xl"></i></button>
            <h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white text-center">Transfer Saldo</h3>
            
            <form id="form-transfer" class="space-y-6">
                <div class="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl relative">
                    <div class="absolute left-8 top-10 bottom-10 w-0.5 bg-gray-300 dark:bg-gray-600 border-l border-dashed"></div>
                    
                    <div class="relative mb-6">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-8">Dari Rekening</label>
                        <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center z-10"><i class="ph-bold ph-arrow-up"></i></div>
                            <select name="fromAccountId" id="from-acc" class="flex-1 p-3 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm outline-none shadow-sm">
                                <option value="">Pilih Sumber...</option>
                                ${accounts.map(a => `<option value="${a.id}" data-name="${a.name}">${a.name} (${formatRupiah(a.initialBalance)})</option>`).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="relative">
                        <label class="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-8">Ke Rekening</label>
                        <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full bg-green-100 text-green-500 flex items-center justify-center z-10"><i class="ph-bold ph-arrow-down"></i></div>
                            <select name="toAccountId" id="to-acc" class="flex-1 p-3 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm outline-none shadow-sm">
                                <option value="">Pilih Tujuan...</option>
                                ${accounts.map(a => `<option value="${a.id}" data-name="${a.name}">${a.name} (${formatRupiah(a.initialBalance)})</option>`).join('')}
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">Jumlah Transfer</label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                        <input type="number" name="amount" required class="w-full pl-10 pr-4 py-4 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white text-2xl font-bold outline-none focus:border-indigo-500 transition" placeholder="0">
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">Biaya Admin</label>
                        <input type="number" name="adminFee" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" placeholder="0">
                    </div>
                    <div>
                        <label class="block text-[10px] font-bold text-gray-500 uppercase mb-2">Tanggal</label>
                        <input type="date" name="date" required class="w-full p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>

                <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg mt-4 transition flex items-center justify-center gap-2">
                    Proses Transfer <i class="ph-bold ph-arrows-left-right"></i>
                </button>
            </form>
        </div>`;

        document.getElementById('form-transfer').onsubmit = async (e) => { 
            e.preventDefault(); 
            const btn = e.target.querySelector('button[type="submit"]'); 
            const fromSel = e.target.fromAccountId; 
            const toSel = e.target.toAccountId; 
            
            if (fromSel.value === "" || toSel.value === "") { alert("Pilih kedua rekening!"); return; }
            if (fromSel.value === toSel.value) { alert("Rekening asal dan tujuan tidak boleh sama!"); return; } 
            
            const data = { 
                fromAccountId: fromSel.value, 
                fromAccountName: fromSel.options[fromSel.selectedIndex].getAttribute('data-name'), 
                toAccountId: toSel.value, 
                toAccountName: toSel.options[toSel.selectedIndex].getAttribute('data-name'), 
                amount: parseInt(e.target.amount.value), 
                adminFee: parseInt(e.target.adminFee.value) || 0, 
                date: e.target.date.value 
            }; 
            
            btn.innerHTML = 'Memproses...'; btn.disabled = true; 
            
            if (await addTransfer(data)) { 
                showToast("Transfer Berhasil"); 
                window.closeModal(); 
            } else { 
                showToast("Transfer Gagal", "error"); 
                btn.innerHTML = 'Proses Transfer'; btn.disabled = false; 
            } 
        };
    };

    // --- FORM TRANSFER ---
    window.renderTransferModal = async () => {
        const modal = document.getElementById('modal-container');
        modal.innerHTML = `<div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up relative h-[90vh] sm:h-auto overflow-y-auto"><div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div><button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white text-center">Transfer Saldo</h3><form id="form-transfer" class="space-y-4"><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">DARI REKENING</label><div class="relative"><select name="fromAccountId" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none"><option value="">Pilih Rekening Asal</option></select><div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">KE REKENING</label><div class="relative"><select name="toAccountId" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none"><option value="">Pilih Rekening Tujuan</option></select><div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">JUMLAH</label><div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span><input type="number" name="amount" required class="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white text-xl font-bold outline-none" placeholder="0"></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">BIAYA ADMIN (OPSIONAL)</label><div class="relative"><span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span><input type="number" name="adminFee" class="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white text-sm font-bold outline-none" placeholder="0"></div></div><div><label class="block text-xs font-bold text-gray-500 mb-2 uppercase">TANGGAL</label><input type="date" name="date" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none"></div><button type="submit" class="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition shadow-lg mt-4">Proses Transfer</button></form></div>`;
        const accounts = await getDataOnce('accounts');
        const fromSelect = modal.querySelector('[name="fromAccountId"]'); const toSelect = modal.querySelector('[name="toAccountId"]');
        const populate = (sel) => { accounts.forEach(a => { const opt = document.createElement('option'); opt.value = a.id; opt.text = `${a.name} (${a.holder || '-'})`; opt.setAttribute('data-name', a.name); sel.appendChild(opt); }); };
        populate(fromSelect); populate(toSelect); modal.querySelector('[name="date"]').value = new Date().toISOString().split('T')[0];
        document.getElementById('form-transfer').onsubmit = async (e) => { e.preventDefault(); const btn = e.target.querySelector('button[type="submit"]'); const fromSel = e.target.fromAccountId; const toSel = e.target.toAccountId; if (fromSel.value === toSel.value) { alert("Rekening asal dan tujuan tidak boleh sama!"); return; } const data = { fromAccountId: fromSel.value, fromAccountName: fromSel.options[fromSel.selectedIndex].getAttribute('data-name'), toAccountId: toSel.value, toAccountName: toSel.options[toSel.selectedIndex].getAttribute('data-name'), amount: parseInt(e.target.amount.value), adminFee: parseInt(e.target.adminFee.value) || 0, date: e.target.date.value }; btn.innerHTML = 'Memproses...'; btn.disabled = true; if (await addTransfer(data)) { showToast("Transfer Berhasil"); window.closeModal(); } else { showToast("Transfer Gagal", "error"); btn.innerHTML = 'Proses Transfer'; btn.disabled = false; } };
    }

    // --- EXPORT XLSX ---
    window.renderExportModal = () => { 
        const modal = document.getElementById('modal-container'); 
        modal.classList.remove('hidden'); 
        modal.innerHTML = `<div class="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-2xl p-6 m-4 animate-slide-up shadow-2xl relative"><button onclick="window.closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Ekspor Data Excel</h3><form id="form-export" class="space-y-4"><div><label class="block text-xs font-bold text-gray-500 mb-1">DARI TANGGAL</label><input type="date" name="startDate" required class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"></div><div><label class="block text-xs font-bold text-gray-500 mb-1">SAMPAI TANGGAL</label><input type="date" name="endDate" required class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white"></div><button type="submit" class="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 shadow-lg flex items-center justify-center gap-2"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>Unduh .xlsx</button></form></div>`; 
        const today = new Date(); const firstDay = new Date(today.getFullYear(), today.getMonth(), 1); 
        modal.querySelector('[name="startDate"]').value = firstDay.toISOString().split('T')[0]; 
        modal.querySelector('[name="endDate"]').value = today.toISOString().split('T')[0]; 
        
        document.getElementById('form-export').onsubmit = async (e) => { 
            e.preventDefault(); 
            const btn = e.target.querySelector('button'); 
            const start = e.target.startDate.value; 
            const end = e.target.endDate.value; 
            btn.innerHTML = 'Memproses...'; btn.disabled = true; 
            
            const data = await getTransactionsByDateRange(start, end); 
            if (data.length === 0) { showToast("Tidak ada data", "error"); btn.innerHTML = 'Unduh .xlsx'; btn.disabled = false; return; } 
            
            const wsData = data.map(row => ({
                Tanggal: row.date,
                Tipe: row.type,
                Kategori: row.categoryName || row.category,
                Akun: row.accountName || '-',
                Jumlah: parseInt(row.amount),
                Catatan: row.note || ''
            }));

            const ws = XLSX.utils.json_to_sheet(wsData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Laporan Transaksi");
            XLSX.writeFile(wb, `Laporan_Transaksi_${start}_sd_${end}.xlsx`);
            window.closeModal(); 
        }; 
    };

    // --- DETAIL TRANSAKSI ---
    window.openDetailTransaction = (encodedData) => {
        const item = JSON.parse(decodeURIComponent(encodedData));
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        const itemString = encodeURIComponent(JSON.stringify(item));

        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-3xl p-0 overflow-hidden m-4 animate-scale-up shadow-2xl relative">
                <div class="relative bg-gradient-to-br ${item.type === 'pemasukan' ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600'} p-6 pb-12 text-white">
                    <button onclick="window.closeModal()" class="absolute top-4 right-4 text-white/80 hover:text-white"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    <p class="text-center text-white/80 text-sm font-medium tracking-wide uppercase mb-1">Total Transaksi</p>
                    <h3 class="text-3xl font-extrabold text-center tracking-tight">${formatRupiah(item.amount)}</h3>
                    <div class="absolute -bottom-6 left-1/2 transform -translate-x-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center shadow-md border-4 border-white dark:border-gray-800">
                         <svg class="w-6 h-6 ${item.type === 'pemasukan' ? 'text-green-500' : 'text-red-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${item.type === 'pemasukan' ? 'M7 11l5-5m0 0l5 5m-5-5v12' : 'M17 13l-5 5m0 0l-5-5m5 5V6'}"></path></svg>
                    </div>
                </div>
                <div class="pt-10 px-6 pb-6">
                    <div class="text-center mb-6">
                        <h4 class="text-xl font-bold text-gray-800 dark:text-white">${item.categoryName || item.category}</h4>
                        <p class="text-gray-400 text-sm">${new Date(item.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div class="space-y-4 mb-8">
                        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg></div>
                                <span class="text-sm text-gray-500 dark:text-gray-400">Akun / Wallet</span>
                            </div>
                            <span class="font-bold text-gray-800 dark:text-white text-sm">${item.accountName || '-'}</span>
                        </div>
                        <div class="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                            <span class="text-xs text-gray-400 uppercase font-bold block mb-1">Catatan</span>
                            <p class="text-gray-700 dark:text-gray-300 text-sm italic">"${item.note || 'Tidak ada catatan'}"</p>
                        </div>
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <button onclick="window.renderTambahModal('${itemString}')" class="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>Edit</button>
                        <button onclick="window.hapusItem('transactions', '${item.id}')" class="flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>Hapus</button>
                    </div>
                </div>
            </div>
        `;
    };
}

// --- PAGE RENDERERS ---
// --- RENDER BERANDA (LIVE UPDATE ICONS) ---
export function renderBeranda(container, unsub) {
    let allTransactions = [];
    let allCategories = []; // 1. Siapkan wadah untuk data Kategori terbaru

    const updateHeader = () => {
        let label = '';
        if(viewState.filter === 'bulanan') label = viewState.date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        else label = viewState.date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
        
        container.innerHTML = `
            <div class="px-4 py-4 min-h-screen">
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
                <div id="transaction-list" class="space-y-6 pb-20"></div>
            </div>
        `;

        document.getElementById('toggle-filter').onclick = () => { viewState.filter = viewState.filter === 'bulanan' ? 'harian' : 'bulanan'; refreshDataDisplay(); updateHeader(); };
        const changeDate = (n) => { if(viewState.filter === 'bulanan') viewState.date.setMonth(viewState.date.getMonth() + n); else viewState.date.setDate(viewState.date.getDate() + n); refreshDataDisplay(); updateHeader(); }
        document.getElementById('prev-date').onclick = () => changeDate(-1);
        document.getElementById('next-date').onclick = () => changeDate(1);
        refreshDataDisplay();
    };

    const refreshDataDisplay = () => {
        const listContainer = document.getElementById('transaction-list');
        if(!listContainer) return;

        const incEl = document.getElementById('total-income');
        const expEl = document.getElementById('total-expense');
        const balEl = document.getElementById('total-balance');

        const filtered = allTransactions.filter(t => {
            const d = new Date(t.date);
            const v = viewState.date;
            if(viewState.filter === 'bulanan') return d.getMonth() === v.getMonth() && d.getFullYear() === v.getFullYear();
            else return d.getDate() === v.getDate() && d.getMonth() === v.getMonth() && d.getFullYear() === v.getFullYear();
        });

        let inc = 0, exp = 0;
        filtered.forEach(t => {
            if (t.categoryName === 'Transfer Masuk' || t.categoryName === 'Transfer Keluar') return;
            const amt = parseInt(t.amount);
            if(t.type === 'pemasukan') {
                inc += amt;
            } else {
                exp += amt;
            }
        });
        
        if(incEl) incEl.innerText = formatRupiah(inc);
        if(expEl) expEl.innerText = formatRupiah(exp);
        if(balEl) balEl.innerText = formatRupiah(inc - exp);

        listContainer.innerHTML = '';
        if (filtered.length === 0) { listContainer.innerHTML = `<div class="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600"><p class="text-sm font-medium">Tidak ada transaksi pada periode ini</p></div>`; return; }

        const groups = {};
        filtered.forEach(trx => {
            const dateKey = trx.date;
            if (!groups[dateKey]) groups[dateKey] = { date: dateKey, total: 0, items: [] };
            const amountVal = trx.type === 'pengeluaran' ? -parseInt(trx.amount) : parseInt(trx.amount);
            groups[dateKey].total += amountVal;
            groups[dateKey].items.push(trx);
        });
        const groupedData = Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));

        groupedData.forEach(group => {
            const dateObj = new Date(group.date);
            const dateNum = dateObj.getDate().toString().padStart(2, '0');
            const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
            
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
                            const itemData = encodeURIComponent(JSON.stringify(item));
                            
                            // --- LOGIKA UTAMA (LIVE SYNC) ---
                            // 1. Coba cari kategori asli di daftar kategori terbaru berdasarkan ID
                            const liveCategory = allCategories.find(c => c.id === item.categoryId);
                            
                            // 2. Jika kategori ditemukan, PAKAI ICON TERBARU DARI KATEGORI ITU
                            // 3. Jika tidak (misal transfer), baru pakai icon yang tersimpan di transaksi
                            // 4. Jika semua gagal, pakai default
                            const iconKey = liveCategory ? liveCategory.icon : (item.icon || 'default');
                            
                            const svgIcon = Icons[iconKey] || Icons['default']; 
                            
                            return `
                            <div onclick="window.openDetailTransaction('${itemData}')" class="flex items-center justify-between bg-white dark:bg-gray-800 p-3.5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group cursor-pointer hover:bg-gray-50 active:scale-[0.98] transition">
                                <div class="absolute left-0 top-0 bottom-0 w-1.5 ${item.type === 'pemasukan' ? 'bg-green-500' : 'bg-red-500'}"></div>
                                <div class="flex items-center gap-3 pl-2">
                                    <div class="w-12 h-12 p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600 flex items-center justify-center">
                                        ${svgIcon}
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

    updateHeader();

    // 2. SUBSCRIBE DATA (TRANSAKSI & KATEGORI)
    // Kita subscribe keduanya agar setiap ada perubahan di salah satu, tampilan refresh.
    unsub.transactions = subscribeToTransactions((result) => { 
        allTransactions = result.allItems; 
        refreshDataDisplay(); 
    });

    // Ini kunci agar "Realtime Update" berjalan saat Anda edit kategori
    unsub.categoriesBeranda = subscribeToData('categories', (items) => {
        allCategories = items;
        refreshDataDisplay();
    });
}

// --- RENDER PENDANAAN (HIERARKI BARU: DASHBOARD -> DETAIL) ---
export function renderPendanaan(container, unsub) {
    let allDebts = [];

    // Helper: Kalkulasi Status & Warna
    const calculateStatus = (item) => {
        const total = parseInt(item.totalAmount || item.amount);
        const paid = parseInt(item.paidAmount || 0);
        const isPaid = paid >= total;
        
        if (isPaid) return { 
            label: 'Selesai', 
            textColor: 'text-green-600 dark:text-green-400', 
            badgeColor: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
            barColor: 'bg-green-500' 
        };
        
        // Logika Jatuh Tempo (Hanya untuk Hutang/Piutang)
        if (item.type !== 'titipan') {
            const today = new Date(); today.setHours(0,0,0,0);
            const dueDate = item.dueDate ? new Date(item.dueDate) : null;
            if (dueDate && today > dueDate) {
                return { 
                    label: 'Jatuh Tempo', 
                    textColor: 'text-red-600 dark:text-red-400', 
                    badgeColor: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
                    barColor: 'bg-red-500', isOverdue: true
                };
            }
        }
        
        return { 
            label: item.type === 'titipan' ? 'Sedang Berjalan' : 'Belum Lunas', 
            textColor: 'text-gray-500 dark:text-gray-400', 
            badgeColor: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300',
            barColor: item.type === 'titipan' ? 'bg-purple-500' : 'bg-gray-300'
        };
    };

    // --- RENDER DASHBOARD (3 KARTU) ---
    const renderDashboard = () => {
        let hTotal = 0, hCount = 0; // Hutang
        let pTotal = 0, pCount = 0; // Piutang
        let tTotal = 0, tCount = 0; // Titipan (NEW)

        allDebts.forEach(d => {
            const total = parseInt(d.totalAmount || d.amount);
            const paid = parseInt(d.paidAmount || 0);
            const sisa = total - paid;
            
            if (sisa > 0) {
                if(d.type === 'hutang') { hTotal += sisa; hCount++; }
                else if(d.type === 'piutang') { pTotal += sisa; pCount++; }
                else if(d.type === 'titipan') { tTotal += sisa; tCount++; }
            }
        });

        container.innerHTML = `
            <div class="p-4 min-h-screen pb-24">
                <h2 class="text-gray-500 dark:text-gray-400 text-sm mb-4 font-bold uppercase">Dashboard Keuangan</h2>
                
                <div class="grid grid-cols-1 gap-4">
                    
                    <div id="card-hutang" class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98]">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center"><i class="ph-fill ph-arrow-down-left text-2xl"></i></div>
                            <div><h4 class="font-bold text-gray-800 dark:text-white text-lg">Hutang Saya</h4><p class="text-xs text-gray-500">Kewajiban bayar</p></div>
                        </div>
                        <div class="flex justify-between items-end border-t border-gray-50 dark:border-gray-700 pt-3">
                            <span class="text-[10px] font-bold bg-red-50 dark:bg-red-900/20 text-red-600 px-2 py-1 rounded-lg">${hCount} Transaksi</span>
                            <div class="text-right"><p class="text-[10px] text-gray-400">Sisa Tagihan</p><p class="font-black text-xl text-red-600">${formatRupiah(hTotal)}</p></div>
                        </div>
                    </div>

                    <div id="card-piutang" class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98]">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center"><i class="ph-fill ph-arrow-up-right text-2xl"></i></div>
                            <div><h4 class="font-bold text-gray-800 dark:text-white text-lg">Piutang</h4><p class="text-xs text-gray-500">Milik saya di orang lain</p></div>
                        </div>
                        <div class="flex justify-between items-end border-t border-gray-50 dark:border-gray-700 pt-3">
                            <span class="text-[10px] font-bold bg-green-50 dark:bg-green-900/20 text-green-600 px-2 py-1 rounded-lg">${pCount} Transaksi</span>
                            <div class="text-right"><p class="text-[10px] text-gray-400">Belum Lunas</p><p class="font-black text-xl text-green-600">${formatRupiah(pTotal)}</p></div>
                        </div>
                    </div>

                    <div id="card-titipan" class="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-[0.98]">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center"><i class="ph-fill ph-hand-coins text-2xl"></i></div>
                            <div><h4 class="font-bold text-gray-800 dark:text-white text-lg">Pengelolaan Dana</h4><p class="text-xs text-gray-500">Titipan & Belanjaan</p></div>
                        </div>
                        <div class="flex justify-between items-end border-t border-gray-50 dark:border-gray-700 pt-3">
                            <span class="text-[10px] font-bold bg-purple-50 dark:bg-purple-900/20 text-purple-600 px-2 py-1 rounded-lg">${tCount} Aktif</span>
                            <div class="text-right"><p class="text-[10px] text-gray-400">Sisa Dana Titipan</p><p class="font-black text-xl text-purple-600">${formatRupiah(tTotal)}</p></div>
                        </div>
                    </div>

                </div>
                </div>
        `;

        document.getElementById('card-hutang').onclick = () => { viewState.pendanaanView = 'detail'; viewState.pendanaanType = 'hutang'; renderDetailView(); };
        document.getElementById('card-piutang').onclick = () => { viewState.pendanaanView = 'detail'; viewState.pendanaanType = 'piutang'; renderDetailView(); };
        document.getElementById('card-titipan').onclick = () => { viewState.pendanaanView = 'detail'; viewState.pendanaanType = 'titipan'; renderDetailView(); };
    };

    // --- RENDER DETAIL VIEW (LIST) ---
    const renderDetailView = () => {
        let title = '';
        if(viewState.pendanaanType === 'hutang') title = 'Hutang Saya';
        else if(viewState.pendanaanType === 'piutang') title = 'Piutang / Pinjaman';
        else title = 'Pengelolaan Dana (Titipan)';
        
        const filtered = allDebts.filter(d => {
            const total = parseInt(d.totalAmount || d.amount);
            const paid = parseInt(d.paidAmount || 0);
            const isLunas = paid >= total;
            
            if(d.type !== viewState.pendanaanType) return false;
            if(viewState.pendanaanStatus === 'lunas') return isLunas;
            else return !isLunas; // Tampilkan yang belum lunas
        });

        let listHTML = '';
        if(filtered.length === 0) {
            listHTML = `<div class="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600"><i class="ph-duotone ph-files text-4xl mb-2"></i><p class="text-sm font-medium">Tidak ada data</p></div>`;
        } else {
            listHTML = filtered.map(item => {
                const total = parseInt(item.totalAmount || item.amount);
                const paid = parseInt(item.paidAmount || 0);
                const remaining = total - paid;
                const percentage = Math.min((paid / total) * 100, 100);
                const st = calculateStatus(item);
                const itemData = encodeURIComponent(JSON.stringify(item));
                const initials = item.person.substring(0,2).toUpperCase();
                
                // Warna Icon per Tipe
                let iconClass = 'bg-blue-100 text-blue-600';
                if (item.type === 'hutang') iconClass = 'bg-red-100 text-red-600';
                else if (item.type === 'piutang') iconClass = 'bg-green-100 text-green-600';
                else if (item.type === 'titipan') iconClass = 'bg-purple-100 text-purple-600';

                return `
                <div onclick="window.renderTambahHutangModal('${itemData}')" class="relative bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer active:scale-[0.99] transition mb-3 overflow-hidden">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 ${iconClass} dark:bg-opacity-20 rounded-xl flex items-center justify-center font-bold text-sm">
                                ${initials}
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-800 dark:text-white text-base capitalize">${item.person}</h4>
                                <span class="text-[10px] px-2 py-0.5 rounded-md font-bold ${st.badgeColor}">${st.label}</span>
                            </div>
                        </div>
                        <div class="text-right">
                             <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider">${item.type === 'titipan' ? 'Sisa Dana' : 'Sisa Tagihan'}</p>
                             <p class="font-black text-lg text-gray-800 dark:text-white">${formatRupiah(remaining)}</p>
                        </div>
                    </div>
                    <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div class="${st.barColor} h-1.5 rounded-full" style="width: ${percentage}%"></div>
                    </div>
                    <div class="flex justify-between items-center text-xs text-gray-400 pt-2 border-t border-gray-50 dark:border-gray-700">
                        <span><i class="ph-fill ph-calendar-blank"></i> ${item.type === 'titipan' ? 'Mulai:' : 'Tempo:'} ${item.dueDate || item.startDate || '-'}</span>
                        <span class="text-blue-500 font-bold flex items-center gap-1">Rincian <i class="ph-bold ph-caret-right"></i></span>
                    </div>
                </div>`;
            }).join('');
        }

        const activeStyleBelum = viewState.pendanaanStatus === 'belum' ? 'background-color: #fff7ed; color: #ea580c; border: 1px solid #ffedd5;' : '';
        const activeStyleLunas = viewState.pendanaanStatus === 'lunas' ? 'background-color: #f0fdf4; color: #16a34a; border: 1px solid #dcfce7;' : '';

        container.innerHTML = `
            <div class="p-4 min-h-screen pb-24">
                <div class="flex items-center gap-3 mb-4">
                    <button id="btn-back-pendanaan" class="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <i class="ph-bold ph-arrow-left text-xl text-gray-800 dark:text-white"></i>
                    </button>
                    <h2 class="text-gray-800 dark:text-white text-lg font-bold">${title}</h2>
                </div>

                <div class="flex gap-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button id="subtab-belum" class="flex-1 py-2.5 text-xs font-bold rounded-lg transition" style="${activeStyleBelum}">${viewState.pendanaanType === 'titipan' ? 'Sedang Berjalan' : 'Belum Lunas'}</button>
                    <button id="subtab-lunas" class="flex-1 py-2.5 text-xs font-bold rounded-lg transition" style="${activeStyleLunas}">Selesai</button>
                </div>

                <div class="space-y-1 pb-20">
                    ${listHTML}
                </div>
            </div>
        `;

        document.getElementById('btn-back-pendanaan').onclick = () => { viewState.pendanaanView = 'dashboard'; renderDashboard(); };
        document.getElementById('subtab-belum').onclick = () => { viewState.pendanaanStatus = 'belum'; renderDetailView(); };
        document.getElementById('subtab-lunas').onclick = () => { viewState.pendanaanStatus = 'lunas'; renderDetailView(); };
    };

    // Init Render
    const render = () => { if(viewState.pendanaanView === 'dashboard') renderDashboard(); else renderDetailView(); };
    unsub.debtsList = subscribeToData('debts', (items) => { allDebts = items; render(); });
}

// --- RENDER LAPORAN (UPDATE: 2 DONUT + 1 TREND CHART) ---
let incomeChartInstance = null;
let expenseChartInstance = null;
let trendChartInstance = null;

export function renderLaporan(container, unsub) {
    // --- 1. STRUKTUR HTML ---
    container.innerHTML = `
        <div class="min-h-screen pb-24 bg-gray-50 dark:bg-gray-900 transition-colors">
            
            <div class="sticky top-0 z-20 pt-4 px-4 pb-2 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-md">
                <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-2 flex justify-between items-center border border-gray-100 dark:border-gray-700 relative">
                    <button id="prev-period" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                        <i class="ph-bold ph-caret-left text-xl"></i>
                    </button>
                    
                    <div class="flex flex-col items-center cursor-pointer active:scale-95 transition flex-1" id="trigger-filter">
                        <span id="period-label" class="text-sm font-bold text-gray-800 dark:text-white text-center truncate px-2">...</span>
                        <div class="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-md mt-1">
                            <span id="filter-badge" class="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">Bulanan</span>
                            <i class="ph-bold ph-caret-down text-xs text-indigo-500"></i>
                        </div>
                    </div>

                    <button id="next-period" class="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition">
                        <i class="ph-bold ph-caret-right text-xl"></i>
                    </button>
                </div>
            </div>

            <div id="filter-options" class="hidden absolute top-24 left-4 right-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-30 border border-gray-100 dark:border-gray-700 p-4 animate-scale-up origin-top">
                <div class="grid grid-cols-4 gap-2 mb-3">
                    <button onclick="window.setReportFilter('harian')" class="filter-btn py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 text-gray-600 dark:text-gray-300">Harian</button>
                    <button onclick="window.setReportFilter('mingguan')" class="filter-btn py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 text-gray-600 dark:text-gray-300">Mingguan</button>
                    <button onclick="window.setReportFilter('bulanan')" class="filter-btn py-2 text-xs font-bold rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">Bulanan</button>
                    <button onclick="window.setReportFilter('tahunan')" class="filter-btn py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 text-gray-600 dark:text-gray-300">Tahunan</button>
                </div>
                <button onclick="window.toggleCustomDate()" class="w-full py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center justify-center gap-2">
                    <i class="ph-bold ph-calendar-plus"></i> Pilih Tanggal (Sesuaikan)
                </button>
                <div id="custom-date-container" class="hidden mt-3 space-y-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div class="grid grid-cols-2 gap-3">
                        <div><label class="text-[10px] font-bold text-gray-400 uppercase">Dari</label><input type="date" id="custom-start" class="w-full p-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-xs font-bold dark:text-white"></div>
                        <div><label class="text-[10px] font-bold text-gray-400 uppercase">Sampai</label><input type="date" id="custom-end" class="w-full p-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-xs font-bold dark:text-white"></div>
                    </div>
                    <button onclick="window.applyCustomFilter()" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg transition">Terapkan Filter</button>
                </div>
            </div>

            <div class="p-4 space-y-5">
                
                <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div class="grid grid-cols-3 gap-2 text-center divide-x divide-gray-100 dark:divide-gray-700">
                        <div><p class="text-[10px] text-gray-400 uppercase font-bold mb-1">Masuk</p><p id="report-income" class="text-sm font-extrabold text-green-600">Rp 0</p></div>
                        <div><p class="text-[10px] text-gray-400 uppercase font-bold mb-1">Keluar</p><p id="report-expense" class="text-sm font-extrabold text-red-500">Rp 0</p></div>
                        <div><p class="text-[10px] text-gray-400 uppercase font-bold mb-1">Total</p><p id="report-total" class="text-sm font-extrabold text-indigo-600">Rp 0</p></div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 class="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider flex items-center gap-2"><i class="ph-fill ph-trend-up"></i> Grafik Tren</h3>
                    <div class="h-56 relative w-full"><canvas id="trendChart"></canvas></div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                        <h3 class="text-green-600 dark:text-green-400 font-bold text-sm uppercase mb-4 tracking-wide">Pemasukan</h3>
                        
                        <div class="h-64 w-full relative mb-4 flex justify-center">
                            <canvas id="incomeChart"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span class="text-[10px] text-gray-400 uppercase">Total</span>
                                <span id="donut-inc-val" class="text-lg font-black text-green-600">Rp 0</span>
                            </div>
                        </div>

                        <button onclick="window.openDrillDown('pemasukan')" class="w-full py-3.5 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400 text-xs font-bold hover:bg-green-100 transition flex items-center justify-center gap-2">
                            Lihat Rincian <i class="ph-bold ph-caret-right"></i>
                        </button>
                    </div>

                    <div class="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center">
                        <h3 class="text-red-500 dark:text-red-400 font-bold text-sm uppercase mb-4 tracking-wide">Pengeluaran</h3>
                        
                        <div class="h-64 w-full relative mb-4 flex justify-center">
                            <canvas id="expenseChart"></canvas>
                            <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span class="text-[10px] text-gray-400 uppercase">Total</span>
                                <span id="donut-exp-val" class="text-lg font-black text-red-500">Rp 0</span>
                            </div>
                        </div>

                        <button onclick="window.openDrillDown('pengeluaran')" class="w-full py-3.5 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 text-xs font-bold hover:bg-red-100 transition flex items-center justify-center gap-2">
                            Lihat Rincian <i class="ph-bold ph-caret-right"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div id="drill-down-modal" class="fixed inset-0 z-[80] hidden flex items-end sm:items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm sm:p-4 transition-all">
            <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up shadow-2xl h-[85vh] flex flex-col relative overflow-hidden">
                <div class="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-700 pb-4 shrink-0 z-20 relative">
                    <div class="flex items-center gap-2">
                        <button id="modal-back-btn" class="hidden p-2 -ml-2 text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                            <i class="ph-bold ph-arrow-left text-xl"></i>
                        </button>
                        <h3 id="modal-title" class="font-bold text-lg text-gray-800 dark:text-white truncate max-w-[200px]">Rincian</h3>
                    </div>
                    <button onclick="document.getElementById('drill-down-modal').classList.add('hidden')" class="text-gray-400 hover:text-red-500 transition">
                        <i class="ph-bold ph-x text-xl"></i>
                    </button>
                </div>
                <div id="modal-content" class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar z-10 relative"></div>
            </div>
        </div>
    `;

    // --- 2. LOGIKA JAVASCRIPT ---
    let incomeChartInstance = null;
    let expenseChartInstance = null;
    let trendChartInstance = null;
    
    let currentFilter = 'bulanan';
    let reportDate = new Date();
    let customRange = { start: null, end: null };
    let rawTransactions = []; 
    let processedData = { pemasukan: {}, pengeluaran: {} };

    // --- HANDLERS FILTER & NAVIGASI ---
    document.getElementById('trigger-filter').onclick = (e) => { e.stopPropagation(); document.getElementById('filter-options').classList.toggle('hidden'); };
    
    window.toggleCustomDate = () => {
        const container = document.getElementById('custom-date-container');
        if (container.classList.contains('hidden')) {
            container.classList.remove('hidden');
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('custom-start').value = today;
            document.getElementById('custom-end').value = today;
        } else {
            container.classList.add('hidden');
        }
    };

    window.setReportFilter = (filter) => {
        currentFilter = filter;
        document.getElementById('filter-badge').innerText = filter;
        document.getElementById('filter-options').classList.add('hidden');
        document.getElementById('custom-date-container').classList.add('hidden');
        reportDate = new Date();
        updateFilterStyles();
        updateUI();
    };

    window.applyCustomFilter = () => {
        const startVal = document.getElementById('custom-start').value;
        const endVal = document.getElementById('custom-end').value;
        if (!startVal || !endVal) return showToast("Pilih tanggal!", "error");
        customRange = { start: new Date(startVal), end: new Date(endVal) };
        currentFilter = 'custom';
        document.getElementById('filter-badge').innerText = 'Sesuaikan';
        document.getElementById('filter-options').classList.add('hidden');
        updateFilterStyles();
        updateUI();
    };

    const updateFilterStyles = () => {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            const isActive = btn.innerText.toLowerCase() === currentFilter;
            btn.className = isActive ? "filter-btn py-2 text-xs font-bold rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 shadow-sm" : "filter-btn py-2 text-xs font-bold rounded-xl bg-gray-50 dark:bg-gray-700 hover:bg-indigo-50 text-gray-600 dark:text-gray-300";
        });
    };

    document.addEventListener('click', (e) => {
        const menu = document.getElementById('filter-options');
        const trigger = document.getElementById('trigger-filter');
        if (menu && trigger && !menu.classList.contains('hidden') && !menu.contains(e.target) && !trigger.contains(e.target)) menu.classList.add('hidden');
    });

    const changeDate = (n) => {
        if (currentFilter === 'custom') return;
        if(currentFilter === 'bulanan') reportDate.setMonth(reportDate.getMonth() + n); 
        else if(currentFilter === 'tahunan') reportDate.setFullYear(reportDate.getFullYear() + n); 
        else if(currentFilter === 'mingguan') reportDate.setDate(reportDate.getDate() + (n * 7));
        else reportDate.setDate(reportDate.getDate() + n); 
        updateUI(); 
    };
    document.getElementById('prev-period').onclick = () => changeDate(-1);
    document.getElementById('next-period').onclick = () => changeDate(1);

    // --- MAIN LOGIC ---
    const updateUI = () => {
        const labelEl = document.getElementById('period-label');
        const prevBtn = document.getElementById('prev-period');
        const nextBtn = document.getElementById('next-period');

        if (currentFilter === 'custom') {
            const s = customRange.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short'});
            const e = customRange.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit'});
            labelEl.innerText = `${s} - ${e}`;
            prevBtn.classList.add('invisible'); nextBtn.classList.add('invisible');
        } else {
            prevBtn.classList.remove('invisible'); nextBtn.classList.remove('invisible');
            if (currentFilter === 'harian') labelEl.innerText = reportDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            else if (currentFilter === 'bulanan') labelEl.innerText = reportDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
            else if (currentFilter === 'tahunan') labelEl.innerText = reportDate.getFullYear();
            else { 
                const start = new Date(reportDate); start.setDate(reportDate.getDate() - reportDate.getDay());
                const end = new Date(start); end.setDate(start.getDate() + 6);
                labelEl.innerText = `${start.getDate()} - ${end.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}`;
            }
        }

        const filtered = rawTransactions.filter(t => {
            const d = new Date(t.date); d.setHours(0,0,0,0);
            if (currentFilter === 'custom') {
                const start = new Date(customRange.start); start.setHours(0,0,0,0);
                const end = new Date(customRange.end); end.setHours(23,59,59,999);
                return d >= start && d <= end;
            }
            if (currentFilter === 'harian') return d.toDateString() === reportDate.toDateString();
            if (currentFilter === 'bulanan') return d.getMonth() === reportDate.getMonth() && d.getFullYear() === reportDate.getFullYear();
            if (currentFilter === 'tahunan') return d.getFullYear() === reportDate.getFullYear();
            if (currentFilter === 'mingguan') {
                const start = new Date(reportDate); start.setDate(reportDate.getDate() - reportDate.getDay()); start.setHours(0,0,0,0);
                const end = new Date(start); end.setDate(start.getDate() + 6); end.setHours(23,59,59,999);
                return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
            }
            return true;
        });

        processedData = { pemasukan: {}, pengeluaran: {} };
        let totalInc = 0, totalExp = 0;
        const trendData = {};

        filtered.forEach(t => {
            if (t.categoryName === 'Transfer Masuk' || t.categoryName === 'Transfer Keluar') return;
            const amt = parseInt(t.amount);
            const dateKey = t.date;
            const catName = t.categoryName || t.category || 'Lainnya';
            const typeKey = t.type;

            if(!trendData[dateKey]) trendData[dateKey] = { inc: 0, exp: 0 };
            if(typeKey === 'pemasukan') { totalInc += amt; trendData[dateKey].inc += amt; } 
            else { totalExp += amt; trendData[dateKey].exp += amt; }

            if (processedData[typeKey]) {
                if(!processedData[typeKey][catName]) processedData[typeKey][catName] = { amount: 0, count: 0, items: [] };
                processedData[typeKey][catName].amount += amt;
                processedData[typeKey][catName].count++;
                processedData[typeKey][catName].items.push(t);
            }
        });

        document.getElementById('report-income').innerText = formatRupiah(totalInc);
        document.getElementById('report-expense').innerText = formatRupiah(totalExp);
        const profit = totalInc - totalExp;
        document.getElementById('report-total').innerText = formatRupiah(profit);
        document.getElementById('report-total').className = `text-sm font-extrabold ${profit >= 0 ? 'text-indigo-600' : 'text-orange-500'}`;

        renderChartWithData('incomeChart', processedData.pemasukan, totalInc, incomeChartInstance, (i) => incomeChartInstance = i, 'inc');
        renderChartWithData('expenseChart', processedData.pengeluaran, totalExp, expenseChartInstance, (i) => expenseChartInstance = i, 'exp');
        renderTrendChart(trendData);
    };

    // --- CHART RENDERER ---
    const renderChartWithData = (canvasId, dataMap, totalVal, instance, setInstance, type) => {
        const ctx = document.getElementById(canvasId).getContext('2d');
        if(instance) instance.destroy();

        const textEl = document.getElementById(type === 'inc' ? 'donut-inc-val' : 'donut-exp-val');
        if(textEl) textEl.innerText = formatRupiah(totalVal);

        const labels = Object.keys(dataMap);
        const dataValues = Object.values(dataMap).map(d => d.amount);
        const paletteInc = ['#10B981', '#34D399', '#6EE7B7', '#A7F3D0', '#059669', '#064E3B'];
        const paletteExp = ['#EF4444', '#F87171', '#FCA5A5', '#FECACA', '#B91C1C', '#7F1D1D'];
        const colors = type === 'inc' ? paletteInc : paletteExp;

        if(dataValues.length === 0) {
            setInstance(new Chart(ctx, { type: 'doughnut', data: { datasets: [{ data: [1], backgroundColor: ['#F3F4F6'], borderWidth: 0 }] }, options: { cutout: '65%', events: [], plugins: { tooltip: { enabled: false }, datalabels: { display: false } } } }));
            return;
        }

        setInstance(new Chart(ctx, {
            type: 'doughnut',
            data: { labels: labels, datasets: [{ data: dataValues, backgroundColor: colors, borderWidth: 2, borderColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff', hoverOffset: 10 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '60%', 
                layout: { padding: 30 }, // Padding besar agar label tidak terpotong
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false },
                    datalabels: {
                        display: true, color: document.documentElement.classList.contains('dark') ? '#e5e7eb' : '#374151',
                        anchor: 'end', align: 'start', offset: 15, clamp: false,
                        font: { size: 11, weight: 'bold', family: "'Inter', sans-serif" },
                        formatter: (value, ctx) => {
                            let sum = 0; ctx.chart.data.datasets[0].data.map(data => sum += data);
                            if ((value * 100 / sum) < 3) return null; // Sembunyikan jika < 3%
                            let pct = ((value / sum) * 100).toFixed(0) + "%";
                            let label = ctx.chart.data.labels[ctx.dataIndex];
                            if (label.length > 10) label = label.substring(0, 10) + '..';
                            return `${label}\n(${pct})`;
                        },
                        textAlign: 'center', backgroundColor: document.documentElement.classList.contains('dark') ? 'rgba(31, 41, 55, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                        borderRadius: 4, borderWidth: 1, borderColor: (ctx) => ctx.dataset.backgroundColor[ctx.dataIndex]
                    }
                },
                onClick: (e, activeEls) => { if(activeEls.length > 0) window.openDrillDown(type === 'inc' ? 'pemasukan' : 'pengeluaran'); }
            },
            plugins: [ChartDataLabels]
        }));
    };

    const renderTrendChart = (trendData) => {
        const ctx = document.getElementById('trendChart').getContext('2d');
        if(trendChartInstance) trendChartInstance.destroy();
        const dates = Object.keys(trendData).sort();
        const labels = dates.map(d => new Date(d).getDate());
        const dataInc = dates.map(d => trendData[d].inc);
        const dataExp = dates.map(d => trendData[d].exp);

        trendChartInstance = new Chart(ctx, {
            type: 'line',
            data: { labels: labels, datasets: [
                { label: 'Masuk', data: dataInc, borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4, fill: true, pointRadius: 2 },
                { label: 'Keluar', data: dataExp, borderColor: '#EF4444', backgroundColor: 'rgba(239, 68, 68, 0.1)', tension: 0.4, fill: true, pointRadius: 2 }
            ]},
            options: {
                responsive: true, maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: { legend: { display: true, position: 'top', align: 'end', labels: { boxWidth: 8, font: {size: 10} } }, datalabels: { display: false } },
                scales: { x: { grid: { display: false } }, y: { display: false } }
            }
        });
    };

    // --- DRILL DOWN SYSTEM ---
    window.openDrillDown = (type) => { 
        const modal = document.getElementById('drill-down-modal');
        const title = document.getElementById('modal-title');
        const backBtn = document.getElementById('modal-back-btn');
        const container = document.getElementById('modal-content');
        modal.classList.remove('hidden'); backBtn.classList.add('hidden');
        const dataMap = processedData[type];
        const totalAmount = Object.values(dataMap).reduce((acc, curr) => acc + curr.amount, 0);
        const colorClass = type === 'pemasukan' ? 'text-green-600' : 'text-red-500';
        
        const renderLevelB = () => {
            title.innerHTML = `<span class="${colorClass}">Rincian ${type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}</span>`;
            backBtn.classList.add('hidden'); container.innerHTML = '';
            const sortedCats = Object.entries(dataMap).sort((a,b) => b[1].amount - a[1].amount);
            if(sortedCats.length === 0) { container.innerHTML = '<p class="text-center text-gray-400 py-10">Tidak ada data.</p>'; return; }
            sortedCats.forEach(([name, data]) => {
                const pct = totalAmount > 0 ? ((data.amount / totalAmount) * 100).toFixed(1) : 0;
                const iconColor = type === 'pemasukan' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600';
                const barColor = type === 'pemasukan' ? 'bg-green-500' : 'bg-red-500';
                const itemEl = document.createElement('div');
                itemEl.className = "mb-4 last:mb-0 cursor-pointer group active:scale-95 transition";
                itemEl.innerHTML = `<div class="flex justify-between items-center mb-2"><div class="flex items-center gap-3"><div class="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${iconColor}">${name.substring(0,1).toUpperCase()}</div><div><p class="font-bold text-gray-800 dark:text-white text-sm group-hover:text-blue-500 transition">${name}</p><p class="text-[10px] text-gray-400">${data.count} Transaksi</p></div></div><div class="text-right"><p class="font-bold text-sm text-gray-800 dark:text-white">${formatRupiah(data.amount)}</p><p class="text-[10px] text-gray-400">${pct}%</p></div></div><div class="w-full bg-gray-100 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden"><div class="${barColor} h-full rounded-full" style="width: ${pct}%"></div></div>`;
                itemEl.onclick = () => renderLevelC(name, data);
                container.appendChild(itemEl);
            });
        };
        const renderLevelC = (catName, catData) => {
            title.innerText = catName; backBtn.classList.remove('hidden'); backBtn.onclick = renderLevelB; container.innerHTML = '';
            catData.items.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(item => {
                const itemData = encodeURIComponent(JSON.stringify(item));
                container.innerHTML += `<div onclick="window.openDetailTransaction('${itemData}')" class="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-xl border border-gray-100 dark:border-gray-600 flex justify-between items-center cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition mb-2"><div><div class="flex items-center gap-2 mb-1"><span class="text-xs font-bold text-gray-500 bg-white dark:bg-gray-800 px-2 py-0.5 rounded-md border border-gray-200 dark:border-gray-600">${new Date(item.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span><span class="text-[10px] text-gray-400">${item.accountName || '-'}</span></div><p class="text-sm font-medium text-gray-800 dark:text-white line-clamp-1">${item.note || 'Tanpa catatan'}</p></div><span class="font-bold text-sm ${item.type === 'pemasukan' ? 'text-green-600' : 'text-red-500'}">${formatRupiah(item.amount)}</span></div>`;
            });
        };
        renderLevelB();
    };

    unsub.report = subscribeToTransactions((result) => { rawTransactions = result.allItems; updateUI(); });
}

export function renderDashboardAdmin(container, unsub) {
    // --- 1. STRUKTUR HTML PREMIUM ---
    container.innerHTML = `
        <div class="min-h-screen pb-32 bg-gray-50 dark:bg-gray-900 transition-colors">
            
            <div class="pt-8 px-6 pb-4 flex justify-between items-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-20">
                <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 p-0.5 shadow-lg">
                        <div class="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                            <i class="ph-fill ph-user text-2xl text-gray-400"></i>
                        </div>
                    </div>
                    <div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider" id="dash-greeting">Selamat Pagi,</p>
                        <h1 class="text-xl font-black text-gray-800 dark:text-white leading-none" id="dash-username">Boss!</h1>
                    </div>
                </div>
                <div class="p-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <i class="ph-bold ph-bell text-gray-600 dark:text-gray-300"></i>
                </div>
            </div>

            <div class="px-4 space-y-5">

                <div class="relative w-full bg-gray-900 text-white p-6 rounded-[2.5rem] shadow-2xl shadow-indigo-500/20 overflow-hidden cursor-pointer group transition-transform active:scale-[0.99]" onclick="window.openDashDrillDown('assets')">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full mix-blend-overlay filter blur-[80px] opacity-40 -mr-16 -mt-16 pointer-events-none"></div>
                    <div class="absolute bottom-0 left-0 w-48 h-48 bg-purple-600 rounded-full mix-blend-overlay filter blur-[60px] opacity-40 -ml-10 -mb-10 pointer-events-none"></div>
                    <div class="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-20 pointer-events-none"></div>
                    
                    <div class="relative z-10">
                        <div class="flex justify-between items-start mb-1">
                            <p class="text-indigo-200 text-[10px] font-bold uppercase tracking-[0.2em]">KEKAYAAN BERSIH</p>
                            <div class="bg-white/20 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 flex items-center gap-1">
                                <div class="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></div>
                                <span class="text-[10px] font-bold">Live</span>
                            </div>
                        </div>
                        <h2 class="text-4xl font-black tracking-tighter mb-6" id="dash-networth">Rp 0</h2>
                        
                        <div class="flex gap-3">
                            <div class="flex-1 bg-gray-800/50 backdrop-blur-sm p-3 rounded-2xl border border-white/5 hover:bg-gray-800/80 transition">
                                <div class="flex items-center gap-2 mb-1">
                                    <div class="p-1 bg-green-500/20 rounded-md"><i class="ph-bold ph-trend-up text-green-400 text-xs"></i></div>
                                    <span class="text-[10px] text-gray-400 uppercase font-bold">Aset</span>
                                </div>
                                <p class="text-sm font-bold text-white" id="dash-assets">Rp 0</p>
                            </div>
                            <div class="flex-1 bg-gray-800/50 backdrop-blur-sm p-3 rounded-2xl border border-white/5 hover:bg-gray-800/80 transition" onclick="event.stopPropagation(); window.openDashDrillDown('liabilities')">
                                <div class="flex items-center gap-2 mb-1">
                                    <div class="p-1 bg-red-500/20 rounded-md"><i class="ph-bold ph-trend-down text-red-400 text-xs"></i></div>
                                    <span class="text-[10px] text-gray-400 uppercase font-bold">Hutang</span>
                                </div>
                                <p class="text-sm font-bold text-white" id="dash-liabilities">Rp 0</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-3">
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center text-center group hover:border-green-200 transition">
                        <span class="text-[10px] text-gray-400 font-bold uppercase mb-1">Masuk</span>
                        <p class="text-xs font-black text-green-600 truncate w-full" id="dash-m-inc">0</p>
                        <div class="w-8 h-1 bg-green-100 rounded-full mt-2 overflow-hidden"><div class="h-full bg-green-500 w-3/4"></div></div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center text-center group hover:border-red-200 transition">
                        <span class="text-[10px] text-gray-400 font-bold uppercase mb-1">Keluar</span>
                        <p class="text-xs font-black text-red-500 truncate w-full" id="dash-m-exp">0</p>
                        <div class="w-8 h-1 bg-red-100 rounded-full mt-2 overflow-hidden"><div class="h-full bg-red-500 w-1/2"></div></div>
                    </div>
                    <div class="bg-white dark:bg-gray-800 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center text-center group hover:border-blue-200 transition">
                        <span class="text-[10px] text-gray-400 font-bold uppercase mb-1">Sisa</span>
                        <p class="text-xs font-black text-blue-600 truncate w-full" id="dash-m-bal">0</p>
                        <div class="w-8 h-1 bg-blue-100 rounded-full mt-2 overflow-hidden"><div class="h-full bg-blue-500 w-full"></div></div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xs font-bold text-gray-800 dark:text-white uppercase tracking-wider">Analisis Data</h3>
                        <div class="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                            <button id="btn-chart-trend" class="px-3 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white transition">Tren</button>
                            <button id="btn-chart-asset" class="px-3 py-1 text-[10px] font-bold rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 transition">Aset</button>
                        </div>
                    </div>
                    
                    <div class="h-48 w-full relative">
                        <canvas id="dashMainChart"></canvas>
                        <div id="asset-legend-overlay" class="hidden absolute top-0 right-0 bottom-0 w-1/3 overflow-y-auto pl-2 space-y-2 text-[10px] custom-scrollbar bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm"></div>
                    </div>
                </div>

                <div>
                    <div class="flex justify-between items-center px-2 mb-3">
                        <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wider">Aktivitas Terakhir</h3>
                        <button onclick="window.location.hash='#laporan'" class="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg hover:bg-indigo-100 transition">Lihat Semua</button>
                    </div>
                    <div class="space-y-2" id="dash-recent-list">
                        <div class="flex flex-col items-center py-6 text-gray-400">
                            <i class="ph-duotone ph-spinner animate-spin text-2xl mb-2"></i>
                            <span class="text-xs">Menyiapkan data...</span>
                        </div>
                    </div>
                </div>

            </div>

            <div class="fixed bottom-24 left-4 right-4 z-20">
                <div class="bg-gray-900/90 dark:bg-white/10 backdrop-blur-md p-2 rounded-2xl shadow-xl border border-white/10 flex justify-around items-center">
                    <button onclick="window.renderTambahModal()" class="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/10 transition group w-1/4">
                        <i class="ph-bold ph-plus-circle text-xl text-green-400 group-hover:scale-110 transition"></i>
                        <span class="text-[8px] font-bold text-gray-300 uppercase">Catat</span>
                    </button>
                    <div class="w-px h-6 bg-white/10"></div>
                    <button onclick="window.renderTransferModal()" class="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/10 transition group w-1/4">
                        <i class="ph-bold ph-arrows-left-right text-xl text-blue-400 group-hover:scale-110 transition"></i>
                        <span class="text-[8px] font-bold text-gray-300 uppercase">Transfer</span>
                    </button>
                    <div class="w-px h-6 bg-white/10"></div>
                    <button onclick="window.renderTambahHutangModal()" class="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/10 transition group w-1/4">
                        <i class="ph-bold ph-hand-coins text-xl text-orange-400 group-hover:scale-110 transition"></i>
                        <span class="text-[8px] font-bold text-gray-300 uppercase">Hutang</span>
                    </button>
                    <div class="w-px h-6 bg-white/10"></div>
                    <button onclick="window.renderExportModal()" class="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-white/10 transition group w-1/4">
                        <i class="ph-bold ph-microsoft-excel-logo text-xl text-emerald-400 group-hover:scale-110 transition"></i>
                        <span class="text-[8px] font-bold text-gray-300 uppercase">Ekspor</span>
                    </button>
                </div>
            </div>

        </div>

        <div id="dash-drill-modal" class="fixed inset-0 z-[90] hidden flex items-end sm:items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm sm:p-4 transition-all">
            <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-0 shadow-2xl animate-slide-up h-[85vh] sm:h-auto flex flex-col relative overflow-hidden">
                <div class="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-20">
                    <div class="flex items-center gap-2">
                        <button id="dd-back-btn" class="hidden p-2 -ml-2 text-gray-500 hover:text-gray-800 transition"><i class="ph-bold ph-arrow-left text-xl"></i></button>
                        <h3 id="dd-title" class="font-bold text-lg text-gray-800 dark:text-white truncate max-w-[200px]">Detail</h3>
                    </div>
                    <button onclick="document.getElementById('dash-drill-modal').classList.add('hidden')" class="text-gray-400 hover:text-red-500 transition"><i class="ph-bold ph-x text-xl"></i></button>
                </div>
                <div id="dd-content" class="flex-1 overflow-y-auto p-4 custom-scrollbar bg-gray-50 dark:bg-gray-900 relative"></div>
            </div>
        </div>
    `;

    // --- 2. LOGIKA DATA & INTERAKSI ---
    let accountsData = [], debtsData = [], transactionsData = [];
    let mainChart = null;
    let currentChartMode = 'trend'; // 'trend' or 'asset'
    
    // Greeting
    const hour = new Date().getHours();
    document.getElementById('dash-greeting').innerText = (hour < 12 ? "Selamat Pagi," : hour < 15 ? "Selamat Siang," : hour < 18 ? "Selamat Sore," : "Selamat Malam,");
    if(auth.currentUser) document.getElementById('dash-username').innerText = (auth.currentUser.displayName || "Boss") + "!";

    // --- CHART SWITCHER LOGIC ---
    const btnTrend = document.getElementById('btn-chart-trend');
    const btnAsset = document.getElementById('btn-chart-asset');
    
    const switchChart = (mode) => {
        currentChartMode = mode;
        if(mode === 'trend') {
            btnTrend.className = "px-3 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white transition";
            btnAsset.className = "px-3 py-1 text-[10px] font-bold rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 transition";
            document.getElementById('asset-legend-overlay').classList.add('hidden');
            renderTrendLogic();
        } else {
            btnAsset.className = "px-3 py-1 text-[10px] font-bold rounded-md bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white transition";
            btnTrend.className = "px-3 py-1 text-[10px] font-bold rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 transition";
            document.getElementById('asset-legend-overlay').classList.remove('hidden');
            renderAssetLogic();
        }
    };

    btnTrend.onclick = () => switchChart('trend');
    btnAsset.onclick = () => switchChart('asset');

    // --- CALCULATION LOGIC ---
    const calculateDashboard = () => {
        let totalAssets = 0, totalLiabilities = 0;
        let monthInc = 0, monthExp = 0;
        const now = new Date();

        // Aset & Saldo Akun
        accountsData.forEach(acc => {
            let balance = parseInt(acc.initialBalance || 0);
            transactionsData.forEach(t => { if (t.accountId === acc.id) balance += (t.type === 'pemasukan' ? parseInt(t.amount) : -parseInt(t.amount)); });
            totalAssets += balance;
            acc.currentBalance = balance; // Simpan untuk chart aset
        });

        // Hutang
        debtsData.forEach(d => { if (d.type === 'hutang') totalLiabilities += (parseInt(d.totalAmount||d.amount) - parseInt(d.paidAmount||0)); });

        // Bulan Ini
        transactionsData.forEach(t => {
            if (t.categoryName?.includes('Transfer')) return;
            const tDate = new Date(t.date);
            const amt = parseInt(t.amount);
            if (tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()) {
                if (t.type === 'pemasukan') monthInc += amt; else monthExp += amt;
            }
        });

        // Update UI Angka
        document.getElementById('dash-networth').innerText = formatRupiah(totalAssets - totalLiabilities);
        document.getElementById('dash-assets').innerText = formatRupiah(totalAssets);
        document.getElementById('dash-liabilities').innerText = formatRupiah(totalLiabilities);
        document.getElementById('dash-m-inc').innerText = formatRupiah(monthInc);
        document.getElementById('dash-m-exp').innerText = formatRupiah(monthExp);
        document.getElementById('dash-m-bal').innerText = formatRupiah(monthInc - monthExp);

        // Render Chart Sesuai Mode Aktif
        if(currentChartMode === 'trend') renderTrendLogic(); else renderAssetLogic();
        renderRecentActivity();
    };

    // --- CHART RENDERERS ---
    const renderTrendLogic = () => {
        const ctx = document.getElementById('dashMainChart').getContext('2d');
        if (mainChart) mainChart.destroy();

        const months = [];
        for(let i=5; i>=0; i--) {
            const d = new Date(new Date().getFullYear(), new Date().getMonth() - i, 1);
            months.push({ label: `${d.toLocaleDateString('id-ID',{month:'short'})}`, idx: d.getMonth(), year: d.getFullYear(), inc: 0, exp: 0 });
        }

        transactionsData.forEach(t => {
            if (t.categoryName?.includes('Transfer')) return;
            const d = new Date(t.date);
            const m = months.find(x => x.idx === d.getMonth() && x.year === d.getFullYear());
            if(m) { if(t.type === 'pemasukan') m.inc += parseInt(t.amount); else m.exp += parseInt(t.amount); }
        });

        mainChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months.map(m => m.label),
                datasets: [
                    { label: 'Masuk', data: months.map(m => m.inc), backgroundColor: '#10B981', borderRadius: 4, barPercentage: 0.6 },
                    { label: 'Keluar', data: months.map(m => m.exp), backgroundColor: '#EF4444', borderRadius: 4, barPercentage: 0.6 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: { x: { grid: { display: false }, ticks: { font: { size: 9 } } }, y: { display: false } },
                plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } }
            }
        });
    };

    const renderAssetLogic = () => {
        const ctx = document.getElementById('dashMainChart').getContext('2d');
        if (mainChart) mainChart.destroy();

        const sorted = accountsData.sort((a,b) => b.currentBalance - a.currentBalance);
        const labels = sorted.map(a => a.name);
        const data = sorted.map(a => a.currentBalance);
        const colors = ['#6366F1', '#8B5CF6', '#EC4899', '#F43F5E', '#10B981', '#F59E0B'];

        mainChart = new Chart(ctx, {
            type: 'doughnut',
            data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 0, hoverOffset: 5 }] },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                onClick: () => window.openDashDrillDown('assets')
            }
        });

        // Render Legend Custom di Samping
        const legend = document.getElementById('asset-legend-overlay');
        legend.innerHTML = '';
        sorted.forEach((acc, i) => {
            const pct = ((acc.currentBalance / (data.reduce((a,b)=>a+b,0)||1)) * 100).toFixed(0);
            legend.innerHTML += `<div class="flex justify-between items-center mb-1"><div class="flex items-center gap-1"><div class="w-1.5 h-1.5 rounded-full" style="background:${colors[i%colors.length]}"></div><span class="truncate w-16 font-medium text-gray-600 dark:text-gray-300">${acc.name}</span></div><span class="font-bold text-gray-800 dark:text-white">${pct}%</span></div>`;
        });
    };

    // --- RECENT LIST RENDERER ---
    const renderRecentActivity = () => {
        const list = document.getElementById('dash-recent-list');
        list.innerHTML = '';
        const recent = transactionsData.slice(0, 5);
        
        if (recent.length === 0) {
            list.innerHTML = `<div class="text-center py-6 text-gray-400 text-xs italic">Belum ada aktivitas. Mulai catat sekarang!</div>`;
            return;
        }

        recent.forEach(t => {
            const isInc = t.type === 'pemasukan';
            const iconKey = t.icon || (isInc ? 'wallet' : 'shopping');
            
            list.innerHTML += `
                <div class="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:bg-gray-50 transition cursor-pointer" onclick="window.openDetailTransaction('${encodeURIComponent(JSON.stringify(t))}')">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl ${isInc ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'} flex items-center justify-center text-lg">
                            ${Icons[iconKey] || Icons['default']}
                        </div>
                        <div class="overflow-hidden">
                            <p class="text-xs font-bold text-gray-800 dark:text-white truncate w-32">${t.categoryName || t.category}</p>
                            <p class="text-[10px] text-gray-400 truncate">${t.accountName || 'Tunai'} • ${new Date(t.date).toLocaleDateString('id-ID', {day:'numeric', month:'short'})}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="text-xs font-black ${isInc ? 'text-green-600' : 'text-red-500'}">${isInc?'+':'-'} ${formatRupiah(t.amount)}</span>
                    </div>
                </div>
            `;
        });
    };

    // --- DATA SUBSCRIPTION ---
    const subAcc = subscribeToData('accounts', (data) => { accountsData = data; if(transactionsData.length) calculateDashboard(); });
    const subDebt = subscribeToData('debts', (data) => { debtsData = data; if(transactionsData.length) calculateDashboard(); });
    const subTrx = subscribeToTransactions((res) => { transactionsData = res.allItems; calculateDashboard(); });

    unsub.dashboard = () => { subAcc(); subDebt(); subTrx(); };
    
    // --- DRILL DOWN FUNCTION (Reused from previous code if already implemented, or keep simplified here) ---
    // Pastikan window.openDashDrillDown sudah ada di kode sebelumnya atau tambahkan ulang jika perlu.
    // Kode drill down sama seperti yang sudah saya berikan di jawaban "Beranak" sebelumnya.
}

// --- RENDER REKENING (UPDATE: REALTIME BALANCE + ICONS + EDIT) ---
export function renderRekening(container, unsub) {
    let allAccounts = [];
    let allTransactions = [];

    const renderUI = () => {
        container.innerHTML = `
            <div class="p-4 min-h-screen pb-24 bg-gray-50 dark:bg-gray-900 transition-colors">
                <div class="flex justify-between items-center mb-6 px-2">
                    <div>
                        <h2 class="text-2xl font-extrabold text-gray-800 dark:text-white">Dompet & Akun</h2>
                        <p class="text-xs text-gray-500 font-medium mt-1">Kelola sumber danamu</p>
                    </div>
                    <button onclick="window.renderAccountModal()" class="bg-blue-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                    </button>
                </div>

                <div id="accounts-list" class="space-y-4 pb-20"></div>
            </div>
        `;

        const list = document.getElementById('accounts-list');
        list.innerHTML = '';

        if (allAccounts.length === 0) {
            list.innerHTML = `<div class="text-center py-20 text-gray-400 flex flex-col items-center"><svg class="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg><p>Belum ada rekening/dompet.</p></div>`;
            return;
        }

        // Hitung Total Saldo Global
        let globalBalance = 0;

        allAccounts.forEach(acc => {
            // Logic Hitung Saldo: Saldo Awal + (Masuk - Keluar)
            const initial = parseInt(acc.initialBalance || 0);
            let current = initial;

            allTransactions.forEach(t => {
                if (t.accountId === acc.id) {
                    const amt = parseInt(t.amount);
                    if (t.type === 'pemasukan') current += amt;
                    else current -= amt;
                }
            });

            globalBalance += current;
            const itemData = encodeURIComponent(JSON.stringify(acc));

            list.innerHTML += `
                <div onclick="window.renderAccountModal('${itemData}')" class="group relative bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer transition-all hover:shadow-md active:scale-[0.98]">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    
                    <div class="flex items-center gap-4 relative z-10">
                        <div class="w-14 h-14 p-3 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-inner">
                            ${Icons[acc.icon] || Icons['default']}
                        </div>
                        <div class="flex-1">
                            <h4 class="font-bold text-gray-800 dark:text-white text-lg">${acc.name}</h4>
                            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium">${acc.holder || 'Tunai'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">Saldo Saat Ini</p>
                            <p class="font-bold text-lg ${current >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}">${formatRupiah(current)}</p>
                        </div>
                    </div>
                </div>
            `;
        });

        // Tambahkan Kartu Total Aset di Paling Atas (Opsional, tapi bagus buat UX)
        list.insertAdjacentHTML('afterbegin', `
            <div class="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-6 rounded-3xl shadow-xl mb-6 relative overflow-hidden">
                <div class="relative z-10">
                    <p class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total Aset Bersih</p>
                    <h2 class="text-3xl font-extrabold tracking-tight">${formatRupiah(globalBalance)}</h2>
                </div>
                <div class="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4">
                    <svg class="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.31-8.86c-1.77-.45-2.34-.94-2.34-1.67 0-.84.79-1.43 2.1-1.43 1.38 0 1.9.66 1.94 1.64h1.71c-.05-1.34-.87-2.57-2.49-2.97V5H10.9v1.69c-1.51.32-2.72 1.3-2.72 2.81 0 1.79 1.49 2.69 3.66 3.21 1.95.46 2.34 1.15 2.34 1.87 0 .53-.39 1.39-2.1 1.39-1.6 0-2.23-.72-2.32-1.64H8.04c.1 1.7 1.36 2.66 2.86 2.97V19h2.34v-1.67c1.52-.29 2.72-1.16 2.73-2.77-.01-2.2-1.9-2.96-3.66-3.42z"/></svg>
                </div>
            </div>
        `);
    };

    const subAcc = subscribeToData('accounts', (items) => {
        allAccounts = items;
        renderUI();
    });

    // Subscribe Transaksi (Untuk hitung saldo)
    const subTrx = subscribeToTransactions((res) => {
        allTransactions = res.allItems;
        renderUI(); // Re-render saat ada transaksi baru
    });

    // Kembalikan fungsi unsubscribe gabungan
    return () => { subAcc(); subTrx(); };
}

// --- RENDER KATEGORI (UPDATE: TABS + ICONS + EDIT) ---
export function renderKategori(container, unsub) {
    let activeType = 'pengeluaran'; 
    let allCategories = []; 

    const renderList = () => { 
        const list = document.getElementById('categories-list'); 
        const filtered = allCategories.filter(c => c.type === activeType); 
        
        list.innerHTML = ''; 
        
        if(filtered.length === 0) { 
            list.innerHTML = `<div class="col-span-2 text-center py-20 text-gray-400">Belum ada kategori ${activeType}.</div>`; 
            return; 
        } 
        
        filtered.forEach(cat => { 
            const itemData = encodeURIComponent(JSON.stringify(cat));
            const colorClass = activeType === 'pemasukan' ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-red-500 bg-red-50 dark:bg-red-900/20';
            
            list.innerHTML += `
                <div onclick="window.renderCategoryModal('${itemData}')" class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 cursor-pointer hover:shadow-md transition active:scale-[0.98]">
                    <div class="w-12 h-12 p-2.5 rounded-xl ${colorClass} flex items-center justify-center shadow-sm">
                        ${Icons[cat.icon] || Icons['default']}
                    </div>
                    <div class="flex-1">
                        <h4 class="font-bold text-gray-800 dark:text-white">${cat.name}</h4>
                        <p class="text-[10px] text-gray-400 uppercase tracking-wide">${cat.type}</p>
                    </div>
                    <div class="text-gray-300">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                    </div>
                </div>
            `; 
        }); 
    };

    container.innerHTML = `
        <div class="p-4 min-h-screen pb-24 bg-gray-50 dark:bg-gray-900 transition-colors">
            <div class="flex justify-between items-center mb-6 px-2">
                <div>
                    <h2 class="text-2xl font-extrabold text-gray-800 dark:text-white">Kategori</h2>
                    <p class="text-xs text-gray-500 font-medium mt-1">Atur pos keuanganmu</p>
                </div>
                <button onclick="window.renderCategoryModal()" class="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:bg-indigo-700 transition">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </button>
            </div>

            <div class="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-xl mb-6">
                <button id="tab-expense" class="flex-1 py-2.5 text-sm font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition">Pengeluaran</button>
                <button id="tab-income" class="flex-1 py-2.5 text-sm font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 transition">Pemasukan</button>
            </div>

            <div id="categories-list" class="grid grid-cols-1 gap-3 pb-20"></div>
        </div>
    `;

    // --- TAB LOGIC ---
    const tabExp = document.getElementById('tab-expense'); 
    const tabInc = document.getElementById('tab-income');
    
    const setTab = (type) => {
        activeType = type;
        if(type === 'pengeluaran') {
            tabExp.className = "flex-1 py-2.5 text-sm font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition";
            tabInc.className = "flex-1 py-2.5 text-sm font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 transition";
        } else {
            tabInc.className = "flex-1 py-2.5 text-sm font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition";
            tabExp.className = "flex-1 py-2.5 text-sm font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 transition";
        }
        renderList();
    };

    tabExp.onclick = () => setTab('pengeluaran');
    tabInc.onclick = () => setTab('pemasukan');

    unsub.categories = subscribeToData('categories', (items) => { allCategories = items; renderList(); });
}

// --- RENDER AKTIVITAS (UPDATE: EDIT MODAL & INTERACTIVE CARD) ---
export function renderActivities(container, unsub) {
    container.innerHTML = `
        <div class="p-4 min-h-screen pb-24 relative bg-gray-50 dark:bg-gray-900 transition-colors">
            <div class="flex justify-between items-start mb-6 px-2">
                <div>
                    <h2 class="text-2xl font-extrabold text-gray-800 dark:text-white">Aktivitas</h2>
                    <p class="text-xs text-gray-500 font-medium mt-1">Target harianmu</p>
                </div>
                <button onclick="window.location.hash='#catatanMe'" class="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-yellow-300 transition flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    Catatan Me
                </button>
            </div>

            <div id="activities-list" class="space-y-3 pb-20">
                <div id="loading-act" class="text-center py-10 text-gray-400">Memuat aktivitas...</div>
            </div>
        </div>
    `;

    unsub.activities = subscribeToData('activities', (items) => { 
        const list = document.getElementById('activities-list'); 
        list.innerHTML = '';
        
        if(items.length === 0) { 
            list.innerHTML = `<div class="text-center py-20 text-gray-400"><p>Belum ada aktivitas.</p></div>`; 
            return; 
        } 

        items.forEach(act => { 
            const isDone = act.isDone; 
            const itemData = encodeURIComponent(JSON.stringify(act));
            
            list.innerHTML += `
            <div class="group bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 transition-all">
                <div onclick="window.toggleActivity('${act.id}', ${!isDone})" class="cursor-pointer shrink-0">
                    <div class="w-6 h-6 rounded-full border-2 ${isDone ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'} flex items-center justify-center transition-all duration-300 transform active:scale-90">
                        ${isDone ? '<svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : ''}
                    </div>
                </div>

                <div class="flex-1 cursor-pointer" onclick="window.renderEditActivityModal('${itemData}')">
                    <h4 class="font-bold text-gray-800 dark:text-white text-base ${isDone ? 'line-through text-gray-400 decoration-2 decoration-gray-300' : ''} transition-all">${act.title}</h4>
                    <p class="text-xs text-gray-500 mt-0.5 line-clamp-1">${act.desc || ''}</p>
                    <div class="mt-2 flex items-center gap-2">
                        <span class="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">📅 ${new Date(act.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                    </div>
                </div>

                <button onclick="window.renderEditActivityModal('${itemData}')" class="text-gray-300 hover:text-blue-500 transition p-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                </button>
            </div>`; 
        }); 
    });
}

export function renderRundown(container, unsub) {
    container.innerHTML = `<div class="p-4 min-h-screen pb-24 relative"><div class="flex justify-between items-center mb-4"><h2 class="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase">Jurnal Harian Saya</h2><span class="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded-lg font-bold">24 Jam</span></div><div id="rundown-list" class="space-y-6 pb-20"><div class="text-center py-10 text-gray-400">Memuat jurnal...</div></div><button onclick="document.getElementById('form-rundown-modal').classList.remove('hidden')" class="fixed bottom-24 right-4 w-14 h-14 bg-purple-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-purple-700 transition z-40"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></button><div id="form-rundown-modal" class="fixed inset-0 z-[70] hidden flex items-end sm:items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm sm:p-4"><div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 animate-slide-up shadow-2xl relative"><button onclick="document.getElementById('form-rundown-modal').classList.add('hidden')" class="absolute top-4 right-4 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button><h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-white">Tambah Kegiatan</h3><form id="form-rundown" class="space-y-3"><div class="grid grid-cols-3 gap-3"><div class="col-span-1"><label class="text-xs font-bold text-gray-500">JAM</label><input type="time" name="time" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required></div><div class="col-span-2"><label class="text-xs font-bold text-gray-500">TANGGAL</label><input type="date" name="date" class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required></div></div><div><label class="text-xs font-bold text-gray-500">KEGIATAN</label><input type="text" name="activity" placeholder="Ngoding, Makan, Tidur..." class="w-full p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required></div><button type="submit" class="w-full bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 transition">Simpan</button></form></div></div></div>`;
    const now = new Date(); const timeString = now.toTimeString().split(' ')[0].substring(0,5);
    document.querySelector('#form-rundown [name="date"]').value = now.toISOString().split('T')[0]; document.querySelector('#form-rundown [name="time"]').value = timeString;
    document.getElementById('form-rundown').onsubmit = async (e) => { e.preventDefault(); const data = { time: e.target.time.value, date: e.target.date.value, activity: e.target.activity.value }; if(await addData('rundowns', data)) { e.target.reset(); document.querySelector('#form-rundown [name="date"]').value = new Date().toISOString().split('T')[0]; document.getElementById('form-rundown-modal').classList.add('hidden'); } };
    unsub.rundown = subscribeToRundowns((items) => {
        const list = document.getElementById('rundown-list'); list.innerHTML = '';
        if(items.length === 0) { list.innerHTML = `<div class="text-center py-10 text-gray-400">Belum ada catatan kegiatan.</div>`; return; }
        const groups = {}; items.forEach(item => { if(!groups[item.date]) groups[item.date] = []; groups[item.date].push(item); });
        Object.keys(groups).sort((a,b) => new Date(b) - new Date(a)).forEach(dateKey => {
            const dateLabel = new Date(dateKey).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
            let itemsHTML = groups[dateKey].sort((a,b) => a.time.localeCompare(b.time)).map(r => `<div class="flex gap-4 relative pl-4 pb-4 border-l-2 border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"><div class="absolute -left-[9px] top-0 w-4 h-4 bg-purple-500 rounded-full border-4 border-white dark:border-gray-900"></div><div class="w-16 pt-0.5"><span class="text-sm font-bold text-gray-500">${r.time}</span></div><div class="flex-1 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700 -mt-2"><p class="text-gray-800 dark:text-white font-medium text-sm">${r.activity}</p></div><button onclick="window.hapusItem('rundowns', '${r.id}')" class="self-start mt-1 text-gray-300 hover:text-red-500"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button></div>`).join('');
            list.innerHTML += `<div><h3 class="font-bold text-gray-800 dark:text-white mb-4 sticky top-0 bg-gray-50 dark:bg-gray-900 py-2 z-10">${dateLabel}</h3><div class="ml-2">${itemsHTML}</div></div>`;
        });
    });
}