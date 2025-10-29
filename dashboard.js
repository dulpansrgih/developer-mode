import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  setDoc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { auth } from "./auth.js";
import { uploadKTPToAppsScript } from "./upID.js";
import { showKuitansiWindow, generateWhatsAppReminder } from "./receiptRemind.js";
export { formatCurrency };

const db = getFirestore();
const storage = getStorage();

/* === HELPER FUNCTIONS === */
function calculateMonthsBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : start;
  
  if (!endDate) return 1;  // If no end date, assume one month
  
  const yearDiff = end.getFullYear() - start.getFullYear();
  const monthDiff = end.getMonth() - start.getMonth();
  
  return yearDiff * 12 + monthDiff + 1;  // Add 1 to include both start and end months
}

function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function calculatePaymentStatus(tanggalPembayaran, jatuhTempo) {
  if (!jatuhTempo) return "Belum Bayar";
  
  const today = new Date();
  const dueDate = new Date(jatuhTempo);
  const paymentDate = tanggalPembayaran ? new Date(tanggalPembayaran) : null;
  
  // If payment is made, always show Lunas
  if (paymentDate) {
    return "Lunas";
  }
  
  // Due date comparison
  if (today < dueDate) {
    // If more than 1 day before due date
    const daysDiff = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    if (daysDiff > 1) {
      return "Aktif";  
    } else {
      return "Tenggang"; // 1 day before due
    }
  } else {
    return "Belum Bayar"; // After due date
  }
}

/* === INISIALISASI DATABASE KAMAR === */
async function initializeKamarDatabase() {
  const blocks = { A: 9, B: 6, C: 6, D: 10 };
  
  for (const [blok, jumlah] of Object.entries(blocks)) {
    for (let i = 1; i <= jumlah; i++) {
      const kamarId = `${blok}${i}`;
      const kamarRef = doc(db, "kamar", kamarId);
      
      try {
        const kamarDoc = await getDoc(kamarRef);
        if (!kamarDoc.exists()) {
          await setDoc(kamarRef, {
            namaKamar: kamarId,
            namaPenghuni: "",
            kontak: "",
            status: "Kosong",
            ktpUrl: "",
            createdAt: new Date().toISOString(),
          });
          console.log(`Kamar ${kamarId} berhasil dibuat`);
        }
      } catch (err) {
        console.error(`Error creating kamar ${kamarId}:`, err);
      }
    }
  }
}

/* === DASHBOARD UTAMA === */
export function renderDashboard(user) {
  const html = `
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Top Navigation Bar -->
    <nav class="bg-white dark:bg-gray-800 shadow-md px-6 py-4">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-blue-600 dark:text-blue-400">KPBY Admin</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Kost Putri Bunda Yulia</p>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-gray-600 dark:text-gray-300">
            <i data-lucide="user" class="w-4 h-4 inline-block mr-1"></i>
            ${user.email}
          </span>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="container mx-auto px-4 py-6">
      <!-- Statistics Cards -->
      ${renderStatistikTable()}
      
      <!-- Tab Navigation -->
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 mt-6">
        <div class="flex gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
          <button class="tab-btn active px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors" data-tab="penghuni">
            <i data-lucide="users" class="w-4 h-4 inline-block mr-1"></i>
            Data Penghuni
          </button>
          <button class="tab-btn px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors" data-tab="pembayaran">
            <i data-lucide="credit-card" class="w-4 h-4 inline-block mr-1"></i>
            Data Pembayaran
          </button>
        </div>

        <!-- Tab Content -->
        <div id="tab-content" class="mt-4">
          ${renderPenghuniTable()}
        </div>
      </div>
    </main>
  </div>`;

  (async () => {
    await initializeKamarDatabase();
    await Promise.all([
      loadPenghuniData(),
      loadStatistik()
    ]);
    // Create icons only once after all data is loaded
    lucide.createIcons();
  })();
  return html;
}

/* === TEMPLATE DATA PENGHUNI === */
function renderPenghuniTable() {
  return `
  <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Daftar Penghuni</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Kelola data penghuni kost</p>
        </div>
        <div class="flex flex-wrap items-center gap-3">
          <div class="relative">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center">
              <i data-lucide="search" class="h-4 w-4 text-gray-400"></i>
            </span>
            <input type="text" id="searchPenghuni" placeholder="Cari penghuni..." 
              class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-sm w-full md:w-64">
          </div>
          <select id="filterStatus" class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-sm">
            <option value="">Semua Status</option>
            <option value="Terisi">Terisi</option>
            <option value="Kosong">Kosong</option>
          </select>
        </div>
      </div>
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="group px-6 py-3 text-left">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No. Kamar</span>
                <i data-lucide="chevrons-up-down" class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
            </th>
            <th class="group px-6 py-3 text-left">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama Penghuni</span>
                <i data-lucide="chevrons-up-down" class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Alamat</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Kontak</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">KTP</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nominal/Bulan</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody id="penghuniTableBody" class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr><td colspan="8" class="text-center py-4 text-gray-500">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

/* === LOAD DATA PENGHUNI DARI FIRESTORE === */
async function loadPenghuniData() {
  const tbody = document.getElementById("penghuniTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="10" class="text-center py-3 text-gray-500">Memuat data...</td></tr>`;

  try {
    const snapshot = await getDocs(collection(db, "kamar"));
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center py-3 text-gray-400">Belum ada data kamar.</td></tr>`;
      return;
    }

    // Urutkan berdasarkan nama kamar
    const kamarList = [];
    snapshot.forEach((docSnap) => {
      kamarList.push({ id: docSnap.id, ...docSnap.data() });
    });
    
    kamarList.sort((a, b) => {
      const aNum = a.namaKamar.match(/\d+/);
      const bNum = b.namaKamar.match(/\d+/);
      const aLetter = a.namaKamar.match(/[A-Z]/i);
      const bLetter = b.namaKamar.match(/[A-Z]/i);
      
      if (aLetter && bLetter && aLetter[0] !== bLetter[0]) {
        return aLetter[0].localeCompare(bLetter[0]);
      }
      return parseInt(aNum) - parseInt(bNum);
    });

    let rows = "";
    kamarList.forEach((data) => {
      const statusClass = data.status === "Terisi" ? "text-green-600" : "text-gray-500";
      const ktpButton = data.ktpUrl 
        ? `<a href="${data.ktpUrl}" target="_blank" class="text-blue-600 hover:underline text-xs">Lihat</a>`
        : `<span class="text-gray-400 text-xs">-</span>`;
      
      rows += `
        <tr data-status="${data.status}">
          <td class="px-4 py-2 font-semibold">${data.namaKamar}</td>
          <td class="px-4 py-2">${data.namaPenghuni || "-"}</td>
          <td class="px-4 py-2">${data.statusPenghuni || "-"}</td>
          <td class="px-4 py-2">${data.alamatAsal || "-"}</td>
          <td class="px-4 py-2">${data.kontak || "-"}</td>
          <td class="px-4 py-2 ${statusClass} font-semibold">${data.status}</td>
          <td class="px-4 py-2">${ktpButton}</td>
          <td class="px-4 py-2">${data.nominalPerBulan ? `Rp ${parseInt(data.nominalPerBulan).toLocaleString('id-ID')}` : '-'}</td>
          <td class="px-4 py-2 text-center">
          <td class="px-4 py-2 text-center">
            <button class="editPenghuniBtn text-blue-600 hover:underline text-sm" data-id="${data.id}">Edit</button>
          </td>
        </tr>`;
    });
    tbody.innerHTML = rows;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-red-500">Gagal memuat data!</td></tr>`;
    console.error(err);
  }
}

/* === TEMPLATE DATA PEMBAYARAN === */
function renderPembayaranTable() {
  return `
  <div class="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200">Data Pembayaran</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Kelola pembayaran penghuni</p>
        </div>
        <div class="relative">
          <span class="absolute inset-y-0 left-0 pl-3 flex items-center">
            <i data-lucide="search" class="h-4 w-4 text-gray-400"></i>
          </span>
          <input type="text" id="searchPembayaran" placeholder="Cari pembayaran..." 
            class="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 text-sm w-full md:w-64">
        </div>
      </div>
    <div class="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
      <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead class="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th class="group px-6 py-3 text-left">
              <div class="flex items-center gap-2">
                <span class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">No. Kamar</span>
                <i data-lucide="chevrons-up-down" class="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"></i>
              </div>
            </th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nama</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Periode</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nominal/Bulan</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Jatuh Tempo</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tanggal Bayar</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
            <th class="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Aksi</th>
          </tr>
        </thead>
        <tbody id="pembayaranTableBody" class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          <tr><td colspan="9" class="text-center py-4 text-gray-500">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

/* === LOAD DATA PEMBAYARAN === */
async function loadPembayaranData() {
  const tbody = document.getElementById("pembayaranTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="9" class="text-center py-3 text-gray-500">Memuat data...</td></tr>`;

  try {
    const snapshot = await getDocs(collection(db, "kamar"));
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-3 text-gray-400">Belum ada data pembayaran.</td></tr>`;
      return;
    }

    let rows = "";
    snapshot.forEach((docSnap) => {
      const k = docSnap.data();
      k.id = docSnap.id;
      
      // Only show payment data for rooms with tenants
      if (k.status === 'Terisi' && k.namaPenghuni) {
        const last = k.lastTagihan || {};
        const tanggalBayar = last.tanggalPembayaran ? new Date(last.tanggalPembayaran).toLocaleDateString('id-ID') : '-';
        const jatuhTempo = last.jatuhTempo ? new Date(last.jatuhTempo).toLocaleDateString('id-ID') : '-';
        
        // Format period display
        const periodDisplay = last.bulanAwal && last.bulanAkhir ? 
          `${new Date(last.bulanAwal).toLocaleDateString('id-ID', {month:'long', year:'numeric'})} - ${new Date(last.bulanAkhir).toLocaleDateString('id-ID', {month:'long', year:'numeric'})}` : 
          'Belum diatur';

        // Calculate status
        const status = last.tanggalPembayaran ? "Lunas" : calculatePaymentStatus(last.tanggalPembayaran, last.jatuhTempo);
        const statusClass = status === 'Lunas' ? 'text-green-600' : (status === 'Belum Bayar' ? 'text-red-600' : 'text-orange-600');
        
        rows += `
          <tr class="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap font-medium text-gray-900 dark:text-gray-100">${k.namaKamar}</td>
            <td class="px-6 py-4 whitespace-nowrap">${k.namaPenghuni || '-'}</td>
            <td class="px-6 py-4">${periodDisplay}</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatCurrency(k.nominalPerBulan || 0)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${formatCurrency(last.totalTagihan || 0)}</td>
            <td class="px-6 py-4 whitespace-nowrap">${jatuhTempo}</td>
            <td class="px-6 py-4 whitespace-nowrap">${tanggalBayar}</td>
            <td class="px-6 py-4 whitespace-nowrap ${statusClass} font-medium">${status}</td>
            <td class="px-6 py-4 text-center">
              <div class="flex justify-center items-center space-x-2">
                ${!last.bulanAwal ? `
                  <button class="editPembayaranBtn inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors" data-kamar="${k.id}">
                    <i data-lucide="calendar-plus" class="w-4 h-4 mr-1"></i>
                    Atur Periode
                  </button>
                ` : `
                  <button class="editPembayaranBtn inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors" data-kamar="${k.id}">
                    <i data-lucide="edit" class="w-4 h-4 mr-1"></i>
                    Edit
                  </button>
                `}
                ${k.kontak ? `
                  <a href="https://wa.me/${k.kontak.replace(/\D/g, '')}" target="_blank" 
                     class="inline-flex items-center px-2 py-1.5 text-green-600 hover:text-green-700" 
                     title="Kirim Reminder WhatsApp">
                    <i data-lucide="message-circle" class="w-4 h-4"></i>
                  </a>
                ` : ''}
                <button class="kuitansiBtn inline-flex items-center px-2 py-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100" title="Cetak Kuitansi" data-kamar="${k.id}">
                  <i data-lucide="receipt" class="w-4 h-4"></i>
                </button>
              </div>
            </td>
          </tr>`;
      }
    });

    tbody.innerHTML = rows || `<tr><td colspan="9" class="text-center py-3 text-gray-400">Belum ada data pembayaran.</td></tr>`;
    lucide.createIcons();
  } catch (err) {
    console.error("Error loading payment data:", err);
    tbody.innerHTML = `<tr><td colspan="9" class="text-center py-3 text-red-500">Gagal memuat data: ${err.message}</td></tr>`;
  }
}

/* === TEMPLATE STATISTIK === */
function renderStatistikTable() {
  return `
  <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Statistik Kost</h3>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4" id="statistikContainer">
      <div class="bg-blue-50 dark:bg-gray-700 p-4 rounded-lg">
        <p class="text-sm text-gray-600 dark:text-gray-300">Total Kamar</p>
        <p class="text-2xl font-bold text-blue-600" id="totalKamar">-</p>
      </div>
      <div class="bg-green-50 dark:bg-gray-700 p-4 rounded-lg">
        <p class="text-sm text-gray-600 dark:text-gray-300">Kamar Terisi</p>
        <p class="text-2xl font-bold text-green-600" id="kamarTerisi">-</p>
      </div>
      <div class="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <p class="text-sm text-gray-600 dark:text-gray-300">Kamar Kosong</p>
        <p class="text-2xl font-bold text-gray-600" id="kamarKosong">-</p>
      </div>
      <div class="bg-orange-50 dark:bg-gray-700 p-4 rounded-lg">
        <p class="text-sm text-gray-600 dark:text-gray-300">Reminder Pembayaran (H-7)</p>
        <p class="text-2xl font-bold text-orange-600" id="reminderPembayaran">-</p>
      </div>
    </div>
  </div>`;
}

/* === LOAD STATISTIK === */
async function loadStatistik() {
  try {
    const snapshot = await getDocs(collection(db, "kamar"));
    const total = snapshot.size;
    let terisi = 0;
    let reminderCount = 0;
    
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.status === "Terisi") terisi++;
      
      // Check for payments due within 7 days
      if (data.lastTagihan && data.lastTagihan.jatuhTempo && data.lastTagihan.statusPembayaran !== 'Lunas') {
        const jatuhTempo = new Date(data.lastTagihan.jatuhTempo);
        if (jatuhTempo >= today && jatuhTempo <= sevenDaysFromNow) {
          reminderCount++;
        }
      }
    });
    
    document.getElementById("totalKamar").textContent = total;
    document.getElementById("kamarTerisi").textContent = terisi;
    document.getElementById("kamarKosong").textContent = total - terisi;
    document.getElementById("reminderPembayaran").textContent = reminderCount;
  } catch (err) {
    console.error("Error loading statistik:", err);
  }
}

/* === TAB NAVIGASI === */
document.addEventListener("click", async (e) => {
  const tabBtns = document.querySelectorAll(".tab-btn");

  if (e.target.closest(".tab-btn")) {
    const tab = e.target.closest(".tab-btn").dataset.tab;
    tabBtns.forEach((btn) => {
      btn.classList.remove("bg-blue-600", "text-white", "active");
      btn.classList.add("bg-gray-200", "dark:bg-gray-700");
    });
    e.target.closest(".tab-btn").classList.remove("bg-gray-200", "dark:bg-gray-700");
    e.target.closest(".tab-btn").classList.add("bg-blue-600", "text-white");

    const content = document.getElementById("tab-content");
    if (tab === "penghuni") {
      content.innerHTML = renderPenghuniTable();
      loadPenghuniData();
    } else if (tab === "pembayaran") {
      content.innerHTML = renderPembayaranTable();
      loadPembayaranData();
    } else if (tab === "statistik") {
      content.innerHTML = renderStatistikTable();
      loadStatistik();
    }
    lucide.createIcons();
  }

  // Edit Penghuni
  if (e.target.classList.contains("editPenghuniBtn")) {
    const id = e.target.dataset.id;
    showModalEditPenghuni(id);
  }

  // Filter Status
  if (e.target.id === "filterStatus") {
    const status = e.target.value;
    const rows = document.querySelectorAll("#penghuniTableBody tr");
    rows.forEach(row => {
      if (!status || row.dataset.status === status) {
        row.style.display = "";
      } else {
        row.style.display = "none";
      }
    });
  }


  // Edit Pembayaran
  if (e.target.classList.contains("editPembayaranBtn")) {
    // If table is now rendered from kamar.lastTagihan we get kamar id from data-kamar
    const kamarId = e.target.dataset.kamar || e.target.dataset.id;
    showModalEditPembayaranFromKamar(kamarId);
  }

  // Reminder WA button (in pembayaran table)
  if (e.target.closest && e.target.closest('.reminderBtn')) {
    const btn = e.target.closest('.reminderBtn');
    const kamarId = btn.dataset.kamar;
    try {
      const kamarDoc = await getDoc(doc(db, 'kamar', kamarId));
      if (!kamarDoc.exists()) return alert('Data kamar tidak ditemukan.');
      
      const kamarData = kamarDoc.data();
      if (!kamarData.kontak) return alert('Kontak tidak tersedia untuk kamar ini.');
      
      // Generate WhatsApp link with custom message
      const reminderLink = generateWhatsAppReminder(kamarData, kamarData.lastTagihan || {});
      window.open(reminderLink, '_blank');
    } catch (err) {
      console.error(err);
      alert('Gagal membuka WhatsApp: ' + err.message);
    }
  }

  // Kuitansi button (generate printable receipt)
  if (e.target.closest && e.target.closest('.kuitansiBtn')) {
    const btn = e.target.closest('.kuitansiBtn');
    const kamarId = btn.dataset.kamar;
    try {
      const kamarDoc = await getDoc(doc(db, 'kamar', kamarId));
      if (!kamarDoc.exists()) return alert('Data kamar tidak ditemukan.');
      const k = kamarDoc.data();
      const t = k.lastTagihan || {};
      showKuitansiWindow(k, t);
    } catch (err) {
      console.error(err);
      alert('Gagal menampilkan kuitansi: ' + err.message);
    }
  }

  // Hapus Pembayaran
  if (e.target.classList.contains("hapusPembayaranBtn")) {
    const id = e.target.dataset.id;
    if (confirm("Yakin ingin menghapus data pembayaran ini?")) {
      try {
        const pembayaranRef = doc(db, "pembayaran", id);
        const pembayaranSnap = await getDoc(pembayaranRef);
        if (pembayaranSnap.exists()) {
          const pembayaranData = pembayaranSnap.data();
          await deleteDoc(pembayaranRef);

          // Jika dokumen kamar masih menunjuk ke tagihan yang dihapus, bersihkan lastTagihan
          try {
            const kamarRef = doc(db, "kamar", pembayaranData.kamar);
            const kamarSnap = await getDoc(kamarRef);
            if (kamarSnap.exists()) {
              const kamarData = kamarSnap.data();
              const last = kamarData.lastTagihan;
              if (last && last.bulan === pembayaranData.bulan && String(last.nominal) === String(pembayaranData.nominal)) {
                await updateDoc(kamarRef, { lastTagihan: null, updatedAt: new Date().toISOString() });
              }
            }
          } catch (err) {
            console.warn('Gagal update kamar setelah hapus pembayaran:', err);
          }

          alert("✅ Data pembayaran berhasil dihapus!");
          loadPembayaranData();
          loadPenghuniData();
        } else {
          alert('Data pembayaran tidak ditemukan.');
        }
      } catch (err) {
        console.error(err);
        alert('Gagal menghapus data pembayaran: ' + err.message);
      }
    }
  }
});

/* === MODAL EDIT PENGHUNI === */
async function showModalEditPenghuni(kamarId) {
  try {
    const kamarDoc = await getDoc(doc(db, "kamar", kamarId));
    if (!kamarDoc.exists()) {
      alert("Data kamar tidak ditemukan!");
      return;
    }

    const data = kamarDoc.data();
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex justify-center items-center";
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg max-w-md w-full relative max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-semibold mb-4">Edit Data Kamar ${data.namaKamar}</h3>
        <form id="formEditPenghuni" class="space-y-3">
          <div>
            <label class="block text-sm font-medium mb-1">No. Kamar</label>
            <input type="text" value="${data.namaKamar}" disabled class="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nama Penghuni</label>
            <input type="text" id="namaPenghuni" value="${data.namaPenghuni || ''}" placeholder="Nama Lengkap" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Kontak (WA/HP)</label>
            <input type="text" id="kontakPenghuni" value="${data.kontak || ''}" placeholder="08xx-xxxx-xxxx" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Nominal Pembayaran per Bulan</label>
            <input type="number" id="nominalPerBulan" value="${data.nominalPerBulan || ''}" placeholder="Rp 0" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          </div>
          <div>
            <!-- status set automatically: Terisi when name present, Kosong when empty -->
          </div>
              <div>
                <label class="block text-sm font-medium mb-1">Status Penghuni</label>
                <select id="statusPenghuni" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
                  <option value="" ${!data.statusPenghuni ? 'selected' : ''}>Pilih Status</option>
                  <option value="Mahasiswa" ${data.statusPenghuni === 'Mahasiswa' ? 'selected' : ''}>Mahasiswa</option>
                  <option value="Bekerja" ${data.statusPenghuni === 'Bekerja' ? 'selected' : ''}>Bekerja</option>
                  <option value="Freelancer" ${data.statusPenghuni === 'Freelancer' ? 'selected' : ''}>Freelancer</option>
                  <option value="Wirausaha" ${data.statusPenghuni === 'Wirausaha' ? 'selected' : ''}>Wirausaha</option>
                  <option value="Lainnya" ${data.statusPenghuni === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">Alamat Asal</label>
                <input type="text" id="alamatAsal" value="${data.alamatAsal || ''}" placeholder="Kota / Alamat asal" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
              </div>
          <div>
            <label class="block text-sm font-medium mb-1">Upload KTP (jpg, png, pdf - max 2MB)</label>
            <input type="file" id="ktpFile" accept="image/*,application/pdf" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
            ${data.ktpUrl ? `<p class="text-xs text-gray-500 mt-1">File saat ini: <a href="${data.ktpUrl}" target="_blank" class="text-blue-600">Lihat KTP</a></p>` : ''}
          </div>
          <div class="flex gap-2">
            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2">Simpan Perubahan</button>
            <button type="button" id="kosongkanKamarBtn" class="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2">Kosongkan Kamar</button>
          </div>
        </form>
        <button id="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-red-500">
          <i data-lucide="x"></i>
        </button>
      </div>`;
    document.body.appendChild(modal);
    lucide.createIcons();

    modal.querySelector("#closeModal").onclick = () => modal.remove();

    // Kosongkan Kamar button handler
    modal.querySelector("#kosongkanKamarBtn").onclick = async () => {
      if (confirm("Yakin ingin mengosongkan kamar ini? Semua data penghuni akan dihapus.")) {
        try {
          await updateDoc(doc(db, "kamar", kamarId), {
            namaPenghuni: "",
            kontak: "",
            status: "Kosong",
            statusPenghuni: null,
            alamatAsal: null,
            ktpUrl: "",
            lastTagihan: null,
            updatedAt: new Date().toISOString(),
          });

          alert("✅ Kamar berhasil dikosongkan!");
          modal.remove();
          loadPenghuniData();
          loadPembayaranData();
        } catch (err) {
          alert("❌ Gagal mengosongkan kamar: " + err.message);
          console.error(err);
        }
      }
    };

    modal.querySelector("#formEditPenghuni").onsubmit = async (e) => {
      e.preventDefault();
      
  const nama = document.getElementById("namaPenghuni").value.trim();
  const kontak = document.getElementById("kontakPenghuni").value.trim();
  const nominal = document.getElementById("nominalPerBulan").value;
  // occupancy status is automatic: Terisi if there's a name, otherwise Kosong
  const status = nama ? "Terisi" : "Kosong";
  const statusPenghuniVal = document.getElementById("statusPenghuni").value.trim();
  const alamatAsalVal = document.getElementById("alamatAsal").value.trim();
      const ktpFile = document.getElementById("ktpFile").files[0];

      try {
        let ktpUrl = data.ktpUrl;

        // Upload KTP jika ada file baru
        if (ktpFile) {
          if (ktpFile.size > 2 * 1024 * 1024) {
            alert("❌ Ukuran file maksimal 2MB!");
            return;
          }
          try {
            // upload to Apps Script (Drive) and get url
            ktpUrl = await uploadKTPToAppsScript(ktpFile, kamarId, nama);
          } catch (err) {
            console.error("Apps Script upload error:", err);
            alert("❌ Gagal upload KTP ke Apps Script: " + err.message);
            return;
          }
        }

        await updateDoc(doc(db, "kamar", kamarId), {
          namaPenghuni: nama,
          kontak: kontak,
          status: status,
          statusPenghuni: statusPenghuniVal || null,
          alamatAsal: alamatAsalVal || null,
          ktpUrl: ktpUrl,
          nominalPerBulan: nominal ? parseInt(nominal) : null,
          updatedAt: new Date().toISOString(),
        });

        alert("✅ Data kamar berhasil diperbarui!");
        modal.remove();
        loadPenghuniData();
      } catch (err) {
        alert("❌ Gagal menyimpan data: " + err.message);
        console.error(err);
      }
    };
  } catch (err) {
    alert("Error: " + err.message);
  }
}

/* === MODAL TAMBAH PEMBAYARAN === */
async function showModalTambahPembayaran() {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex justify-center items-center";
  modal.innerHTML = `
    <div class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg max-w-md w-full relative">
      <h3 class="text-lg font-semibold mb-4">Tambah Data Pembayaran</h3>
      <form id="formTambahPembayaran" class="space-y-3">
        <select id="kamarPembayaran" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          <option value="">Pilih Kamar</option>
          ${await generateKamarTerisiOptions()}
        </select>
        <input type="text" id="namaPembayaran" placeholder="Nama Penghuni" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Bulan Awal</label>
            <input type="month" id="bulanAwal" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Bulan Akhir</label>
            <input type="month" id="bulanAkhir" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs text-gray-600 mb-1">Tanggal Pembayaran (opsional)</label>
            <input type="date" id="tanggalPembayaran" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          </div>
          <div>
            <label class="block text-xs text-gray-600 mb-1">Jatuh Tempo</label>
            <input type="date" id="jatuhTempo" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          </div>
        </div>
        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2">Simpan</button>
      </form>
      <button id="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-red-500">
        <i data-lucide="x"></i>
      </button>
    </div>`;
  document.body.appendChild(modal);
  lucide.createIcons();

  modal.querySelector("#closeModal").onclick = () => modal.remove();

  // Auto-fill nama saat pilih kamar
  modal.querySelector("#kamarPembayaran").onchange = async (e) => {
    const kamarId = e.target.value;
    if (kamarId) {
      const kamarDoc = await getDoc(doc(db, "kamar", kamarId));
      if (kamarDoc.exists()) {
        document.getElementById("namaPembayaran").value = kamarDoc.data().namaPenghuni || "";
      }
    }
  };

  modal.querySelector("#formTambahPembayaran").onsubmit = async (e) => {
    e.preventDefault();
    
    const kamar = document.getElementById("kamarPembayaran").value;
    const nama = document.getElementById("namaPembayaran").value.trim();
    const bulan = document.getElementById("bulanPembayaran").value;
    const nominal = document.getElementById("nominalPembayaran").value;
    const tanggalBayarVal = document.getElementById("tanggalPembayaran").value;
    const jatuhTempoVal = document.getElementById("jatuhTempo").value;
    const status = document.getElementById("statusPembayaran").value;

    try {
      const tanggalPembayaranISO = tanggalBayarVal ? new Date(tanggalBayarVal).toISOString() : (status === 'Lunas' ? new Date().toISOString() : null);
      const jatuhTempoISO = jatuhTempoVal ? new Date(jatuhTempoVal).toISOString() : null;

      await addDoc(collection(db, "pembayaran"), {
        kamar,
        namaPenghuni: nama,
        bulan,
        nominal,
        statusPembayaran: status,
        tanggalPembayaran: tanggalPembayaranISO,
        jatuhTempo: jatuhTempoISO,
        createdAt: new Date().toISOString(),
      });

      // Update lastTagihan di dokumen kamar agar data penghuni langsung menyertakan tagihan
      try {
        await updateDoc(doc(db, "kamar", kamar), {
          lastTagihan: {
            bulan,
            nominal,
            statusPembayaran: status,
            tanggalPembayaran: tanggalPembayaranISO,
            jatuhTempo: jatuhTempoISO,
          },
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Gagal update lastTagihan di kamar:', err);
      }

      alert("✅ Data pembayaran berhasil ditambahkan!");
      modal.remove();
      loadPembayaranData();
      loadPenghuniData();
    } catch (err) {
      alert("❌ Gagal menyimpan data: " + err.message);
    }
  };
}

/* === MODAL EDIT PEMBAYARAN === */
async function showModalEditPembayaran(pembayaranId) {
  try {
    const pembayaranDoc = await getDoc(doc(db, "pembayaran", pembayaranId));
    if (!pembayaranDoc.exists()) {
      alert("Data pembayaran tidak ditemukan!");
      return;
    }

    const data = pembayaranDoc.data();
    const modal = document.createElement("div");
    modal.className = "fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex justify-center items-center";
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg max-w-md w-full relative">
        <h3 class="text-lg font-semibold mb-4">Tambah Data Pembayaran</h3>
        <form id="formEditPembayaran" class="space-y-3">
            <input type="text" value="${data.kamar}" disabled class="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800">
            <input type="text" id="namaPembayaran" value="${data.namaPenghuni}" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
            <input type="month" id="bulanPembayaran" value="${data.bulan}" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
            <input type="number" id="nominalPembayaran" value="${data.nominal}" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs text-gray-600 mb-1">Tanggal Pembayaran (opsional)</label>
                <input type="date" id="tanggalPembayaran" value="${data.tanggalPembayaran ? data.tanggalPembayaran.split('T')[0] : ''}" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
              </div>
              <div>
                <label class="block text-xs text-gray-600 mb-1">Jatuh Tempo</label>
                <input type="date" id="jatuhTempo" value="${data.jatuhTempo ? data.jatuhTempo.split('T')[0] : ''}" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
              </div>
            </div>
            <select id="statusPembayaran" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
              <option value="Belum Lunas" ${data.statusPembayaran === "Belum Lunas" ? "selected" : ""}>Belum Lunas</option>
              <option value="Lunas" ${data.statusPembayaran === "Lunas" ? "selected" : ""}>Lunas</option>
            </select>
          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2">Simpan Perubahan</button>
        </form>
        <button id="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-red-500">
          <i data-lucide="x"></i>
        </button>
      </div>`;
    document.body.appendChild(modal);
    lucide.createIcons();

    modal.querySelector("#closeModal").onclick = () => modal.remove();

    modal.querySelector("#formEditPembayaran").onsubmit = async (e) => {
      e.preventDefault();
      
      const nama = document.getElementById("namaPembayaran").value.trim();
      const bulan = document.getElementById("bulanPembayaran").value;
      const nominal = document.getElementById("nominalPembayaran").value;
      const tanggalBayarVal = document.getElementById("tanggalPembayaran").value;
      const jatuhTempoVal = document.getElementById("jatuhTempo").value;
      const status = document.getElementById("statusPembayaran").value;

      try {
        const tanggalPembayaranISO = tanggalBayarVal ? new Date(tanggalBayarVal).toISOString() : (status === 'Lunas' ? new Date().toISOString() : null);
        const jatuhTempoISO = jatuhTempoVal ? new Date(jatuhTempoVal).toISOString() : null;

        await updateDoc(doc(db, "pembayaran", pembayaranId), {
          namaPenghuni: nama,
          bulan,
          nominal,
          statusPembayaran: status,
          tanggalPembayaran: tanggalPembayaranISO,
          jatuhTempo: jatuhTempoISO,
          updatedAt: new Date().toISOString(),
        });

        // Update lastTagihan di dokumen kamar
        try {
          await updateDoc(doc(db, "kamar", data.kamar), {
            lastTagihan: {
              bulan,
              nominal,
              statusPembayaran: status,
              tanggalPembayaran: tanggalPembayaranISO,
              jatuhTempo: jatuhTempoISO,
            },
            updatedAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Gagal update lastTagihan di kamar saat edit pembayaran:', err);
        }

        alert("✅ Data pembayaran berhasil diperbarui!");
        modal.remove();
        loadPembayaranData();
        loadPenghuniData();
      } catch (err) {
        alert("❌ Gagal menyimpan data: " + err.message);
      }
    };
  } catch (err) {
    alert("Error: " + err.message);
  }
}

/* === GENERATE OPTIONS KAMAR TERISI === */
async function generateKamarTerisiOptions() {
  try {
    const snapshot = await getDocs(collection(db, "kamar"));
    let options = "";
    const kamarList = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.status === "Terisi" && data.namaPenghuni) {
        kamarList.push(data);
      }
    });
    
    // Sort kamar
    kamarList.sort((a, b) => {
      const aNum = a.namaKamar.match(/\d+/);
      const bNum = b.namaKamar.match(/\d+/);
      const aLetter = a.namaKamar.match(/[A-Z]/i);
      const bLetter = b.namaKamar.match(/[A-Z]/i);
      
      if (aLetter && bLetter && aLetter[0] !== bLetter[0]) {
        return aLetter[0].localeCompare(bLetter[0]);
      }
      return parseInt(aNum) - parseInt(bNum);
    });
    
    kamarList.forEach((data) => {
      options += `<option value="${data.namaKamar}">${data.namaKamar} - ${data.namaPenghuni}</option>`;
    });
    
    return options || '<option value="">Tidak ada kamar terisi</option>';
  } catch (err) {
    console.error("Error loading kamar:", err);
    return '<option value="">Error memuat data</option>';
  }
}

// New: Edit pembayaran based on kamar.lastTagihan (only allow editing status, tanggal pembayaran, dan jatuh tempo)
async function showModalEditPembayaranFromKamar(kamarId) {
  try {
    const kamarDoc = await getDoc(doc(db, "kamar", kamarId));
    if (!kamarDoc.exists()) {
      alert('Data kamar tidak ditemukan');
      return;
    }
    const k = kamarDoc.data();
    const last = k.lastTagihan || {};

    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-[999] bg-black/40 backdrop-blur-sm flex justify-center items-center';
    modal.innerHTML = `
      <div class="bg-white dark:bg-gray-900 rounded-xl p-6 shadow-lg max-w-md w-full relative">
        <h3 class="text-lg font-semibold mb-4">Edit Pembayaran - ${k.namaKamar}</h3>
        <form id="formEditPembayaranFromKamar" class="space-y-3">
          <div>
            <label class="block text-sm text-gray-600 mb-1">No. Kamar</label>
            <input type="text" value="${k.namaKamar}" disabled class="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Nama Penghuni</label>
            <input type="text" value="${k.namaPenghuni || ''}" disabled class="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800">
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Nominal per Bulan</label>
            <input type="text" value="Rp ${k.nominalPerBulan ? parseInt(k.nominalPerBulan).toLocaleString('id-ID') : '0'}" disabled class="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800">
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Bulan Awal</label>
              <input type="month" id="bulanAwal_edit" value="${last.bulanAwal || ''}" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Bulan Akhir (opsional)</label>
              <input type="month" id="bulanAkhir_edit" value="${last.bulanAkhir || ''}" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-xs text-gray-600 mb-1">Tanggal Pembayaran</label>
              <input type="date" id="tanggalPembayaran_edit" value="${last.tanggalPembayaran ? last.tanggalPembayaran.split('T')[0] : ''}" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
            </div>
            <div>
              <label class="block text-xs text-gray-600 mb-1">Jatuh Tempo</label>
              <input type="date" id="jatuhTempo_edit" value="${last.jatuhTempo ? last.jatuhTempo.split('T')[0] : ''}" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
            </div>
          </div>
          <div>
            <label class="block text-sm text-gray-600 mb-1">Total Tagihan</label>
            <div id="totalTagihan" class="font-bold text-lg text-blue-600">Rp 0</div>
          </div>
          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2">Simpan Perubahan</button>
        </form>
        <button id="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-red-500">
          <i data-lucide="x"></i>
        </button>
      </div>`;
    document.body.appendChild(modal);
    lucide.createIcons();

    modal.querySelector('#closeModal').onclick = () => modal.remove();

    // Add event listeners for month inputs to calculate total
    const calculateTotal = () => {
      const bulanAwal = document.getElementById('bulanAwal_edit').value;
      const bulanAkhir = document.getElementById('bulanAkhir_edit').value;
      const totalElement = document.getElementById('totalTagihan');
      
      if (bulanAwal && k.nominalPerBulan) {
        const months = calculateMonthsBetween(bulanAwal, bulanAkhir || null);
        const total = months * parseInt(k.nominalPerBulan);
        totalElement.textContent = `Rp ${total.toLocaleString('id-ID')}`;
      } else {
        totalElement.textContent = `Rp 0`;
      }
    };

    document.getElementById('bulanAwal_edit').addEventListener('change', calculateTotal);
    document.getElementById('bulanAkhir_edit').addEventListener('change', calculateTotal);

    modal.querySelector('#formEditPembayaranFromKamar').onsubmit = async (e) => {
      e.preventDefault();
      const tanggalBayarVal = document.getElementById('tanggalPembayaran_edit').value;
      const jatuhTempoVal = document.getElementById('jatuhTempo_edit').value;
      const bulanAwalVal = document.getElementById('bulanAwal_edit').value;
      const bulanAkhirVal = document.getElementById('bulanAkhir_edit').value;

      try {
        if (!bulanAwalVal) {
          alert('❌ Mohon pilih bulan awal pembayaran!');
          return;
        }

        // Calculate months (bulanAkhir optional)
        const months = calculateMonthsBetween(bulanAwalVal, bulanAkhirVal || null);
        const totalNominal = months * (k.nominalPerBulan ? parseInt(k.nominalPerBulan) : 0);
        const tanggalPembayaranISO = tanggalBayarVal ? new Date(tanggalBayarVal).toISOString() : null;
        const jatuhTempoISO = jatuhTempoVal ? new Date(jatuhTempoVal).toISOString() : null;
        
        // Calculate status automatically: if there's a payment date -> Lunas, else derive from due date
        const status = tanggalPembayaranISO ? 'Lunas' : calculatePaymentStatus(null, jatuhTempoISO);

        // Update kamar.lastTagihan with new structure (bulanAkhir defaults to bulanAwal)
        await updateDoc(doc(db, 'kamar', kamarId), {
          lastTagihan: {
            bulanAwal: bulanAwalVal,
            bulanAkhir: bulanAkhirVal || bulanAwalVal,
            nominal: k.nominalPerBulan,
            totalTagihan: totalNominal,
            statusPembayaran: status,
            tanggalPembayaran: tanggalPembayaranISO,
            jatuhTempo: jatuhTempoISO,
          },
          updatedAt: new Date().toISOString(),
        });

        // Also update any pembayaran doc that matches kamar & bulan (optional)
        try {
          const q = await getDocs(collection(db, 'pembayaran'));
          q.forEach(async (pDoc) => {
            const pd = pDoc.data();
            if (pd.kamar === kamarId && pd.bulan === last.bulan) {
              await updateDoc(doc(db, 'pembayaran', pDoc.id), {
                statusPembayaran: status,
                tanggalPembayaran: tanggalPembayaranISO,
                jatuhTempo: jatuhTempoISO,
                updatedAt: new Date().toISOString(),
              });
            }
          });
        } catch (err) {
          console.warn('Gagal sinkron update ke koleksi pembayaran:', err);
        }

        alert('✅ Pembayaran berhasil diperbarui!');
        modal.remove();
        loadPembayaranData();
        loadPenghuniData();
      } catch (err) {
        alert('❌ Gagal menyimpan perubahan: ' + err.message);
      }
    };
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

