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

const db = getFirestore();
const storage = getStorage();

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
  <section class="p-6 animate-fadeIn">
    <h2 class="text-3xl font-semibold text-blue-600 mb-4">Dashboard Admin</h2>
    <p class="text-gray-700 dark:text-gray-300 mb-6">Halo, <b>${user.email}</b> 👋</p>

    <div class="flex gap-2 mb-6 flex-wrap">
      <button class="tab-btn active px-4 py-2 rounded-lg bg-blue-600 text-white" data-tab="penghuni">Data Penghuni</button>
      <button class="tab-btn px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700" data-tab="pembayaran">Data Pembayaran</button>
      <button class="tab-btn px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700" data-tab="statistik">Statistik</button>
    </div>

    <div id="tab-content" class="mt-4">
      ${renderPenghuniTable()}
    </div>
  </section>`;

  setTimeout(() => {
    initializeKamarDatabase();
    loadPenghuniData();
  }, 300);
  return html;
}

/* === TEMPLATE DATA PENGHUNI === */
function renderPenghuniTable() {
  return `
  <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Daftar Penghuni (31 Kamar)</h3>
      <div class="flex gap-2">
        <select id="filterStatus" class="px-3 py-1.5 rounded-lg border dark:bg-gray-700 text-sm">
          <option value="">Semua Status</option>
          <option value="Terisi">Terisi</option>
          <option value="Kosong">Kosong</option>
        </select>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full border rounded-lg overflow-hidden">
        <thead class="bg-blue-50 dark:bg-gray-800">
          <tr>
            <th class="px-4 py-2 text-left">No. Kamar</th>
            <th class="px-4 py-2 text-left">Nama Penghuni</th>
            <th class="px-4 py-2 text-left">Kontak</th>
            <th class="px-4 py-2 text-left">Status</th>
            <th class="px-4 py-2 text-left">KTP</th>
            <th class="px-4 py-2 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody id="penghuniTableBody" class="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <tr><td colspan="6" class="text-center py-3 text-gray-500">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

/* === LOAD DATA PENGHUNI DARI FIRESTORE === */
async function loadPenghuniData() {
  const tbody = document.getElementById("penghuniTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-gray-500">Memuat data...</td></tr>`;

  try {
    const snapshot = await getDocs(collection(db, "kamar"));
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-gray-400">Belum ada data kamar.</td></tr>`;
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
          <td class="px-4 py-2">${data.kontak || "-"}</td>
          <td class="px-4 py-2 ${statusClass} font-semibold">${data.status}</td>
          <td class="px-4 py-2">${ktpButton}</td>
          <td class="px-4 py-2 text-center">
            <button class="editPenghuniBtn text-blue-600 hover:underline text-sm" data-id="${data.id}">Edit</button>
          </td>
        </tr>`;
    });
    tbody.innerHTML = rows;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500">Gagal memuat data!</td></tr>`;
    console.error(err);
  }
}

/* === TEMPLATE DATA PEMBAYARAN === */
function renderPembayaranTable() {
  return `
  <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
    <div class="flex justify-between items-center mb-4">
      <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200">Data Pembayaran</h3>
      <button id="addPembayaranBtn" class="bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-2">
        <i data-lucide="plus"></i> Tambah Pembayaran
      </button>
    </div>
    <div class="overflow-x-auto">
      <table class="min-w-full border rounded-lg overflow-hidden">
        <thead class="bg-blue-50 dark:bg-gray-800">
          <tr>
            <th class="px-4 py-2 text-left">Kamar</th>
            <th class="px-4 py-2 text-left">Nama</th>
            <th class="px-4 py-2 text-left">Bulan</th>
            <th class="px-4 py-2 text-left">Nominal</th>
            <th class="px-4 py-2 text-left">Status</th>
            <th class="px-4 py-2 text-center">Aksi</th>
          </tr>
        </thead>
        <tbody id="pembayaranTableBody" class="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <tr><td colspan="6" class="text-center py-3 text-gray-500">Memuat data...</td></tr>
        </tbody>
      </table>
    </div>
  </div>`;
}

/* === LOAD DATA PEMBAYARAN === */
async function loadPembayaranData() {
  const tbody = document.getElementById("pembayaranTableBody");
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-gray-500">Memuat data...</td></tr>`;

  try {
    const snapshot = await getDocs(collection(db, "pembayaran"));
    if (snapshot.empty) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-3 text-gray-400">Belum ada data pembayaran.</td></tr>`;
      return;
    }

    let rows = "";
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const statusClass = data.statusPembayaran === "Lunas" ? "text-green-600" : "text-red-600";
      
      rows += `
        <tr>
          <td class="px-4 py-2 font-semibold">${data.kamar}</td>
          <td class="px-4 py-2">${data.namaPenghuni}</td>
          <td class="px-4 py-2">${data.bulan}</td>
          <td class="px-4 py-2">Rp ${parseInt(data.nominal).toLocaleString('id-ID')}</td>
          <td class="px-4 py-2 ${statusClass} font-semibold">${data.statusPembayaran}</td>
          <td class="px-4 py-2 text-center">
            <button class="editPembayaranBtn text-blue-600 hover:underline" data-id="${docSnap.id}">Edit</button>
            <button class="hapusPembayaranBtn text-red-600 hover:underline" data-id="${docSnap.id}">Hapus</button>
          </td>
        </tr>`;
    });
    tbody.innerHTML = rows;
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-red-500">Gagal memuat data!</td></tr>`;
    console.error(err);
  }
}

/* === TEMPLATE STATISTIK === */
function renderStatistikTable() {
  return `
  <div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
    <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">Statistik Kost</h3>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4" id="statistikContainer">
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
    </div>
  </div>`;
}

/* === LOAD STATISTIK === */
async function loadStatistik() {
  try {
    const snapshot = await getDocs(collection(db, "kamar"));
    const total = snapshot.size;
    let terisi = 0;
    
    snapshot.forEach((doc) => {
      if (doc.data().status === "Terisi") terisi++;
    });
    
    document.getElementById("totalKamar").textContent = total;
    document.getElementById("kamarTerisi").textContent = terisi;
    document.getElementById("kamarKosong").textContent = total - terisi;
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
      setTimeout(loadPenghuniData, 300);
    } else if (tab === "pembayaran") {
      content.innerHTML = renderPembayaranTable();
      setTimeout(loadPembayaranData, 300);
    } else if (tab === "statistik") {
      content.innerHTML = renderStatistikTable();
      setTimeout(loadStatistik, 300);
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

  // Tambah Pembayaran
  if (e.target.id === "addPembayaranBtn" || e.target.closest("#addPembayaranBtn")) {
    showModalTambahPembayaran();
  }

  // Edit Pembayaran
  if (e.target.classList.contains("editPembayaranBtn")) {
    const id = e.target.dataset.id;
    showModalEditPembayaran(id);
  }

  // Hapus Pembayaran
  if (e.target.classList.contains("hapusPembayaranBtn")) {
    const id = e.target.dataset.id;
    if (confirm("Yakin ingin menghapus data pembayaran ini?")) {
      await deleteDoc(doc(db, "pembayaran", id));
      alert("✅ Data pembayaran berhasil dihapus!");
      loadPembayaranData();
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
            <label class="block text-sm font-medium mb-1">Status</label>
            <select id="statusKamar" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
              <option value="Kosong" ${data.status === "Kosong" ? "selected" : ""}>Kosong</option>
              <option value="Terisi" ${data.status === "Terisi" ? "selected" : ""}>Terisi</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Upload KTP (jpg, png, pdf - max 2MB)</label>
            <input type="file" id="ktpFile" accept="image/*,application/pdf" class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
            ${data.ktpUrl ? `<p class="text-xs text-gray-500 mt-1">File saat ini: <a href="${data.ktpUrl}" target="_blank" class="text-blue-600">Lihat KTP</a></p>` : ''}
          </div>
          <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2">Simpan Perubahan</button>
        </form>
        <button id="closeModal" class="absolute top-3 right-3 text-gray-500 hover:text-red-500">
          <i data-lucide="x"></i>
        </button>
      </div>`;
    document.body.appendChild(modal);
    lucide.createIcons();

    modal.querySelector("#closeModal").onclick = () => modal.remove();

    modal.querySelector("#formEditPenghuni").onsubmit = async (e) => {
      e.preventDefault();
      
      const nama = document.getElementById("namaPenghuni").value.trim();
      const kontak = document.getElementById("kontakPenghuni").value.trim();
      const status = document.getElementById("statusKamar").value;
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
            ktpUrl = await uploadKTPToAppsScript(ktpFile, kamarId);
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
          ktpUrl: ktpUrl,
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
        <input type="month" id="bulanPembayaran" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
        <input type="number" id="nominalPembayaran" placeholder="Nominal (Rp)" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
        <select id="statusPembayaran" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          <option value="Belum Lunas">Belum Lunas</option>
          <option value="Lunas">Lunas</option>
        </select>
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
    const status = document.getElementById("statusPembayaran").value;

    try {
      await addDoc(collection(db, "pembayaran"), {
        kamar,
        namaPenghuni: nama,
        bulan,
        nominal,
        statusPembayaran: status,
        createdAt: new Date().toISOString(),
      });

      alert("✅ Data pembayaran berhasil ditambahkan!");
      modal.remove();
      loadPembayaranData();
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
        <h3 class="text-lg font-semibold mb-4">Edit Data Pembayaran</h3>
        <form id="formEditPembayaran" class="space-y-3">
          <input type="text" value="${data.kamar}" disabled class="w-full px-3 py-2 border rounded-lg bg-gray-100 dark:bg-gray-800">
          <input type="text" id="namaPembayaran" value="${data.namaPenghuni}" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          <input type="month" id="bulanPembayaran" value="${data.bulan}" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
          <input type="number" id="nominalPembayaran" value="${data.nominal}" required class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800">
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
      const status = document.getElementById("statusPembayaran").value;

      try {
        await updateDoc(doc(db, "pembayaran", pembayaranId), {
          namaPenghuni: nama,
          bulan,
          nominal,
          statusPembayaran: status,
          updatedAt: new Date().toISOString(),
        });

        alert("✅ Data pembayaran berhasil diperbarui!");
        modal.remove();
        loadPembayaranData();
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