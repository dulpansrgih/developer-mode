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

// --- FORMATTER ---
export function formatRupiah(amount) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

// --- GENERAL CRUD HELPER ---

// 1. Subscribe (Read Realtime)
export function subscribeToData(collectionName, callback) {
    const user = auth.currentUser;
    if (!user) {
        callback([]);
        return () => {}; 
    }

    const q = query(
        collection(db, collectionName),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
    });
}

// 2. Fetch Once (Untuk Dropdown di Modal)
export async function getDataOnce(collectionName) {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
        collection(db, collectionName), 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
    );
    
    const snapshot = await getDocs(q);
    const items = [];
    snapshot.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
    return items;
}

// 3. Add (Create)
export async function addData(collectionName, data) {
    const user = auth.currentUser;
    if (!user) return false;

    try {
        await addDoc(collection(db, collectionName), {
            ...data,
            userId: user.uid,
            createdAt: serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error(`Add ${collectionName} Error:`, e);
        return false;
    }
}

// 4. Update (Edit Data)
export async function updateData(collectionName, id, data) {
    try {
        const docRef = doc(db, collectionName, id);
        // Hapus field undefined agar tidak error di Firestore
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);
        
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (e) {
        console.error(`Update ${collectionName} Error:`, e);
        return false;
    }
}

// 5. Delete (Delete)
export async function deleteData(collectionName, id) {
    try {
        await deleteDoc(doc(db, collectionName, id));
        return true;
    } catch (e) {
        console.error(`Delete ${collectionName} Error:`, e);
        return false;
    }
}

// --- KHUSUS AKTIVITAS (Update Status Checkbox) ---
export async function updateActivityStatus(id, isDone) {
    try {
        await updateDoc(doc(db, "activities", id), {
            isDone: isDone
        });
        return true;
    } catch (e) {
        console.error("Update Activity Error:", e);
        return false;
    }
}

// --- KHUSUS RUNDOWN (JURNAL HARIAN) ---
export function subscribeToRundowns(callback) {
    const user = auth.currentUser;
    if (!user) {
        callback([]);
        return () => {};
    }

    // Urutkan berdasarkan tanggal rundown, lalu jam
    const q = query(
        collection(db, "rundowns"),
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
        orderBy("time", "asc")
    );

    return onSnapshot(q, (snapshot) => {
        const items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        callback(items);
    });
}

// --- KHUSUS TRANSAKSI & TRANSFER ---
export function subscribeToTransactions(callback) {
    const user = auth.currentUser;
    if (!user) {
        callback({ groupedData: [], summary: { income: 0, expense: 0, total: 0 }, allItems: [] });
        return () => {}; 
    }

    const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        orderBy("date", "desc"),
        orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
        let totalPemasukan = 0;
        let totalPengeluaran = 0;
        const transactions = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            const id = doc.id;
            const amount = parseInt(data.amount) || 0;

            if (data.type === 'pemasukan') totalPemasukan += amount;
            if (data.type === 'pengeluaran') totalPengeluaran += amount;

            transactions.push({ id, ...data });
        });

        // Grouping dilakukan di sini atau di UI, tapi kita kirim raw data juga (allItems) 
        // supaya UI bisa melakukan filtering cepat tanpa query ulang.
        const groupedData = groupTransactionsByDate(transactions);

        callback({
            groupedData,
            allItems: transactions, // PENTING: Data mentah untuk filter client-side
            summary: {
                income: totalPemasukan,
                expense: totalPengeluaran,
                total: totalPemasukan - totalPengeluaran
            }
        });
    });
}

function groupTransactionsByDate(transactions) {
    const groups = {};
    transactions.forEach(trx => {
        const dateKey = trx.date; 
        if (!groups[dateKey]) {
            groups[dateKey] = {
                date: dateKey,
                total: 0,
                items: []
            };
        }
        const amountVal = trx.type === 'pengeluaran' ? -parseInt(trx.amount) : parseInt(trx.amount);
        groups[dateKey].total += amountVal;
        groups[dateKey].items.push(trx);
    });
    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
}

// --- DATA UNTUK LAPORAN & DASHBOARD ---
export function subscribeToMonthlyReport(callback) {
    const user = auth.currentUser;
    if (!user) { callback([]); return () => {}; }

    // Ambil semua transaksi user untuk diolah menjadi laporan bulanan
    const q = query(collection(db, "transactions"), where("userId", "==", user.uid));

    return onSnapshot(q, (snapshot) => {
        const monthlyData = {};
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const date = new Date(data.date);
            // Format Key: "YYYY-MM" (contoh: 2023-12)
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { 
                    income: 0, 
                    expense: 0, 
                    label: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
                    key: monthKey
                };
            }

            const amount = parseInt(data.amount) || 0;
            if (data.type === 'pemasukan') monthlyData[monthKey].income += amount;
            if (data.type === 'pengeluaran') monthlyData[monthKey].expense += amount;
        });

        // Ubah ke array dan sort dari bulan lama ke baru
        const reportArray = Object.entries(monthlyData)
            .map(([key, val]) => ({ key, ...val }))
            .sort((a, b) => a.key.localeCompare(b.key));
            
        // Ambil 6 bulan terakhir saja
        callback(reportArray.slice(-6));
    });
}

export function subscribeToFinancialSummary(callback) {
    const user = auth.currentUser;
    if (!user) { callback({}); return () => {}; }

    // Listen Transaksi untuk total aset (Kas)
    const qTrx = query(collection(db, "transactions"), where("userId", "==", user.uid));
    const unsubTrx = onSnapshot(qTrx, (snapTrx) => {
        let assets = 0;
        snapTrx.forEach(d => {
            const val = parseInt(d.data().amount) || 0;
            if (d.data().type === 'pemasukan') assets += val;
            else assets -= val;
        });

        // Listen Hutang (Sekali jalan atau nested)
        getDocs(query(collection(db, "debts"), where("userId", "==", user.uid))).then(snapDebt => {
            let liabilities = 0;
            snapDebt.forEach(d => {
                if(d.data().type === 'hutang') liabilities += (parseInt(d.data().amount) || 0);
            });
            
            callback({
                netWorth: assets - liabilities,
                totalAssets: assets,
                totalLiabilities: liabilities
            });
        });
    });
    
    return unsubTrx;
}

// --- TRANSFER SALDO (Atomic Batch) ---
export async function addTransfer(data) {
    const user = auth.currentUser;
    if (!user) return false;

    // Transfer = Pengeluaran dari Akun A + Pemasukan ke Akun B
    const batch = writeBatch(db);
    
    // 1. Dokumen Pengeluaran (Dari Rekening Asal)
    const docRefOut = doc(collection(db, "transactions"));
    batch.set(docRefOut, {
        userId: user.uid,
        amount: data.amount,
        type: 'pengeluaran',
        category: 'Transfer Keluar',
        categoryName: 'Transfer Keluar',
        accountId: data.fromAccountId,
        accountName: data.fromAccountName,
        date: data.date,
        note: `Transfer ke ${data.toAccountName}`,
        isTransfer: true,
        createdAt: serverTimestamp()
    });

    // 2. Dokumen Pemasukan (Ke Rekening Tujuan)
    const docRefIn = doc(collection(db, "transactions"));
    batch.set(docRefIn, {
        userId: user.uid,
        amount: data.amount,
        type: 'pemasukan',
        category: 'Transfer Masuk',
        categoryName: 'Transfer Masuk',
        accountId: data.toAccountId,
        accountName: data.toAccountName,
        date: data.date,
        note: `Terima dari ${data.fromAccountName}`,
        isTransfer: true,
        createdAt: serverTimestamp()
    });

    // 3. Biaya Admin (Jika ada)
    if (data.adminFee > 0) {
        const docRefFee = doc(collection(db, "transactions"));
        batch.set(docRefFee, {
            userId: user.uid,
            amount: data.adminFee,
            type: 'pengeluaran',
            category: 'Biaya Admin',
            categoryName: 'Biaya Admin',
            accountId: data.fromAccountId, // Biasanya biaya diambil dari akun pengirim
            accountName: data.fromAccountName,
            date: data.date,
            note: 'Biaya Transfer',
            createdAt: serverTimestamp()
        });
    }

    try {
        await batch.commit();
        return true;
    } catch (e) {
        console.error("Transfer Error:", e);
        return false;
    }
}

// --- EXPORT EXCEL HELPER ---
export async function getTransactionsByDateRange(startDate, endDate) {
    const user = auth.currentUser;
    if (!user) return [];

    const q = query(
        collection(db, "transactions"),
        where("userId", "==", user.uid),
        where("date", ">=", startDate),
        where("date", "<=", endDate),
        orderBy("date", "desc")
    );
    
    try {
        const snapshot = await getDocs(q);
        const items = [];
        snapshot.forEach(doc => items.push(doc.data()));
        return items;
    } catch (e) {
        console.error("Query Error (Mungkin butuh Index):", e);
        return [];
    }
}

export function subscribeToDebtsSummary(callback) {
    const user = auth.currentUser;
    if (!user) {
        callback({ hutang: 0, piutang: 0 });
        return () => {}; 
    }
    const q = query(collection(db, "debts"), where("userId", "==", user.uid));
    return onSnapshot(q, (snapshot) => {
        let hutang = 0;
        let piutang = 0;
        snapshot.forEach(doc => {
            const d = doc.data();
            if(d.type === 'hutang') hutang += parseInt(d.amount);
            else piutang += parseInt(d.amount);
        });
        callback({ hutang, piutang });
    });
}