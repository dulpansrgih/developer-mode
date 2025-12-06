// source/main.js

import { db, auth } from "../conf/auth.js"; 
import { 
    collection, 
    addDoc, 
    query, 
    where, 
    orderBy, 
    onSnapshot, 
    deleteDoc, 
    doc,
    getDocs,
    serverTimestamp,
    writeBatch,
    updateDoc
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js";

// --- TAMBAHAN IMPORT UNTUK PROFILE ---
import { 
    updateProfile, 
    sendPasswordResetEmail 
} from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js";

// --- FORMATTER ---
export function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

// ... [BAGIAN GENERAL CRUD HELPER, SUBSCRIBE, DLL TETAP SAMA SEPERTI SEBELUMNYA] ...
// (Agar tidak terlalu panjang, saya persingkat bagian yang tidak berubah. 
//  Pastikan fungsi-fungsi: subscribeToData, getDataOnce, addData, updateData, deleteData, 
//  updateActivityStatus, subscribeToRundowns, subscribeToTransactions, addTransfer, 
//  getTransactionsByDateRange, subscribeToDebtsSummary, subscribeToMonthlyReport 
//  TETAP ADA DI SINI SEPERTI FILE LAMA ANDA).

// -----------------------------------------------------------------------------
// PASTE KODE LAMA ANDA UNTUK FUNGSI CRUD DI SINI (DARI BARIS 15 s/d 290-an)
// ATAU GUNAKAN FILE LAMA, TAPI GANTI BAGIAN "renderProfilePage" DI BAWAH INI
// -----------------------------------------------------------------------------

// --- Subscribe (Read Realtime) ---
export function subscribeToData(collectionName, callback) { const user = auth.currentUser; if (!user) { callback([]); return () => {}; } const q = query(collection(db, collectionName), where("userId", "==", user.uid), orderBy("createdAt", "desc")); return onSnapshot(q, (snapshot) => { const items = []; snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); }); callback(items); }); }
// --- Fetch Once ---
export async function getDataOnce(collectionName) { const user = auth.currentUser; if (!user) return []; const q = query(collection(db, collectionName), where("userId", "==", user.uid), orderBy("createdAt", "desc")); const snapshot = await getDocs(q); const items = []; snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() })); return items; }
// --- Add ---
export async function addData(collectionName, data) { const user = auth.currentUser; if (!user) return false; try { await addDoc(collection(db, collectionName), { ...data, userId: user.uid, createdAt: serverTimestamp() }); return true; } catch (e) { console.error(`Add ${collectionName} Error:`, e); return false; } }
// --- Update ---
export async function updateData(collectionName, id, data) { try { const docRef = doc(db, collectionName, id); Object.keys(data).forEach(key => data[key] === undefined && delete data[key]); await updateDoc(docRef, { ...data, updatedAt: serverTimestamp() }); return true; } catch (e) { console.error(`Update ${collectionName} Error:`, e); return false; } }
// --- Delete ---
export async function deleteData(collectionName, id) { try { await deleteDoc(doc(db, collectionName, id)); return true; } catch (e) { console.error(`Delete ${collectionName} Error:`, e); return false; } }
// --- Update Activity ---
export async function updateActivityStatus(id, isDone) { try { await updateDoc(doc(db, "activities", id), { isDone: isDone }); return true; } catch (e) { console.error("Update Activity Error:", e); return false; } }
// --- Rundown ---
export function subscribeToRundowns(callback) { const user = auth.currentUser; if (!user) { callback([]); return () => {}; } const q = query(collection(db, "rundowns"), where("userId", "==", user.uid), orderBy("date", "desc"), orderBy("time", "asc")); return onSnapshot(q, (snapshot) => { const items = []; snapshot.forEach((doc) => { items.push({ id: doc.id, ...doc.data() }); }); callback(items); }); }
// --- Transactions ---
export function subscribeToTransactions(callback) { const user = auth.currentUser; if (!user) { callback({ groupedData: [], summary: { income: 0, expense: 0, total: 0 }, allItems: [] }); return () => {}; } const q = query(collection(db, "transactions"), where("userId", "==", user.uid), orderBy("date", "desc"), orderBy("createdAt", "desc")); return onSnapshot(q, (snapshot) => { let totalPemasukan = 0; let totalPengeluaran = 0; const transactions = []; snapshot.forEach((doc) => { const data = doc.data(); const id = doc.id; const amount = parseInt(data.amount) || 0; if (data.type === 'pemasukan') totalPemasukan += amount; if (data.type === 'pengeluaran') totalPengeluaran += amount; transactions.push({ id, ...data }); }); const groupedData = groupTransactionsByDate(transactions); callback({ groupedData, allItems: transactions, summary: { income: totalPemasukan, expense: totalPengeluaran, total: totalPemasukan - totalPengeluaran } }); }); }
function groupTransactionsByDate(transactions) { const groups = {}; transactions.forEach(trx => { const dateKey = trx.date; if (!groups[dateKey]) { groups[dateKey] = { date: dateKey, total: 0, items: [] }; } const amountVal = trx.type === 'pengeluaran' ? -parseInt(trx.amount) : parseInt(trx.amount); groups[dateKey].total += amountVal; groups[dateKey].items.push(trx); }); return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date)); }
// --- Report ---
export function subscribeToMonthlyReport(callback) { const user = auth.currentUser; if (!user) { callback([]); return () => {}; } const q = query(collection(db, "transactions"), where("userId", "==", user.uid)); return onSnapshot(q, (snapshot) => { const monthlyData = {}; snapshot.forEach((doc) => { const data = doc.data(); const date = new Date(data.date); const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; if (!monthlyData[monthKey]) { monthlyData[monthKey] = { income: 0, expense: 0, label: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }), key: monthKey }; } const amount = parseInt(data.amount) || 0; if (data.type === 'pemasukan') monthlyData[monthKey].income += amount; if (data.type === 'pengeluaran') monthlyData[monthKey].expense += amount; }); const reportArray = Object.entries(monthlyData).map(([key, val]) => ({ key, ...val })).sort((a, b) => a.key.localeCompare(b.key)); callback(reportArray.slice(-6)); }); }
export function subscribeToFinancialSummary(callback) { const user = auth.currentUser; if (!user) { callback({}); return () => {}; } const qTrx = query(collection(db, "transactions"), where("userId", "==", user.uid)); const unsubTrx = onSnapshot(qTrx, (snapTrx) => { let assets = 0; snapTrx.forEach(d => { const val = parseInt(d.data().amount) || 0; if (d.data().type === 'pemasukan') assets += val; else assets -= val; }); getDocs(query(collection(db, "debts"), where("userId", "==", user.uid))).then(snapDebt => { let liabilities = 0; snapDebt.forEach(d => { if(d.data().type === 'hutang') liabilities += (parseInt(d.data().amount) || 0); }); callback({ netWorth: assets - liabilities, totalAssets: assets, totalLiabilities: liabilities }); }); }); return unsubTrx; }
// --- Transfer ---
export async function addTransfer(data) { const user = auth.currentUser; if (!user) return false; const batch = writeBatch(db); const docRefOut = doc(collection(db, "transactions")); batch.set(docRefOut, { userId: user.uid, amount: data.amount, type: 'pengeluaran', category: 'Transfer Keluar', categoryName: 'Transfer Keluar', accountId: data.fromAccountId, accountName: data.fromAccountName, date: data.date, note: `Transfer ke ${data.toAccountName}`, isTransfer: true, createdAt: serverTimestamp() }); const docRefIn = doc(collection(db, "transactions")); batch.set(docRefIn, { userId: user.uid, amount: data.amount, type: 'pemasukan', category: 'Transfer Masuk', categoryName: 'Transfer Masuk', accountId: data.toAccountId, accountName: data.toAccountName, date: data.date, note: `Terima dari ${data.fromAccountName}`, isTransfer: true, createdAt: serverTimestamp() }); if (data.adminFee > 0) { const docRefFee = doc(collection(db, "transactions")); batch.set(docRefFee, { userId: user.uid, amount: data.adminFee, type: 'pengeluaran', category: 'Biaya Admin', categoryName: 'Biaya Admin', accountId: data.fromAccountId, accountName: data.fromAccountName, date: data.date, note: 'Biaya Transfer', createdAt: serverTimestamp() }); } try { await batch.commit(); return true; } catch (e) { console.error("Transfer Error:", e); return false; } }
// --- Export ---
export async function getTransactionsByDateRange(startDate, endDate) { const user = auth.currentUser; if (!user) return []; const q = query(collection(db, "transactions"), where("userId", "==", user.uid), where("date", ">=", startDate), where("date", "<=", endDate), orderBy("date", "desc")); try { const snapshot = await getDocs(q); const items = []; snapshot.forEach(doc => items.push(doc.data())); return items; } catch (e) { console.error("Query Error (Mungkin butuh Index):", e); return []; } }
// --- Debts ---
export function subscribeToDebtsSummary(callback) { const user = auth.currentUser; if (!user) { callback({ hutang: 0, piutang: 0 }); return () => {}; } const q = query(collection(db, "debts"), where("userId", "==", user.uid)); return onSnapshot(q, (snapshot) => { let hutang = 0; let piutang = 0; snapshot.forEach(doc => { const d = doc.data(); if(d.type === 'hutang') hutang += parseInt(d.amount); else piutang += parseInt(d.amount); }); callback({ hutang, piutang }); }); }

// --- MODAL INFO APLIKASI (GLOBAL) ---
window.renderInfoModal = () => {
    const modal = document.getElementById('modal-container');
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-2xl p-6 m-4 animate-scale-up shadow-2xl relative">
            <button onclick="window.closeModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            <div class="text-center mb-6">
                <div class="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h3 class="text-xl font-bold text-gray-800 dark:text-white">Dulpan App</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">v1.2.0 • Finance & Productivity</p>
            </div>
            <div class="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p>Aplikasi manajemen keuangan pribadi dan produktivitas harian yang simpel dan powerful.</p>
                <div class="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p class="font-bold text-gray-800 dark:text-white mb-1 text-xs">Fitur Utama:</p>
                    <ul class="list-disc list-inside text-[10px] space-y-1 ml-1 text-left">
                        <li>Pencatatan Transaksi & Hutang</li>
                        <li>Laporan & Grafik Realtime</li>
                        <li>Jurnal Aktivitas Harian</li>
                        <li>Mode Gelap (Dark Mode)</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
};

// =======================================================
//          FUNGSI RENDER PROFILE PAGE (UPDATED)
// =======================================================

export function renderProfilePage(container) {
    const user = auth.currentUser;
    if (!user) {
        window.location.hash = '#login';
        return;
    }

    const initials = user.email.charAt(0).toUpperCase();
    const joinDate = user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'}) : '-';
    // Gunakan displayName dari Firebase, atau default 'Admin Keuangan'
    const displayName = user.displayName || 'Admin Keuangan';

    container.innerHTML = `
        <div class="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
            <div class="relative bg-gradient-to-br from-blue-600 to-indigo-700 pt-12 pb-24 px-6 rounded-b-[3rem] shadow-xl text-center">
                
                <div class="relative inline-block mb-4">
                    <div class="w-24 h-24 bg-white p-1 rounded-full shadow-2xl mx-auto">
                        <div class="w-full h-full bg-blue-100 rounded-full flex items-center justify-center text-4xl font-black text-blue-600">
                            ${initials}
                        </div>
                    </div>
                    <div class="absolute bottom-1 right-1 bg-green-500 w-6 h-6 rounded-full border-4 border-white dark:border-gray-800" title="Online"></div>
                </div>

                <h2 id="profile-name-display" class="text-2xl font-bold text-white tracking-tight">${displayName}</h2>
                <p class="text-blue-200 text-sm font-medium mt-1">${user.email}</p>
                
                <div class="mt-4 inline-flex items-center px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white text-xs font-bold">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                    Member Sejak: ${joinDate}
                </div>
            </div>

            <div class="px-6 -mt-12 relative z-10 space-y-4">
                
                <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 flex justify-around">
                    <div class="text-center">
                        <p class="text-xs text-gray-400 font-bold uppercase tracking-wide">Status</p>
                        <p class="text-lg font-bold text-green-500">Aktif</p>
                    </div>
                    <div class="w-px bg-gray-100 dark:bg-gray-700"></div>
                    <div class="text-center">
                        <p class="text-xs text-gray-400 font-bold uppercase tracking-wide">Tipe Akun</p>
                        <p class="text-lg font-bold text-blue-600">PRO</p>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    
                    <div id="profile-edit-btn" class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg></div>
                            <span class="font-bold text-gray-700 dark:text-gray-200">Pengaturan Akun</span>
                        </div>
                        <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                    
                    <div id="profile-security-btn" class="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg></div>
                            <span class="font-bold text-gray-700 dark:text-gray-200">Keamanan</span>
                        </div>
                        <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>

                    <div id="profile-help-btn" class="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <div class="flex items-center gap-4">
                            <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                            <span class="font-bold text-gray-700 dark:text-gray-200">Bantuan & Info</span>
                        </div>
                        <svg class="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </div>
                </div>

                <button id="btn-logout-main" class="w-full py-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 font-extrabold text-sm shadow-sm hover:bg-red-100 transition flex items-center justify-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                    KELUAR DARI APLIKASI
                </button>
                
                <p class="text-center text-[10px] text-gray-400 font-medium pb-4">Dulpan App v1.2.0 build 2025</p>
            </div>
        </div>
    `;

    // --- EVENT LISTENERS ---

    // 1. Tombol Keluar
    document.getElementById('btn-logout-main').onclick = () => {
        if(confirm("Yakin ingin keluar?")) {
            // Import signOut jika belum diimport di atas, tapi seharusnya sudah ada dari 'conf/auth.js'
            // Jika error, pastikan import { signOut } ada di paling atas file ini.
            auth.signOut().catch(e => console.error(e));
        }
    };

    // 2. Tombol Pengaturan Akun (Edit Nama)
    document.getElementById('profile-edit-btn').onclick = () => {
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-t-3xl p-6 animate-slide-up shadow-2xl">
                <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Ubah Nama Profil</h3>
                <form id="form-update-profile" class="space-y-4">
                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-1">NAMA TAMPILAN</label>
                        <input type="text" name="displayName" value="${displayName}" class="w-full p-4 rounded-xl border bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold outline-none" required>
                    </div>
                    <button type="submit" class="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition">Simpan Perubahan</button>
                </form>
            </div>
        `;

        document.getElementById('form-update-profile').onsubmit = async (e) => {
            e.preventDefault();
            const newName = e.target.displayName.value;
            const btn = e.target.querySelector('button');
            btn.innerHTML = "Menyimpan...";
            btn.disabled = true;

            try {
                await updateProfile(auth.currentUser, { displayName: newName });
                document.getElementById('profile-name-display').innerText = newName; // Update UI langsung
                window.closeModal();
                alert("Nama profil berhasil diperbarui!");
            } catch (error) {
                console.error(error);
                alert("Gagal memperbarui profil: " + error.message);
                btn.innerHTML = "Simpan Perubahan";
                btn.disabled = false;
            }
        };
    };

    // 3. Tombol Keamanan (Reset Password)
    document.getElementById('profile-security-btn').onclick = () => {
        if(confirm(`Kirim link reset password ke email ${user.email}?`)) {
            sendPasswordResetEmail(auth, user.email)
                .then(() => alert("Email reset password telah dikirim! Cek inbox/spam Anda."))
                .catch((error) => alert("Gagal mengirim email: " + error.message));
        }
    };

    // 4. Tombol Bantuan & Info
    document.getElementById('profile-help-btn').onclick = () => {
        if(window.renderInfoModal) window.renderInfoModal();
    };
}