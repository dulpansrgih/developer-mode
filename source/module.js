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

// --- GLOBAL FUNCTIONS SETUP ---
export function initGlobalFunctions() {
    window.hapusItem = (col, id) => {
        showConfirmModal("Hapus Data?", "Data yang dihapus tidak dapat dikembalikan.", async () => {
            if(await deleteData(col, id)) { showToast("Data berhasil dihapus"); window.closeModal(); } 
            else { showToast("Gagal menghapus data", "error"); }
        });
    };

    window.closeModal = () => { document.getElementById('modal-container').classList.add('hidden'); };
    window.toggleActivity = async (id, checked) => { await updateActivityStatus(id, checked); };

    // --- MENU FAB ---
    window.openMenuTambah = () => {
        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-6 animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.2)]">
                <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Menu Cepat</h3>
                <div class="space-y-2">
                    <button onclick="window.renderTambahModal()" class="w-full flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition group">
                        <div class="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg></div>
                        <div class="text-left"><p class="font-bold text-gray-800 dark:text-white">Transaksi Baru</p><p class="text-xs text-gray-500">Pemasukan & Pengeluaran</p></div>
                    </button>
                    <button onclick="window.renderTransferModal()" class="w-full flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition group">
                        <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center mr-4"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg></div>
                        <div class="text-left"><p class="font-bold text-gray-800 dark:text-white">Transfer Saldo</p><p class="text-xs text-gray-500">Antar rekening</p></div>
                    </button>
                    <button onclick="window.renderTambahHutangModal()" class="w-full flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-xl transition group">
                        <div class="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mr-4"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg></div>
                        <div class="text-left"><p class="font-bold text-gray-800 dark:text-white">Catat Pendanaan</p><p class="text-xs text-gray-500">Hutang & Piutang</p></div>
                    </button>
                </div>
                <button onclick="window.closeModal()" class="w-full mt-6 py-3 text-gray-500 font-bold hover:text-gray-800 dark:hover:text-white transition">Batal</button>
            </div>`;
        modal.onclick = (e) => { if (e.target === modal) window.closeModal(); };
    };

    // --- FORM PENDANAAN LENGKAP (ADD / EDIT / CICIL) ---
    window.renderTambahHutangModal = async (editItemString = null) => {
        let editItem = null;
        if(editItemString) editItem = JSON.parse(decodeURIComponent(editItemString));

        const modal = document.getElementById('modal-container');
        modal.classList.remove('hidden');
        
        let headerTitle = editItem ? 'Rincian & Pembayaran' : 'Catat Pendanaan Baru';
        let amountValue = editItem ? editItem.totalAmount || editItem.amount : ''; 
        let paidValue = editItem ? editItem.paidAmount || 0 : 0;
        let sisaHutang = editItem ? (parseInt(amountValue) - parseInt(paidValue)) : 0;

        // Default Type berdasarkan view saat ini (jika baru)
        let defaultType = editItem ? editItem.type : (viewState.pendanaanType || 'hutang');

        modal.innerHTML = `
            <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up relative h-[90vh] sm:h-auto overflow-y-auto">
                <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                <button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                <h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white text-center">${headerTitle}</h3>
                
                <form id="form-hutang-modal" class="space-y-4">
                     <div class="grid grid-cols-2 gap-3 mb-2">
                        <label class="cursor-pointer ${editItem ? 'opacity-60 pointer-events-none' : ''}">
                            <input type="radio" name="type" value="hutang" ${(defaultType === 'hutang') ? 'checked' : ''} class="peer sr-only">
                            <div class="py-3 text-center rounded-lg border-2 border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 peer-checked:bg-red-50 dark:peer-checked:bg-red-900/30 peer-checked:border-red-500 peer-checked:text-red-600 font-bold text-sm transition">Saya Berhutang</div>
                        </label>
                        <label class="cursor-pointer ${editItem ? 'opacity-60 pointer-events-none' : ''}">
                            <input type="radio" name="type" value="piutang" ${(defaultType === 'piutang') ? 'checked' : ''} class="peer sr-only">
                            <div class="py-3 text-center rounded-lg border-2 border-transparent bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 peer-checked:bg-green-50 dark:peer-checked:bg-green-900/30 peer-checked:border-green-500 peer-checked:text-green-600 font-bold text-sm transition">Saya Meminjamkan</div>
                        </label>
                    </div>

                    ${editItem ? `
                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl mb-4 border border-blue-100 dark:border-blue-800">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-500 dark:text-gray-400">Total Pinjaman</span>
                            <span class="font-bold text-gray-800 dark:text-white">${formatRupiah(amountValue)}</span>
                        </div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-gray-500 dark:text-gray-400">Sudah Dibayar</span>
                            <span class="font-bold text-green-600">${formatRupiah(paidValue)}</span>
                        </div>
                        <div class="border-t border-blue-200 dark:border-blue-700 my-2"></div>
                        <div class="flex justify-between text-sm font-bold">
                            <span class="text-gray-800 dark:text-white">Sisa Tagihan</span>
                            <span class="text-red-500">${formatRupiah(sisaHutang)}</span>
                        </div>
                    </div>
                    ` : ''}

                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Nama Orang / Pihak</label>
                        <input type="text" name="person" value="${editItem ? editItem.person : ''}" placeholder="Contoh: Budi" class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" required>
                    </div>

                    ${editItem ? `
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase text-green-600">Catat Pembayaran Baru (Cicilan)</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                <input type="number" name="newPayment" placeholder="0" class="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-green-500 bg-white dark:bg-gray-700 dark:text-white text-xl font-bold outline-none">
                            </div>
                            <p class="text-[10px] text-gray-400 mt-1">Isi jika ada pembayaran masuk/keluar. Kosongkan jika hanya edit data.</p>
                        </div>
                    ` : `
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Total Nominal</label>
                            <div class="relative">
                                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                                <input type="number" name="totalAmount" placeholder="0" class="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white text-xl font-bold outline-none" required>
                            </div>
                        </div>
                    `}

                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Sumber / Tujuan Dana</label>
                        <div class="relative">
                            <select name="accountId" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none">
                                <option value="">Pilih Akun...</option>
                            </select>
                            <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                        </div>
                        <p class="text-[10px] text-gray-400 mt-1">Saldo akun ini akan bertambah/berkurang otomatis.</p>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Tanggal Pinjam</label>
                            <input type="date" name="startDate" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" required>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Jatuh Tempo</label>
                            <input type="date" name="dueDate" class="w-full p-3 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" required>
                        </div>
                    </div>

                    <div>
                        <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Catatan</label>
                        <input type="text" name="note" value="${editItem ? (editItem.note || '') : ''}" placeholder="Keterangan..." class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none">
                    </div>

                    <button type="submit" class="w-full bg-gray-800 text-white font-bold py-4 rounded-xl hover:bg-gray-900 transition shadow-lg mt-4">
                        ${editItem ? 'Simpan Update' : 'Simpan Data'}
                    </button>
                </form>
            </div>
        `;

        const accounts = await getDataOnce('accounts');
        const accSelect = modal.querySelector('[name="accountId"]');
        if(accounts.length === 0) accSelect.innerHTML = `<option value="">Belum ada akun</option>`;
        else accounts.forEach(a => {
            const opt = document.createElement('option');
            opt.value = a.id; opt.text = `${a.name} (${a.holder || '-'})`; opt.setAttribute('data-name', a.name);
            if(editItem && editItem.accountId === a.id) opt.selected = true;
            accSelect.appendChild(opt);
        });

        const today = new Date().toISOString().split('T')[0];
        modal.querySelector('[name="startDate"]').value = editItem ? editItem.startDate : today;
        modal.querySelector('[name="dueDate"]').value = editItem ? editItem.dueDate : today;

        document.getElementById('form-hutang-modal').onsubmit = async (e) => { 
            e.preventDefault(); 
            const btn = e.target.querySelector('button');
            const accEl = e.target.accountId;
            const accName = accEl.options[accEl.selectedIndex]?.getAttribute('data-name');
            
            btn.innerHTML = 'Menyimpan...'; btn.disabled = true;

            try {
                if(editItem) {
                    const newPayment = parseInt(e.target.newPayment?.value) || 0;
                    const currentPaid = parseInt(editItem.paidAmount || 0);
                    
                    const updatePayload = {
                        person: e.target.person.value,
                        note: e.target.note.value,
                        startDate: e.target.startDate.value,
                        dueDate: e.target.dueDate.value,
                        paidAmount: currentPaid + newPayment 
                    };

                    if(newPayment > 0) {
                        const trxType = editItem.type === 'hutang' ? 'pengeluaran' : 'pemasukan'; 
                        const trxCatName = editItem.type === 'hutang' ? 'Bayar Hutang' : 'Terima Cicilan';
                        
                        await addData('transactions', {
                            date: new Date().toISOString().split('T')[0],
                            amount: newPayment,
                            accountId: e.target.accountId.value,
                            accountName: accName,
                            type: trxType,
                            category: 'Pendanaan',
                            categoryName: trxCatName,
                            note: `Cicilan: ${editItem.person}`
                        });
                    }
                    
                    await updateData('debts', editItem.id, updatePayload);

                } else {
                    const totalAmt = parseInt(e.target.totalAmount.value);
                    const debtData = {
                        type: e.target.type.value,
                        person: e.target.person.value,
                        totalAmount: totalAmt, 
                        paidAmount: 0, 
                        amount: totalAmt, 
                        note: e.target.note.value,
                        accountId: e.target.accountId.value,
                        accountName: accName,
                        startDate: e.target.startDate.value,
                        dueDate: e.target.dueDate.value,
                        createdAt: new Date()
                    };

                    const trxType = debtData.type === 'hutang' ? 'pemasukan' : 'pengeluaran'; 
                    const trxCatName = debtData.type === 'hutang' ? 'Terima Hutang' : 'Beri Pinjaman';

                    await Promise.all([
                        addData('debts', debtData),
                        addData('transactions', {
                            date: debtData.startDate,
                            amount: totalAmt,
                            accountId: debtData.accountId,
                            accountName: debtData.accountName,
                            type: trxType,
                            category: 'Pendanaan',
                            categoryName: trxCatName,
                            note: `Pendanaan Baru: ${debtData.person}`
                        })
                    ]);
                }

                showToast("Data berhasil disimpan");
                window.closeModal(); 

            } catch (err) {
                console.error(err);
                showToast("Terjadi kesalahan", "error");
                btn.innerHTML = 'Coba Lagi'; btn.disabled = false;
            }
        };
    };

    // --- FORM TRANSAKSI (SWAPPED TABS) ---
    window.renderTambahModal = async (editItemString = null) => {
        let editItem = null;
        if(editItemString) editItem = JSON.parse(decodeURIComponent(editItemString));

        const modal = document.getElementById('modal-container');
        modal.innerHTML = `
        <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-slide-up relative h-[90vh] sm:h-auto overflow-y-auto">
            <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
            <button onclick="window.closeModal()" class="absolute top-6 right-6 text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            <h3 class="text-xl font-bold mb-6 text-gray-800 dark:text-white text-center">${editItem ? 'Edit Transaksi' : 'Tambah Transaksi'}</h3>
            
            <form id="form-transaksi" class="space-y-5 pb-10">
                <div class="grid grid-cols-2 gap-3 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
                    <label class="cursor-pointer">
                        <input type="radio" name="type" value="pemasukan" ${(editItem && editItem.type === 'pemasukan') ? 'checked' : ''} class="peer sr-only" onchange="window.updateCategoryDropdown(this.value)">
                        <div class="py-3 text-center rounded-lg text-gray-500 dark:text-gray-300 font-bold text-sm transition peer-checked:bg-white dark:peer-checked:bg-gray-600 peer-checked:text-green-500 peer-checked:shadow-sm">Pemasukan</div>
                    </label>
                    <label class="cursor-pointer">
                        <input type="radio" name="type" value="pengeluaran" ${(!editItem || editItem.type === 'pengeluaran') ? 'checked' : ''} class="peer sr-only" onchange="window.updateCategoryDropdown(this.value)">
                        <div class="py-3 text-center rounded-lg text-gray-500 dark:text-gray-300 font-bold text-sm transition peer-checked:bg-white dark:peer-checked:bg-gray-600 peer-checked:text-red-500 peer-checked:shadow-sm">Pengeluaran</div>
                    </label>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Kategori</label>
                    <div class="relative">
                        <select name="categoryId" id="select-category" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none">
                            <option value="">Memuat...</option>
                        </select>
                        <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Rekening / Dompet</label>
                    <div class="relative">
                        <select name="accountId" id="select-account" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none appearance-none">
                            <option value="">Memuat...</option>
                        </select>
                        <div class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">JUMLAH</label>
                    <div class="relative">
                        <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">Rp</span>
                        <input type="number" name="amount" value="${editItem ? editItem.amount : ''}" required class="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-white text-2xl font-bold outline-none" placeholder="0">
                    </div>
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">CATATAN</label>
                    <input type="text" name="note" value="${editItem ? (editItem.note || '') : ''}" class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" placeholder="Keterangan transaksi...">
                </div>

                <div>
                    <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Tanggal</label>
                    <input type="date" name="date" required class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none">
                </div>

                <button type="submit" class="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 transition shadow-lg mt-4">
                    ${editItem ? 'Simpan Perubahan' : 'Simpan Transaksi'}
                </button>
            </form>
        </div>`;

        const [categories, accounts] = await Promise.all([getDataOnce('categories'), getDataOnce('accounts')]);
        const selectCat = document.getElementById('select-category'); 
        const selectAcc = document.getElementById('select-account');
        
        window.updateCategoryDropdown = (type) => { 
            selectCat.innerHTML = ''; 
            const filtered = categories.filter(c => c.type === type); 
            if(filtered.length === 0) selectCat.innerHTML = `<option value="">Belum ada kategori ${type}</option>`; 
            else filtered.forEach(c => { 
                const opt = document.createElement('option'); 
                opt.value = c.id; opt.text = c.name; opt.setAttribute('data-name', c.name); 
                if(editItem && editItem.categoryId === c.id) opt.selected = true;
                selectCat.appendChild(opt); 
            }); 
        };
        
        selectAcc.innerHTML = ''; 
        if(accounts.length === 0) selectAcc.innerHTML = `<option value="">Belum ada rekening</option>`; 
        else accounts.forEach(a => { 
            const opt = document.createElement('option'); 
            opt.value = a.id; opt.text = `${a.name} (${a.holder || '-'})`; opt.setAttribute('data-name', a.name); 
            if(editItem && editItem.accountId === a.id) opt.selected = true;
            selectAcc.appendChild(opt); 
        });

        const defaultType = editItem ? editItem.type : 'pemasukan';
        const radios = document.getElementsByName('type');
        for(let r of radios) { if(r.value === defaultType) r.checked = true; }
        
        window.updateCategoryDropdown(defaultType); 
        document.querySelector('[name="date"]').value = editItem ? editItem.date : new Date().toISOString().split('T')[0];

        document.getElementById('form-transaksi').onsubmit = async (e) => { 
            e.preventDefault(); 
            const btn = e.target.querySelector('button[type="submit"]'); 
            const catSelect = e.target.categoryId; 
            const accSelect = e.target.accountId; 
            const catName = catSelect.options[catSelect.selectedIndex]?.getAttribute('data-name') || 'Unknown'; 
            const accName = accSelect.options[accSelect.selectedIndex]?.getAttribute('data-name') || 'Unknown'; 
            
            const data = { 
                amount: e.target.amount.value, 
                type: e.target.type.value, 
                categoryId: e.target.categoryId.value, 
                categoryName: catName, 
                accountId: e.target.accountId.value, 
                accountName: accName, 
                date: e.target.date.value, 
                note: e.target.note.value 
            }; 
            
            btn.innerHTML = 'Menyimpan...'; btn.disabled = true; 

            let success = false;
            if(editItem) success = await updateData('transactions', editItem.id, data);
            else success = await addData('transactions', data);

            if(success) { showToast(editItem ? "Transaksi diperbarui" : "Transaksi disimpan"); window.closeModal(); } 
            else { showToast("Gagal menyimpan data", "error"); btn.innerHTML = 'Coba Lagi'; btn.disabled = false; } 
        };
    }

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

export function renderBeranda(container, unsub) {
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

    let allTransactions = [];
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
        filtered.forEach(t => { const val = parseInt(t.amount); if(t.type === 'pemasukan') inc += val; else exp += val; });
        
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

    updateHeader();
    unsub.transactions = subscribeToTransactions((result) => { allTransactions = result.allItems; refreshDataDisplay(); });
}

// --- RENDER PENDANAAN (HIERARKI BARU: DASHBOARD -> DETAIL) ---
export function renderPendanaan(container, unsub) {
    let allDebts = [];

    // Helper: Kalkulasi Status Jatuh Tempo
    const calculateStatus = (item) => {
        const total = parseInt(item.totalAmount || item.amount);
        const paid = parseInt(item.paidAmount || 0);
        const isPaid = paid >= total;
        
        if (isPaid) return { label: 'Lunas', color: 'text-green-500', isOverdue: false };
        
        const today = new Date();
        today.setHours(0,0,0,0);
        const dueDate = item.dueDate ? new Date(item.dueDate) : null;
        
        if (dueDate && today > dueDate) {
            return { label: 'Jatuh Tempo', color: 'text-red-500', isOverdue: true };
        }
        return { label: 'Belum Lunas', color: 'text-gray-500', isOverdue: false };
    };

    // Fungsi Render Halaman Dashboard (Utama)
    const renderDashboard = () => {
        let hTotal = 0, hCount = 0;
        let pTotal = 0, pCount = 0;

        allDebts.forEach(d => {
            const total = parseInt(d.totalAmount || d.amount);
            const paid = parseInt(d.paidAmount || 0);
            const sisa = total - paid;
            if(d.type === 'hutang') { if(sisa > 0) { hTotal += sisa; hCount++; } } 
            else { if(sisa > 0) { pTotal += sisa; pCount++; } }
        });

        container.innerHTML = `
            <div class="p-4 min-h-screen pb-24">
                <h2 class="text-gray-500 dark:text-gray-400 text-sm mb-4 font-bold uppercase">Pendanaan</h2>
                
                <div class="grid grid-cols-1 gap-4">
                    <div id="card-hutang" class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer transition hover:bg-gray-50 active:scale-[0.98]">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-800 dark:text-white text-lg">Hutang Saya</h4>
                                <p class="text-sm text-gray-500">Kewajiban bayar</p>
                            </div>
                        </div>
                        <div class="flex justify-between items-end border-t border-gray-50 dark:border-gray-700 pt-3">
                            <div class="text-xs text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">${hCount} Transaksi</div>
                            <div class="text-right">
                                <p class="text-xs text-gray-400">Sisa Tagihan</p>
                                <p class="font-extrabold text-xl text-blue-600">${formatRupiah(hTotal)}</p>
                            </div>
                        </div>
                    </div>

                    <div id="card-piutang" class="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer transition hover:bg-gray-50 active:scale-[0.98]">
                        <div class="flex items-center gap-4 mb-4">
                            <div class="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center">
                                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            </div>
                            <div>
                                <h4 class="font-bold text-gray-800 dark:text-white text-lg">Beri Pinjaman</h4>
                                <p class="text-sm text-gray-500">Kepada Orang Lain</p>
                            </div>
                        </div>
                        <div class="flex justify-between items-end border-t border-gray-50 dark:border-gray-700 pt-3">
                            <div class="text-xs text-gray-400 font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">${pCount} Transaksi</div>
                            <div class="text-right">
                                <p class="text-xs text-gray-400">Belum Lunas</p>
                                <p class="font-extrabold text-xl text-orange-500">${formatRupiah(pTotal)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('card-hutang').onclick = () => {
            viewState.pendanaanView = 'detail';
            viewState.pendanaanType = 'hutang';
            renderDetailView();
        };
        document.getElementById('card-piutang').onclick = () => {
            viewState.pendanaanView = 'detail';
            viewState.pendanaanType = 'piutang';
            renderDetailView();
        };
    };

    // Fungsi Render Halaman Detail (List)
    const renderDetailView = () => {
        const title = viewState.pendanaanType === 'hutang' ? 'Hutang Saya' : 'Beri Pinjaman';
        
        // Filter Data
        const filtered = allDebts.filter(d => {
            const total = parseInt(d.totalAmount || d.amount);
            const paid = parseInt(d.paidAmount || 0);
            const isLunas = paid >= total;
            
            if(d.type !== viewState.pendanaanType) return false;
            if(viewState.pendanaanStatus === 'lunas') return isLunas;
            else return !isLunas;
        });

        let listHTML = '';
        if(filtered.length === 0) {
            listHTML = `<div class="flex flex-col items-center justify-center py-20 text-gray-300 dark:text-gray-600"><p class="text-sm font-medium">Tidak ada data</p></div>`;
        } else {
            listHTML = filtered.map(item => {
                const total = parseInt(item.totalAmount || item.amount);
                const paid = parseInt(item.paidAmount || 0);
                const remaining = total - paid;
                const percentage = Math.min((paid / total) * 100, 100);
                
                const st = calculateStatus(item);
                const itemData = encodeURIComponent(JSON.stringify(item));
                const initials = item.person.substring(0,2).toUpperCase();
                const barColor = viewState.pendanaanType === 'hutang' ? 'bg-blue-500' : 'bg-orange-500';

                return `
                <div onclick="window.renderTambahHutangModal('${itemData}')" class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer active:scale-[0.99] transition mb-3">
                    <div class="flex justify-between items-start mb-3">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 ${viewState.pendanaanType === 'hutang' ? 'bg-blue-600' : 'bg-orange-600'} text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">${initials}</div>
                            <div>
                                <h4 class="font-bold text-gray-800 dark:text-white capitalize">${item.person}</h4>
                                <p class="text-[10px] text-gray-400 italic truncate max-w-[150px]">${item.note || 'Tanpa catatan'}</p>
                            </div>
                        </div>
                        <span class="text-[10px] font-bold ${st.color}">${st.label}</span>
                    </div>

                    <div class="flex justify-between text-xs mb-1">
                        <span class="text-gray-500">Terbayar <span class="font-bold text-gray-800 dark:text-white ml-1">${formatRupiah(paid)}</span></span>
                        <span class="text-gray-500">Total <span class="font-bold text-gray-800 dark:text-white ml-1">${formatRupiah(total)}</span></span>
                    </div>

                    <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 mb-3 overflow-hidden">
                        <div class="${barColor} h-2.5 rounded-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>

                    <div class="flex justify-between items-end border-t border-gray-50 dark:border-gray-700 pt-2">
                        <div>
                            <p class="text-[10px] text-gray-400">Jatuh Tempo</p>
                            <p class="text-xs font-bold ${st.isOverdue ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'}">${item.dueDate || '-'}</p>
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] text-gray-400">Sisa Tagihan</p>
                            <p class="font-bold text-sm text-gray-800 dark:text-white">${formatRupiah(remaining)}</p>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }

        container.innerHTML = `
            <div class="p-4 min-h-screen pb-24">
                <div class="flex items-center gap-3 mb-4">
                    <button id="btn-back-pendanaan" class="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <svg class="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <h2 class="text-gray-800 dark:text-white text-lg font-bold">${title}</h2>
                </div>

                <div class="flex mb-4 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg sticky top-0 z-10">
                    <button id="subtab-belum" class="flex-1 py-2 text-xs font-bold rounded ${viewState.pendanaanStatus === 'belum' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50'} transition">Belum Lunas</button>
                    <button id="subtab-lunas" class="flex-1 py-2 text-xs font-bold rounded ${viewState.pendanaanStatus === 'lunas' ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-white/50'} transition">Lunas</button>
                </div>

                <div class="space-y-3 pb-20">
                    ${listHTML}
                </div>

                <button onclick="window.renderTambahHutangModal()" class="fixed bottom-24 right-4 w-14 h-14 bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-900 transition z-40">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
                </button>
            </div>
        `;

        document.getElementById('btn-back-pendanaan').onclick = () => {
            viewState.pendanaanView = 'dashboard';
            renderDashboard();
        };
        document.getElementById('subtab-belum').onclick = () => {
            viewState.pendanaanStatus = 'belum';
            renderDetailView();
        };
        document.getElementById('subtab-lunas').onclick = () => {
            viewState.pendanaanStatus = 'lunas';
            renderDetailView();
        };
    };

    // Logic Utama: Cek State View
    const render = () => {
        if(viewState.pendanaanView === 'dashboard') renderDashboard();
        else renderDetailView();
    };

    // Subscribe Data
    unsub.debtsList = subscribeToData('debts', (items) => { 
        allDebts = items;
        render(); // Re-render based on current view state
    });
}

// --- RENDER LAPORAN (REVISED: DONUT CHART & MODERN UI) ---
let chartInstance = null; // Global variable untuk chart instance

export function renderLaporan(container, unsub) {
    // Initial Render Skeleton
    container.innerHTML = `
        <div class="min-h-screen pb-24 bg-white dark:bg-gray-900 transition-colors">
            <div class="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800 px-4 py-3">
                <div class="flex items-center justify-between">
                    <button id="prev-period" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                    </button>
                    <div class="text-center">
                        <h2 id="period-label" class="text-lg font-bold text-gray-800 dark:text-white">...</h2>
                        <span id="filter-badge" class="text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">Bulanan</span>
                    </div>
                    <button id="next-period" class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition">
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
                <button id="open-filter" class="absolute right-4 top-1/2 -translate-y-1/2 hidden">
                    <svg class="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </button>
            </div>

            <div class="p-5 space-y-6">
                <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 space-y-3 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500 dark:text-gray-400">Pendapatan</span>
                        <span id="report-income" class="font-bold text-green-600">Rp 0</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                        <span class="text-gray-500 dark:text-gray-400">Pengeluaran</span>
                        <span id="report-expense" class="font-bold text-red-500">Rp 0</span>
                    </div>
                    <div class="border-t border-gray-200 dark:border-gray-700"></div>
                    <div class="flex justify-between items-center">
                        <span class="font-bold text-gray-800 dark:text-white">Total</span>
                        <span id="report-total" class="font-extrabold text-gray-900 dark:text-white text-lg">Rp 0</span>
                    </div>
                </div>

                <div class="relative">
                    <h3 class="font-bold text-gray-800 dark:text-white mb-4 pl-1 border-l-4 border-blue-500">Analisis Pengeluaran</h3>
                    <div class="aspect-square max-w-[300px] mx-auto relative">
                        <canvas id="expenseChart"></canvas>
                        <div id="chart-center-text" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span class="text-xs text-gray-400">Total Keluar</span>
                            <span id="center-total" class="font-bold text-gray-800 dark:text-white text-sm">Rp 0</span>
                        </div>
                    </div>
                </div>

                <div id="category-details" class="space-y-3 pb-10">
                    </div>
            </div>

            <div id="filter-modal" class="fixed inset-0 z-[60] hidden flex items-end justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div class="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-6 animate-slide-up">
                    <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">Pilih Periode Laporan</h3>
                    <div class="space-y-2">
                        <button onclick="window.setReportFilter('harian')" class="w-full text-left p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition">
                            <div class="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>
                            <span class="font-bold text-gray-700 dark:text-gray-200">Harian</span>
                        </button>
                        <button onclick="window.setReportFilter('bulanan')" class="w-full text-left p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition">
                            <div class="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
                            <span class="font-bold text-gray-700 dark:text-gray-200">Bulanan</span>
                        </button>
                        <button onclick="window.setReportFilter('tahunan')" class="w-full text-left p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition">
                            <div class="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg></div>
                            <span class="font-bold text-gray-700 dark:text-gray-200">Tahunan</span>
                        </button>
                    </div>
                    <button onclick="document.getElementById('filter-modal').classList.add('hidden')" class="w-full mt-4 py-3 text-gray-400 font-bold hover:text-gray-600">Batal</button>
                </div>
            </div>
        </div>
    `;

    // State & Logic
    let currentFilter = 'bulanan';
    let rawTransactions = [];
    let reportDate = new Date();

    // Setup Filter Button in Header (reuse calendar icon placement logic)
    const btnCalendar = document.getElementById('page-title'); // Hack to append or verify logic
    const openFilterBtn = document.createElement('button');
    openFilterBtn.innerHTML = `<svg class="w-6 h-6 text-gray-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`;
    openFilterBtn.className = "absolute right-14 top-1/2 -translate-y-1/2 p-2";
    openFilterBtn.onclick = () => document.getElementById('filter-modal').classList.remove('hidden');
    // Inject filter button into header if needed or rely on existing structure. 
    // Since we overwrote container, let's use the internal logic.
    // Use the `period-label` click to open filter as well for better UX
    document.getElementById('period-label').onclick = () => document.getElementById('filter-modal').classList.remove('hidden');

    // Global helper for filter click
    window.setReportFilter = (filter) => {
        currentFilter = filter;
        document.getElementById('filter-badge').innerText = filter;
        document.getElementById('filter-modal').classList.add('hidden');
        updateUI();
    };

    const updateUI = () => {
        // 1. Set Label Period
        const labelEl = document.getElementById('period-label');
        if (currentFilter === 'harian') labelEl.innerText = reportDate.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
        else if (currentFilter === 'bulanan') labelEl.innerText = reportDate.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
        else labelEl.innerText = reportDate.getFullYear();

        // 2. Filter Transactions
        const filtered = rawTransactions.filter(t => {
            const d = new Date(t.date);
            if (currentFilter === 'harian') return d.toDateString() === reportDate.toDateString();
            if (currentFilter === 'bulanan') return d.getMonth() === reportDate.getMonth() && d.getFullYear() === reportDate.getFullYear();
            return d.getFullYear() === reportDate.getFullYear();
        });

        // 3. Calculate Totals
        let income = 0, expense = 0;
        const categoryMap = {}; // Untuk Donut Chart (Hanya Pengeluaran)

        filtered.forEach(t => {
            const amt = parseInt(t.amount);
            if(t.type === 'pemasukan') {
                income += amt;
            } else {
                expense += amt;
                // Grouping Pengeluaran
                const catName = t.categoryName || t.category || 'Lainnya';
                if(!categoryMap[catName]) categoryMap[catName] = 0;
                categoryMap[catName] += amt;
            }
        });

        document.getElementById('report-income').innerText = formatRupiah(income);
        document.getElementById('report-expense').innerText = formatRupiah(expense);
        document.getElementById('report-total').innerText = formatRupiah(income - expense);
        document.getElementById('center-total').innerText = formatRupiah(expense);

        // 4. Render Chart.js
        renderChart(categoryMap, expense);
        renderCategoryList(categoryMap, expense);
    };

    const renderChart = (dataMap, totalExpense) => {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        const labels = Object.keys(dataMap);
        const dataValues = Object.values(dataMap);
        
        // Destroy old instance
        if(chartInstance) chartInstance.destroy();

        if (dataValues.length === 0) {
            // Empty State Chart
             chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['Belum ada data'],
                    datasets: [{ data: [1], backgroundColor: ['#E5E7EB'], borderWidth: 0 }]
                },
                options: { cutout: '70%', plugins: { legend: { display: false }, tooltip: { enabled: false } } }
            });
            return;
        }

        // Colors Palette
        const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: dataValues,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 0,
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                cutout: '70%', // Membuat lubang tengah besar
                plugins: {
                    legend: { display: false }, // Hide default legend
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) label += ': ';
                                label += formatRupiah(context.raw);
                                return label;
                            }
                        }
                    }
                }
            }
        });
    };

    const renderCategoryList = (dataMap, totalExpense) => {
        const container = document.getElementById('category-details');
        container.innerHTML = '';
        
        if(totalExpense === 0) {
            container.innerHTML = `<p class="text-center text-gray-400 text-sm py-4">Belum ada pengeluaran periode ini.</p>`;
            return;
        }

        const sorted = Object.entries(dataMap).sort((a,b) => b[1] - a[1]);
        const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];

        sorted.forEach(([name, val], index) => {
            const percent = ((val / totalExpense) * 100).toFixed(1);
            const colorClass = colors[index % colors.length];
            
            container.innerHTML += `
                <div class="flex items-center justify-between group">
                    <div class="flex items-center gap-3">
                        <div class="w-3 h-3 rounded-full ${colorClass}"></div>
                        <div>
                            <p class="text-sm font-bold text-gray-700 dark:text-gray-200">${name}</p>
                            <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 w-24 mt-1">
                                <div class="${colorClass} h-1.5 rounded-full" style="width: ${percent}%"></div>
                            </div>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm font-bold text-gray-800 dark:text-white">${formatRupiah(val)}</p>
                        <p class="text-[10px] text-gray-400">${percent}%</p>
                    </div>
                </div>
            `;
        });
    };

    // Nav Listeners
    document.getElementById('prev-period').onclick = () => {
        if(currentFilter === 'bulanan') reportDate.setMonth(reportDate.getMonth() - 1);
        else if(currentFilter === 'tahunan') reportDate.setFullYear(reportDate.getFullYear() - 1);
        else reportDate.setDate(reportDate.getDate() - 1);
        updateUI();
    };
    document.getElementById('next-period').onclick = () => {
        if(currentFilter === 'bulanan') reportDate.setMonth(reportDate.getMonth() + 1);
        else if(currentFilter === 'tahunan') reportDate.setFullYear(reportDate.getFullYear() + 1);
        else reportDate.setDate(reportDate.getDate() + 1);
        updateUI();
    };

    // Subscribe Data
    unsub.report = subscribeToTransactions(({groupedData}) => {
        rawTransactions = [];
        groupedData.forEach(g => rawTransactions.push(...g.items));
        updateUI();
    });
}

export function renderDashboardAdmin(container, unsub) {
    container.innerHTML = `
        <div class="p-4 min-h-screen pb-24 space-y-5">
            <div class="bg-gray-900 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden">
                <div class="relative z-10"><div class="flex justify-between items-start mb-4"><div><p class="text-gray-400 text-xs font-bold uppercase tracking-wider">Net Worth</p><h2 class="text-3xl font-extrabold mt-1" id="admin-networth">...</h2></div><div class="bg-gray-800 p-2 rounded-lg"><svg class="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div></div><div class="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4"><div><span class="block text-gray-500 text-xs mb-1">Aset (Cash)</span><span id="admin-assets" class="font-bold text-green-400 text-lg">...</span></div><div><span class="block text-gray-500 text-xs mb-1">Kewajiban (Hutang)</span><span id="admin-liabilities" class="font-bold text-red-400 text-lg">...</span></div></div></div>
                <div class="absolute -right-6 -bottom-10 opacity-10"><svg class="w-48 h-48" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg></div>
            </div>
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 class="font-bold text-gray-800 dark:text-white mb-4 text-sm">Arus Kas (Semua Waktu)</h3>
                <div class="space-y-4"><div><div class="flex justify-between text-xs mb-1"><span class="text-gray-500">Pemasukan</span><span class="font-bold text-green-600" id="cf-in">...</span></div><div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2"><div id="bar-in" class="bg-green-500 h-2 rounded-full" style="width: 0%"></div></div></div><div><div class="flex justify-between text-xs mb-1"><span class="text-gray-500">Pengeluaran</span><span class="font-bold text-red-500" id="cf-out">...</span></div><div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2"><div id="bar-out" class="bg-red-500 h-2 rounded-full" style="width: 0%"></div></div></div></div>
            </div>
            <div class="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"><h3 class="font-bold text-gray-800 dark:text-white mb-4 text-sm">Top Pengeluaran Kategori</h3><div id="top-categories" class="space-y-3"><p class="text-xs text-gray-400">Memuat data...</p></div></div>
            <h3 class="font-bold text-gray-700 dark:text-gray-300 text-sm">Menu Cepat</h3>
            <div class="grid grid-cols-3 gap-3">
                <button onclick="window.location.hash='#rekening'" class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition"><div class="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg></div><span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">Rekening</span></button>
                <button onclick="window.renderExportModal()" class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition"><div class="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg></div><span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">Export</span></button>
                <button onclick="window.renderInfoModal()" class="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:bg-gray-50 transition"><div class="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div><span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">Info</span></button>
            </div>
        </div>
    `;

    unsub.transactions = subscribeToTransactions(({groupedData, summary}) => {
        let allTrx = []; groupedData.forEach(g => allTrx.push(...g.items));
        const catMap = {}; let totalExp = 0;
        allTrx.forEach(t => { if(t.type === 'pengeluaran') { const amt = parseInt(t.amount); const name = t.categoryName || 'Lainnya'; catMap[name] = (catMap[name] || 0) + amt; totalExp += amt; } });
        const sortedCats = Object.entries(catMap).sort((a,b) => b[1] - a[1]).slice(0, 3);
        const catContainer = document.getElementById('top-categories'); catContainer.innerHTML = '';
        if (sortedCats.length === 0) catContainer.innerHTML = `<p class="text-xs text-gray-400 italic">Belum ada pengeluaran.</p>`;
        else sortedCats.forEach(([name, amount]) => { const percent = ((amount / totalExp) * 100).toFixed(0); catContainer.innerHTML += `<div><div class="flex justify-between text-xs mb-1"><span class="font-medium text-gray-700 dark:text-gray-300">${name}</span><span class="text-gray-500">${percent}% (${formatRupiah(amount)})</span></div><div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5"><div class="bg-blue-500 h-1.5 rounded-full" style="width: ${percent}%"></div></div></div>`; });

        const maxFlow = Math.max(summary.income, summary.expense) || 1;
        document.getElementById('cf-in').innerText = formatRupiah(summary.income); document.getElementById('cf-out').innerText = formatRupiah(summary.expense);
        document.getElementById('bar-in').style.width = `${(summary.income / maxFlow) * 100}%`; document.getElementById('bar-out').style.width = `${(summary.expense / maxFlow) * 100}%`;
        document.getElementById('admin-assets').innerText = formatRupiah(summary.total);
        getDataOnce('debts').then(debts => { let liabilities = 0; debts.forEach(d => { if(d.type === 'hutang') liabilities += parseInt(d.amount); }); document.getElementById('admin-liabilities').innerText = formatRupiah(liabilities); document.getElementById('admin-networth').innerText = formatRupiah(summary.total - liabilities); });
    });
}

export function renderRekening(container, unsub) {
    container.innerHTML = `<div class="p-4 min-h-screen pb-24"><div class="flex justify-between items-center mb-6"><h2 class="text-gray-500 dark:text-gray-400 text-sm">Kelola Sumber Dana</h2><button onclick="document.getElementById('form-rekening').classList.toggle('hidden')" class="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow-lg transition">+ Tambah</button></div><form id="form-rekening" class="hidden bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 animate-slide-up"><input type="text" name="name" placeholder="Nama Bank / E-Wallet" class="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-3 outline-none" required><input type="text" name="holder" placeholder="Atas Nama" class="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm mb-3 outline-none"><button type="submit" class="w-full bg-gray-900 dark:bg-gray-600 text-white py-3 rounded-lg font-bold text-sm hover:bg-black transition">Simpan Rekening</button></form><div id="accounts-list" class="grid gap-3"><p class="text-center text-gray-400 py-10">Memuat rekening...</p></div></div>`;
    document.getElementById('form-rekening').onsubmit = async (e) => { e.preventDefault(); const data = { name: e.target.name.value, holder: e.target.holder.value }; if(await addData('accounts', data)) { e.target.reset(); e.target.classList.add('hidden'); } };
    unsub.accounts = subscribeToData('accounts', (items) => { const list = document.getElementById('accounts-list'); list.innerHTML = ''; if(items.length === 0) { list.innerHTML = `<div class="text-center text-gray-400 py-10">Belum ada rekening.</div>`; return; } items.forEach(acc => { list.innerHTML += `<div class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center group"><div class="flex items-center gap-3"><div class="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold text-xs">${acc.name.substring(0,2).toUpperCase()}</div><div><h4 class="font-bold text-gray-800 dark:text-white">${acc.name}</h4><p class="text-xs text-gray-500">${acc.holder || 'Tanpa Nama'}</p></div></div><button onclick="window.hapusItem('accounts', '${acc.id}')" class="p-2 text-gray-300 hover:text-red-500 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></div>`; }); });
}

export function renderKategori(container, unsub) {
    container.innerHTML = `<div class="p-4 min-h-screen pb-24"><div class="flex justify-center mb-6 bg-gray-100 dark:bg-gray-700 p-1 rounded-xl"><button id="tab-expense" class="flex-1 py-2 text-sm font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition">Pengeluaran</button><button id="tab-income" class="flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 transition">Pemasukan</button></div><form id="form-kategori" class="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6"><div class="flex gap-2"><input type="text" name="name" placeholder="Nama Kategori" class="flex-1 p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm outline-none" required><button type="submit" class="bg-blue-600 text-white px-4 rounded-lg font-bold text-sm hover:bg-blue-700 transition">Tambah</button></div></form><div id="categories-list" class="grid gap-2"></div></div>`;
    let activeType = 'pengeluaran'; let allCategories = []; const renderList = () => { const list = document.getElementById('categories-list'); const filtered = allCategories.filter(c => c.type === activeType); list.innerHTML = ''; if(filtered.length === 0) { list.innerHTML = `<div class="text-center text-gray-400 py-10">Belum ada kategori ${activeType}.</div>`; return; } filtered.forEach(cat => { list.innerHTML += `<div class="bg-white dark:bg-gray-800 px-4 py-3 rounded-lg border border-gray-100 dark:border-gray-700 flex justify-between items-center"><span class="font-medium text-gray-700 dark:text-gray-200 text-sm">${cat.name}</span><button onclick="window.hapusItem('categories', '${cat.id}')" class="text-xs text-red-400 hover:text-red-600">Hapus</button></div>`; }); };
    const tabExp = document.getElementById('tab-expense'); const tabInc = document.getElementById('tab-income');
    tabExp.onclick = () => { activeType = 'pengeluaran'; tabExp.className = "flex-1 py-2 text-sm font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition"; tabInc.className = "flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 transition"; renderList(); };
    tabInc.onclick = () => { activeType = 'pemasukan'; tabInc.className = "flex-1 py-2 text-sm font-bold rounded-lg bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm transition"; tabExp.className = "flex-1 py-2 text-sm font-bold rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-800 transition"; renderList(); };
    document.getElementById('form-kategori').onsubmit = async (e) => { e.preventDefault(); const data = { name: e.target.name.value, type: activeType }; if(await addData('categories', data)) e.target.reset(); };
    unsub.categories = subscribeToData('categories', (items) => { allCategories = items; renderList(); });
}

// --- RENDER AKTIVITAS (REVISED: TIMELINE UI) ---
export function renderActivities(container, unsub) {
    container.innerHTML = `
        <div class="p-4 min-h-screen pb-24 relative bg-gray-50 dark:bg-gray-900 transition-colors">
            <div class="flex justify-between items-center mb-6">
                <div>
                    <h2 class="text-xl font-bold text-gray-800 dark:text-white">Aktivitas Saya</h2>
                    <p class="text-xs text-gray-500">Target & Rutinitas</p>
                </div>
                <div class="bg-purple-100 text-purple-600 px-3 py-1 rounded-full text-xs font-bold" id="task-count">0 Tugas</div>
            </div>

            <div id="activities-list" class="space-y-0 pl-2 pb-20 relative">
                <div class="absolute left-6 top-2 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -z-0"></div>
                <div id="loading-act" class="text-center py-10 text-gray-400">Memuat aktivitas...</div>
            </div>

            <button onclick="document.getElementById('form-activity-modal').classList.remove('hidden')" class="fixed bottom-24 right-4 w-14 h-14 bg-purple-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-purple-700 transition z-40 transform hover:scale-105">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>

            <div id="form-activity-modal" class="fixed inset-0 z-[70] hidden flex items-end justify-center bg-black bg-opacity-50 backdrop-blur-sm">
                <div class="bg-white dark:bg-gray-800 w-full sm:max-w-md rounded-t-3xl p-6 animate-slide-up relative">
                    <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mx-auto mb-6"></div>
                    <h3 class="font-bold text-lg mb-4 text-gray-800 dark:text-white">Tambah Aktivitas Baru</h3>
                    <form id="form-activity" class="space-y-4">
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Judul Kegiatan</label>
                            <input type="text" name="title" placeholder="Contoh: Meeting Proyek" class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required>
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Deskripsi (Opsional)</label>
                            <input type="text" name="desc" placeholder="Detail tambahan..." class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none">
                        </div>
                        <div>
                            <label class="block text-xs font-bold text-gray-500 mb-2 uppercase">Tanggal Target</label>
                            <input type="date" name="date" class="w-full p-4 rounded-xl border bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none" required>
                        </div>
                        <div class="flex gap-3 pt-2">
                            <button type="button" onclick="document.getElementById('form-activity-modal').classList.add('hidden')" class="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200">Batal</button>
                            <button type="submit" class="flex-1 bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-purple-700 shadow-lg">Simpan</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.querySelector('#form-activity [name="date"]').value = new Date().toISOString().split('T')[0];
    
    document.getElementById('form-activity').onsubmit = async (e) => { 
        e.preventDefault(); 
        const data = { 
            title: e.target.title.value, 
            desc: e.target.desc.value, 
            date: e.target.date.value, 
            isDone: false 
        }; 
        if(await addData('activities', data)) { 
            e.target.reset(); 
            document.querySelector('#form-activity [name="date"]').value = new Date().toISOString().split('T')[0];
            document.getElementById('form-activity-modal').classList.add('hidden'); 
            showToast("Aktivitas ditambahkan");
        } 
    };

    unsub.activities = subscribeToData('activities', (items) => { 
        const list = document.getElementById('activities-list'); 
        const countEl = document.getElementById('task-count');
        
        list.innerHTML = '<div class="absolute left-6 top-2 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700 -z-0"></div>'; // Redraw vertical line
        
        if(items.length === 0) { 
            list.innerHTML += `<div class="text-center py-20 text-gray-400 relative z-10 bg-gray-50 dark:bg-gray-900"><p>Belum ada aktivitas.</p></div>`; 
            if(countEl) countEl.innerText = "0 Tugas";
            return; 
        } 

        // Sort: Belum selesai di atas, lalu tanggal
        items.sort((a,b) => (a.isDone === b.isDone) ? 0 : a.isDone ? 1 : -1);
        
        if(countEl) countEl.innerText = `${items.filter(i => !i.isDone).length} Tugas Aktif`;

        items.forEach(act => { 
            const isDone = act.isDone; 
            list.innerHTML += `
            <div class="relative pl-12 py-3 group">
                <div class="absolute left-[1.1rem] top-8 w-4 h-4 rounded-full border-2 ${isDone ? 'bg-green-500 border-green-500' : 'bg-white border-purple-500 dark:bg-gray-800'} z-10 transition-colors">
                    ${isDone ? '<svg class="w-3 h-3 text-white absolute top-0 left-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>' : ''}
                </div>

                <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-start justify-between gap-3 transition-all ${isDone ? 'opacity-50 grayscale' : 'hover:shadow-md'}">
                    <div class="flex-1 cursor-pointer" onclick="window.toggleActivity('${act.id}', ${!isDone})">
                        <h4 class="font-bold text-gray-800 dark:text-white text-base ${isDone ? 'line-through text-gray-400' : ''}">${act.title}</h4>
                        <p class="text-xs text-gray-500 mt-1 line-clamp-1">${act.desc || 'Tidak ada deskripsi'}</p>
                        <div class="mt-2 flex items-center gap-2">
                            <span class="text-[10px] font-bold px-2 py-0.5 rounded ${isDone ? 'bg-green-100 text-green-600' : 'bg-purple-50 text-purple-600'}">
                                ${isDone ? 'Selesai' : 'To Do'}
                            </span>
                            <span class="text-[10px] text-gray-400">• ${new Date(act.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                        </div>
                    </div>
                    <button onclick="window.hapusItem('activities', '${act.id}')" class="p-2 text-gray-300 hover:text-red-500 transition">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                </div>
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