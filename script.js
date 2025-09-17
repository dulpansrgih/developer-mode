// ================= KONFIGURASI =================
const API_URL = 'https://script.google.com/macros/s/AKfycbx2WklmyAl8HTrNuC5MeTGsoEIEQ37G5Ev2s_7oq9b4cvrVfiF0lwRVUZ-B2Fnwi1IS/exec';
const API_DATA_SHEET = 'https://script.google.com/macros/s/AKfycby2gRbprxpoB5xRodjdSOWU9mAncI3ACR0jXkbo6rvW2NG8jzXSbYeLGq8Fn1nfhIujNQ/exec';
let databaseData = { penghuni: [] };
const allRooms = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10'];
let currentPageId = null;
let pageHistory = [];
let generatedReceiptData = null;
let selectedRowId = null;

// Fungsi baru untuk membuat animasi Progress Bar
function getProgressLoaderHtml(text = 'Memuat Data...') {
    return `
        <div class="progress-loader-container">
            <div class="progress-text">${text}</div>
            <div class="progress-bar-wrapper">
                <div id="progress-bar-inner" class="progress-bar-inner"></div>
            </div>
            <div id="progress-percentage" class="progress-percentage">0%</div>
        </div>
    `;
}

/**
 * Fungsi untuk kembali ke halaman sebelumnya dalam histori.
 */
function goBack() {
    // Jika hanya ada satu atau nol halaman di histori, kembali ke menu utama
    if (pageHistory.length <= 1) {
        // Kita panggil goHome() yang sudah ada
        const homeButton = document.getElementById('home-button');
        if(homeButton) homeButton.click(); // Cara aman memanggil goHome
        return;
    }

    // Hapus halaman saat ini dari histori
    pageHistory.pop();

    // Ambil halaman terakhir dari histori (halaman sebelumnya)
    const previousPageId = pageHistory[pageHistory.length - 1];

    // Panggil displayContent TANPA menambahkan kembali ke histori
    // (Kita akan menangani ini di langkah selanjutnya)
    displayContent(previousPageId);
}

// ===============================================
// ================= FUNGSI UTAMA ================
// ===============================================
    document.addEventListener('DOMContentLoaded', () => {
        setupPasswordToggle();
        updateRealtimeDisplay();
        setInterval(updateRealtimeDisplay, 1000);

        const uploadForm = document.getElementById("modal-upload-form");
    if (uploadForm) {
        const fileInput = document.getElementById("modal-file-input");
        const fileNameDisplay = document.getElementById("modal-file-name-display");
        const submitButton = document.getElementById("modal-submit-button");
        const messageDiv = document.getElementById("modal-message");

        fileInput.addEventListener("change", function () {
            fileNameDisplay.textContent = this.files.length > 0 ? this.files[0].name : "Belum ada file dipilih";
        });

        uploadForm.addEventListener("submit", async function (e) {
            e.preventDefault();
             // Cek apakah file sudah dipilih
            const fileInput = document.getElementById("modal-file-input");
            if (fileInput.files.length === 0) {
                showCustomAlert("Pilih file yang ingin diunggah terlebih dahulu.");
                return; // Hentikan eksekusi fungsi
            }

            // Lanjutkan dengan proses pengiriman form jika file ada
            const submitButton = document.getElementById("modal-submit-button");
            const messageDiv = document.getElementById("modal-message");

            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...';
            messageDiv.style.display = "block";
            messageDiv.className = "notification is-warning";

            try {
                const formData = {
                    kamar: document.getElementById('modal-kamar-input').value,
                    fileData: await fileToBase64(fileInput.files[0])
                };

                const scriptURL = "https://script.google.com/macros/s/AKfycbxvpvpJsd4apXT14y8oYhjtremcloD-gGS3DawA5H0xKxohTxRp92APQ79NE4OVldz9/exec";

                const response = await fetch(scriptURL, {
                    method: "POST",
                    body: JSON.stringify(formData),
                    headers: { "Content-Type": "text/plain;charset=utf-8" },
                });

                const result = await response.json();

                if (result.status === "success") {
                    showCustomAlert(result.message);

                    // Ambil nama file dari input
                    const uploadedFileName = fileInput.files[0].name;

                    // Perbarui div dengan nama file yang berhasil diunggah
                    const uploadedFileDisplay = document.getElementById('uploaded-file-display');
                    if (uploadedFileDisplay) {
                        uploadedFileDisplay.textContent = `File "${uploadedFileName}" berhasil diunggah.`;
                    }

                    closeUploadModal();
                } else {
                    throw new Error(result.message);
                }
            } catch (error) {
                showCustomAlert("Error: " + error.message);
            } finally {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Upload & Simpan';
            }
        });
    }

// GANTI SELURUH BLOK INI DI script.js
document.body.addEventListener('click', (e) => {
    const target = e.target;

    const goHome = () => {
        const mainScreen = document.getElementById('main-screen');
        const dynamicContent = document.getElementById('dynamic-content');
        pageHistory = [];
        
        dynamicContent.style.opacity = '0';
        dynamicContent.style.transform = 'translateX(100%)';
        setTimeout(() => {
            dynamicContent.style.display = 'none';
            mainScreen.style.display = 'block';
            setTimeout(() => {
                mainScreen.style.opacity = '1';
                mainScreen.style.transform = 'translateX(0)';
            }, 50);
        }, 400);
    };

    if (target.closest('.kwitansi-close-btn')) {
        const modalBackdrop = document.getElementById('kwitansi-options-modal-backdrop');
        if (modalBackdrop) {
            modalBackdrop.classList.remove('show');
            setTimeout(() => {
                modalBackdrop.classList.add('hidden');
            }, 300);
        }
    }

    if (target.closest('.menu-card') || target.closest('.cek-detail-btn')) {
        handleMenuClick(target.closest('.menu-card') || target.closest('.cek-detail-btn'));
    }
    else if (target.closest('.modal-close-btn') || target.closest('#custom-alert .form-btn')) {
        handleCloseModal(target);
    }
    else if (target.closest('#back-button')) {
        goBack();
    }
    else if (target.closest('#home-button')) {
        goHome();
    }

    else if (target.closest('#susantoro-draft-btn')) {
        displayContent('susantoro-draft-content');
    }

    else if (target.closest('#modal-cancel-btn') || target.closest('#modal-submit-btn')) {
        handlePasswordModal(target);
    }
    else if (target.closest('.modal-close-btn') || target.closest('#custom-alert .form-btn')) {
        handleCloseModal(target);
    }
    else if (target.closest('#show-wifi-filter-btn')) {
        const modal = document.getElementById('wifi-filter-modal-backdrop');
        modal.classList.remove('hidden');
        modal.classList.add('show');
    }
    else if (target.closest('.filter-modal-btn')) {
        handleWifiFilter(target);
    }
        else if (target.closest('.generate-btn')) {
        // Dapatkan data dari tombol yang diklik
        const data = {
            nama: target.closest('.generate-btn').dataset.nama,
            kamar: target.closest('.generate-btn').dataset.kamar,
            nominal: target.closest('.generate-btn').dataset.nominal,
        };
        // Panggil fungsi modal baru
        showKwitansiOptionsModal(data);
    }

    else if (target.closest('.reminder-btn')) {
        handleReminderClick(target.closest('.reminder-btn'));
    }
    else if (target.closest('.view-id-btn')) {
    e.preventDefault();
    const imageUrl = target.dataset.url;
    showIdModal(imageUrl);
    }
    else if (target.closest('#id-modal-backdrop .modal-close-btn')) {
    const modal = document.getElementById('id-modal-backdrop');
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 300);
    }
    // --- PERBAIKAN PENTING ---
    // Dibuat lebih spesifik agar tidak konflik
    else if (target.closest('.database-card .edit-btn')) { 
        handleEditClick(target.closest('.edit-btn')); 
    }
    else if (target.closest('#generate-kuitansi-btn')) {
        handleGenerateKuitansi(e);
    }
    else if (target.closest('#cancel-kuitansi-btn')) {
        displayContent('database');
    }
    else if (target.closest('#preview-kuitansi-btn')) {
        handlePreviewKuitansi();
    }
    else if (target.closest('#booking-cancel-btn')) {
        document.getElementById('booking-modal-backdrop').classList.remove('show');
    }
    else if (target.closest('.copy-btn')) {
        handleCopyClick(target);
    }
    else if (target.closest('#datasheet-btn')) {
        displayContent('datasheet-view');
    }
    else if (target.closest('#refresh-data-btn')) {
        if (currentPageId === 'daftar-penghuni-readonly') {
            renderViewOnlyDatabase(document.getElementById('content-area'));
        } else if (currentPageId === 'daftar-kamar-readonly') {
            renderViewOnlyRooms(document.getElementById('content-area'));
        } else if (currentPageId === 'database') {
            renderDatabaseContent(document.getElementById('content-area'));
        } else if (currentPageId === 'datasheet-view') {
            renderDataSheetContent(document.getElementById('content-area'));
        }
    } 
    // --- BLOK BARU UNTUK TOMBOL DATA SHEET ---
    else if (target.closest('#datasheet-add-btn')) {
        handleDataSheetAdd();
    } 
    else if (target.closest('#datasheet-edit-btn')) {
        handleDataSheetEdit();
    } 
    else if (target.closest('#datasheet-delete-btn')) {
        handleDataSheetDelete();
    }
    // --- AKHIR BLOK BARU ---
    else if (target.closest('#database-btn')) {
        displayContent('database');
    } 
    else if (target.closest('#refresh-datasheet-btn')) {
        renderDataSheetContent(document.getElementById('content-area'));
    }
    else if (target.closest('#form-cancel-btn')) {
        renderDatabaseContent(document.getElementById('content-area'));
    }
    else if (target.closest('#cancel-edit-bill')) {
        displayContent('tagihan-listrik');
    }
});

    // Event listener khusus untuk submit form
    document.body.addEventListener('submit', (e) => {
    e.preventDefault(); // Mencegah refresh halaman
    
    if (e.target.id === 'booking-form') {
        handleBookingSubmit(e);
    }
    
    if (e.target.id === 'database-form') {
        const button = e.target.querySelector('button[type="submit"]');
        handleFormSubmit(e, false, button);
    }
    
    if (e.target.id === 'edit-electricity-bill-form') {
        handleElectricityBillFormSubmit(e);
    }
    
    if (e.target.id === 'livechat-form') {
        handleLiveChatSubmit(e);
    }

    // <-- BLOK BARU DITAMBAHKAN DI SINI, DI DALAM EVENT LISTENER
    if (e.target.id === 'datasheet-edit-form') {
        const form = e.target;
        const button = form.querySelector('button[type="submit"]');
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

        const dataToUpdate = {
            id: form.querySelector('#datasheet-edit-id').value,
            tanggal: form.querySelector('#datasheet-edit-tanggal').value,
            deskripsi: form.querySelector('#datasheet-edit-deskripsi').value,
            status: form.querySelector('#datasheet-edit-status').value,
        };

        sendDataSheetRequest('update', dataToUpdate).finally(() => {
            button.disabled = false;
            button.innerHTML = 'Simpan Perubahan';
            document.getElementById('datasheet-edit-modal-backdrop').classList.remove('show');
        });
    }
});

    const passwordInput = document.getElementById('password-input');
    if (passwordInput) passwordInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('modal-submit-btn').click(); }
    });
   
    const startMonthSelect = document.getElementById('start-month');
    const endMonthSelect = document.getElementById('end-month');
    const singleMonthNote = document.getElementById('single-month-note');

    if (startMonthSelect && endMonthSelect && singleMonthNote) {
        const updateNoteVisibility = () => {
            if (startMonthSelect.value && !endMonthSelect.value) {
                singleMonthNote.style.display = 'block';
            } else {
                singleMonthNote.style.display = 'none';
            }
        };
        startMonthSelect.addEventListener('change', updateNoteVisibility);
        endMonthSelect.addEventListener('change', updateNoteVisibility);
        
        // Panggil fungsi ini saat halaman pertama kali dimuat
        updateNoteVisibility();
    }

});

// ===============================================
// === LOGIKA FUNGSI TOMBOL YANG DIPERBAIKI ======
// ===============================================

/**
 * Menampilkan halaman e-Kwitansi dan mengisi data penghuni secara otomatis.
 * @param {object} data - Data dari tombol yang diklik (nama, kamar, nominal, dll).
 */
function displayGeneratePembayaranForm(data) {
    displayContent('generate-pembayaran-content');

    setTimeout(() => {
        const contentArea = document.getElementById('content-area');
        
        // Ganti dropdown dengan tampilan nama statis
        const selectNamaLabel = contentArea.querySelector('label[for="nama-penghuni-bayar"]');
        const selectNama = contentArea.querySelector('#nama-penghuni-bayar');
        
        if (selectNamaLabel && selectNama) {
            const staticNameDisplay = document.createElement('div');
            staticNameDisplay.className = 'static-name-display';
            staticNameDisplay.style.padding = '12px';
            staticNameDisplay.style.backgroundColor = '#f0f4f8';
            staticNameDisplay.style.border = '1px solid #e0e0e0';
            staticNameDisplay.style.borderRadius = '8px';
            staticNameDisplay.innerHTML = `<strong>${data.nama}</strong> (Kamar ${data.kamar})`;
            
            selectNamaLabel.textContent = "Penghuni:";
            selectNama.replaceWith(staticNameDisplay);
        }
        
        // Set nilai-nilai form lainnya
        contentArea.querySelector('#ruang-kamar-bayar').value = data.kamar || '';
        contentArea.querySelector('#nominal-bayar').value = data.nominal || '';
        
        // Simpan nama di input tersembunyi
        let hiddenInput = contentArea.querySelector('#nama-penghuni-bayar-hidden');
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = 'nama-penghuni-bayar-hidden';
            contentArea.querySelector('form').prepend(hiddenInput);
        }
        hiddenInput.value = data.nama || '';

    }, 100);
}

// TAMBAHKAN FUNGSI INI KE script.js
/**
 * Mengubah string tanggal apapun menjadi format YYYY-MM-DD.
 * @param {string} dateString - String tanggal (misal: "14 September 2025" atau "2025-09-14").
 * @returns {string} - Tanggal dalam format YYYY-MM-DD.
 */
function formatDateToYyyyMmDd(dateString) {
    if (!dateString || dateString === '-') return ''; // Kembalikan string kosong jika tidak ada tanggal

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // Jika format tidak dikenali, coba parsing manual untuk dd/mm/yyyy
        const parts = dateString.split('/');
        if (parts.length === 3) {
            // parts[2] = yyyy, parts[1] = mm, parts[0] = dd
            const isoDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            return isoDate;
        }
        return ''; // Kembalikan kosong jika masih gagal
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // +1 karena bulan dimulai dari 0
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

/**
 * Membuat dan membuka link WhatsApp untuk mengirim pesan pengingat.
 * @param {HTMLElement} button - Tombol reminder yang diklik.
 */
function handleReminderClick(button) {
    const { nama, kamar, nominal, jatuhTempo, whatsapp, type } = button.dataset;

    if (!whatsapp || whatsapp === '-') {
        showCustomAlert('Nomor WhatsApp untuk penghuni ini tidak tersedia.');
        return;
    }

    let cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '');
    if (!cleanWhatsapp.startsWith('62')) {
        if (cleanWhatsapp.startsWith('0')) {
            cleanWhatsapp = '62' + cleanWhatsapp.substring(1);
        } else {
            // Ini akan menangani kasus seperti '+8...'
            cleanWhatsapp = '62' + cleanWhatsapp;
        }
    }
    
    let message;
    const formattedNominal = formatRupiah(nominal);

    if (type === 'listrik') {
        // --- TEMPLATE PESAN KHUSUS UNTUK IURAN LISTRIK ---
        message = `
*PEMBERITAHUAN TAGIHAN IURAN LISTRIK*
_______________________________
Yth. Sdr. ${nama} (Penghuni Kamar ${kamar})
Tagihan iuran listrik Saudara adalah sebesar Rp. ${formattedNominal}.
Mohon untuk dapat melakukan pembayaran secepatnya.
Terima kasih.
        `.trim();
    } else {
        // --- TEMPLATE PESAN UMUM UNTUK SEWA KAMAR ---
        const formattedJatuhTempo = formatDate(jatuhTempo);
        const hariJatuhTempo = getIndonesianDayOfWeek(jatuhTempo);

        message = `
*PEMBERITAHUAN JATUH TEMPO PEMBAYARAN SEWA KAMAR*
_______________________________
Dengan hormat,
Yth. Sdr. ${nama} (Penghuni Kamar ${kamar})
Melalui pesan ini, kami ingin mengingatkan bahwa pembayaran sewa kamar Saudara akan jatuh tempo pada:
**${hariJatuhTempo}, ${formattedJatuhTempo}**
Adapun rincian tagihan Saudara adalah sebesar Rp. ${formattedNominal}/bulan. Mohon untuk dapat melakukan pembayaran sesuai kesepakatan.
Pembayaran dapat dilakukan melalui transfer ke salah satu rekening berikut:
1) BCA : 2350332203 (Drs. Susantoro)
2) BRI : 684801000938500 (SUSANTORO)
3) Bank Jateng : 2161023356 (Susantoro)
4) BNI : 0211447416 (SRI YANIARI)
5) Mandiri : 1850004105075 (SUSANTORO)
_Jika Saudara sudah melakukan pembayaran, mohon abaikan pesan ini_.
> _sent via portal-kos.dulpanadisaragih.my.id/#reminder_
Atas perhatian dan kerjasamanya, kami ucapkan terima kasih.
Hormat kami,
Pengelola Kost Putra Bu Yani
        `.trim();
    }

    const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

/**
 * Menampilkan form untuk mengedit data penghuni.
 * @param {HTMLElement} button - Tombol edit yang diklik.
 */
function handleEditClick(button) {
    const kamarId = button.dataset.kamar;
    const residentData = databaseData.penghuni.find(p => p.kamar === kamarId);

    if (residentData) {
        // Panggil fungsi yang merender form dengan data yang sudah ada
        renderDatabaseForm(document.getElementById('content-area'), residentData);
    } else {
        showCustomAlert('Data penghuni tidak ditemukan.');
    }
}

/**
 * Fungsi BARU untuk merender form edit/tambah data penghuni.
 * @param {HTMLElement} contentArea - Elemen tempat form akan ditampilkan.
 * @param {object} [dataToEdit=null] - Data penghuni yang akan diedit (opsional).
 */
// GANTIKAN FUNGSI LAMA DENGAN YANG INI DI script.js
function renderDatabaseForm(contentArea, data) {
    const initialStatus = data.nama ? 'Tidak Tersedia' : 'Tersedia';

    const formHtml = `
        <div class="database-form-container">
            <h3 style="text-align: center; font-size: 1.5em; margin-bottom: 25px;">Edit Status Kamar ${data.kamar}</h3>
            <div class="konfirmasi-actions">
                <button type="button" class="konfirmasi-btn tidak-tersedia ${initialStatus === 'Tidak Tersedia' ? 'active-status' : ''}" data-status="Tidak Tersedia">Ada Penghuni</button>
                <button type="button" class="konfirmasi-btn destructive-btn ${initialStatus === 'Tersedia' ? 'active-status' : ''}" data-status="Tersedia">Tidak Ada Penghuni</button>
            </div>
            <div id="dynamic-form-content" style="margin-top: 30px;"></div>
        </div>`;
    contentArea.innerHTML = formHtml;

    const renderFormContent = (status) => {
        const container = document.getElementById('dynamic-form-content');
        if (status === 'Tersedia') {
            // Bagian untuk mengosongkan kamar (tidak perlu diubah)
            container.innerHTML = `
                <div class="empty-state-card" style="margin-top: 0; padding: 30px; border: 2px dashed #e74c3c; box-shadow: none;">
                    <i class="fas fa-exclamation-triangle icon" style="font-size: 3.5em; color: #e74c3c;"></i>
                    <h4 class="title" style="font-size: 1.6em; color: #c0392b;">Konfirmasi Pengosongan Kamar</h4>
                    <p class="message" style="max-width: 350px; margin: 10px auto;">Anda akan menghapus semua data penghuni. Status kamar akan diubah menjadi <strong style="color: var(--primary-color);">Tersedia</strong>.</p>
                    <p class="message" style="font-weight: 700; color: #c0392b; margin-top:10px;">Tindakan ini tidak dapat dibatalkan.</p>
                    <div class="form-actions" style="justify-content: center; margin-top: 25px;">
                        <button type="button" id="apply-empty-btn" class="form-btn destructive-btn"><i class="fas fa-trash-alt"></i> Ya, Kosongkan Data</button>
                        <button type="button" id="form-cancel-btn" class="form-btn safe-btn">Batal</button>
                    </div>
                </div>`;
            
            document.getElementById('apply-empty-btn').addEventListener('click', (e) => {
                handleFormSubmit({ kamar: data.kamar }, true, e.currentTarget);
            });
            document.getElementById('form-cancel-btn').addEventListener('click', () => renderDatabaseContent(contentArea));

        } else { // Status 'Tidak Tersedia' (Ada Penghuni)
            let jatuhTempoValue = data.jatuhTempo ? new Date(data.jatuhTempo).toISOString().split('T')[0] : '';

            const nominalOptions = [325000, 350000, 375000, 400000];
            const isNominalLainnya = data.nominal && !nominalOptions.includes(Number(data.nominal));

            container.innerHTML = `
                <form id="database-form" class="database-form">
                    <h4 style="text-align:center; margin-bottom:20px; color: var(--primary-color);">Edit Data Penghuni</h4>
                    <input type="hidden" name="kamar" value="${data.kamar || ''}">
                    <input type="hidden" name="statusKamar" value="Tidak Tersedia">
                    
                    <label for="form-nama">Nama Lengkap:</label>
                    <input type="text" id="form-nama" name="nama" value="${data.nama || ''}" required>

                    <label for="form-nik">NIK KTP (16 Angka):</label>
                    <input type="text" id="form-nik" name="nik" value="${data.nik || ''}" maxlength="16" pattern="[0-9]{16}" title="Harus 16 digit angka">

                    <label class="label">Upload ID:</label>
                    <div class="custom-file-upload-container">
                        <button type="button" class="custom-file-btn" onclick="openUploadModal('${data.kamar}')">
                            <i class="fas fa-upload"></i> Pilih File
                        </button>
                          <span class="custom-file-text">${data.FileLink ? 'File sudah terunggah' : 'Belum ada file dipilih'}</span>
                    </div>

                    <label for="form-whatsapp">Nomor WhatsApp:</label>
                    <input type="tel" id="form-whatsapp" name="whatsapp" value="${data.whatsapp || ''}" placeholder="Contoh: 81234567890">
                    
                    <label for="form-ttl">Tempat, Tanggal Lahir:</label>
                    <input type="text" id="form-ttl" name="ttl" value="${data.ttl || ''}" placeholder="Contoh: Jakarta, 17 Agustus 1990">
                    
                    <label for="form-alamat">Alamat Asal:</label>
                    <input type="text" id="form-alamat" name="alamat" value="${data.alamat || ''}" placeholder="Sesuai KTP">
                    
                    <label for="form-status">Status:</label>
                    <select id="form-status" name="status" required>
                        <option value="">-- Pilih Status --</option>
                        <option value="Mahasiswa" ${data.status === 'Mahasiswa' ? 'selected' : ''}>Mahasiswa</option>
                        <option value="Bekerja" ${data.status === 'Bekerja' ? 'selected' : ''}>Bekerja</option>
                        <option value="Lainnya" ${data.status === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                    </select>
                    <hr style="margin: 25px 0;">

                    <label for="form-nominal-select">Nominal Pembayaran (Rp):</label>
                    <p style="font-size: 0.8em; color: #f39c12; margin-top: -2px; margin-bottom: 8px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Nominal yang tertera adalah Bulanan (perbulan!)</span>
                    </p>
                    <select id="form-nominal-select" required>
                        <option value="" disabled ${!data.nominal ? 'selected' : ''}>-- Pilih Nominal (Perbulan)--</option>
                        <option value="325000" ${data.nominal == 325000 ? 'selected' : ''}>Rp 325.000</option>
                        <option value="350000" ${data.nominal == 350000 ? 'selected' : ''}>Rp 350.000</option>
                        <option value="375000" ${data.nominal == 375000 ? 'selected' : ''}>Rp 375.000</option>
                        <option value="400000" ${data.nominal == 400000 ? 'selected' : ''}>Rp 400.000</option>
                        <option value="lainnya" ${isNominalLainnya ? 'selected' : ''}>Lainnya</option>
                    </select>
                    <div id="form-nominal-lainnya-container" style="display: ${isNominalLainnya ? 'block' : 'none'}; margin-top: 10px;">
                        <label for="form-nominal-lainnya">Masukkan Nominal Lainnya (Rp):</label>
                        <input type="text" id="form-nominal-lainnya" value="${isNominalLainnya ? data.nominal : ''}" placeholder="Contoh: 500000">
                    </div>
                    <input type="hidden" id="form-nominal" name="nominal" value="${data.nominal || '325000'}">

                    <label for="form-jatuh-tempo">Jatuh Tempo:</label>
                    <input type="date" id="form-jatuh-tempo" name="jatuhTempo" value="${jatuhTempoValue}" required>
                    <p style="font-size: 0.8em; color: #f39c12; margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Secara otomatis merubah status pembayaran berdasarkan tanggal jatuh tempo.</span>
                    </p>

                    <div class="form-actions">
                        <button type="submit" class="form-btn">Simpan Perubahan</button>
                        <button type="button" id="form-cancel-btn" class="form-btn cancel">Batal</button>
                    </div>
                </form>`;
            
            // --- LOGIKA UNTUK DROPDOWN NOMINAL ---
            const nominalSelect = document.getElementById('form-nominal-select');
            const nominalLainnyaContainer = document.getElementById('form-nominal-lainnya-container');
            const nominalLainnyaInput = document.getElementById('form-nominal-lainnya');
            const nominalHiddenInput = document.getElementById('form-nominal');

            if (nominalSelect) nominalSelect.value = '';
    if (nominalLainnyaContainer) nominalLainnyaContainer.style.display = 'none';
    if (nominalLainnyaInput) nominalLainnyaInput.value = '';
    if (nominalHiddenInput) nominalHiddenInput.value = '';

            const updateNominal = () => {
                if (nominalSelect.value === 'lainnya') {
                    nominalLainnyaContainer.style.display = 'block';
                    nominalHiddenInput.value = nominalLainnyaInput.value.replace(/[^0-9]/g, '');
                } else {
                    nominalLainnyaContainer.style.display = 'none';
                    nominalHiddenInput.value = nominalSelect.value;
                }
            };

            nominalSelect.addEventListener('change', updateNominal);
            nominalLainnyaInput.addEventListener('input', () => {
                // Hanya update jika opsi "Lainnya" yang dipilih
                if (nominalSelect.value === 'lainnya') {
                    nominalHiddenInput.value = nominalLainnyaInput.value.replace(/[^0-9]/g, '');
                }
            });
            
            // Validasi input NIK agar hanya angka
            const nikInput = document.getElementById('form-nik');
            if(nikInput) {
                nikInput.addEventListener('input', () => {
                    nikInput.value = nikInput.value.replace(/[^0-9]/g, '');
                });
            }

            document.getElementById('form-cancel-btn').addEventListener('click', () => renderDatabaseContent(contentArea));
        }
    };
    
    // Logika untuk tombol toggle (tidak perlu diubah)
    const konfirmasiBtns = document.querySelectorAll('.konfirmasi-btn');
    konfirmasiBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            konfirmasiBtns.forEach(b => b.classList.remove('active-status'));
            e.currentTarget.classList.add('active-status');
            renderFormContent(e.currentTarget.dataset.status);
        });
    });
    
    renderFormContent(initialStatus);
}

/**
 * Menangani proses pengiriman data form ke Google Apps Script.
 */
// GANTIKAN FUNGSI LAMA DENGAN YANG INI DI script.js
function renderDatabaseForm(contentArea, data) {
    const initialStatus = data.nama ? 'Tidak Tersedia' : 'Tersedia';

    const formHtml = `
        <div class="database-form-container">
            <h3 style="text-align: center; font-size: 1.5em; margin-bottom: 25px;">Edit Status Kamar ${data.kamar}</h3>
            <div class="konfirmasi-actions">
                <button type="button" class="konfirmasi-btn tidak-tersedia ${initialStatus === 'Tidak Tersedia' ? 'active-status' : ''}" data-status="Tidak Tersedia">Ada Penghuni</button>
                <button type="button" class="konfirmasi-btn destructive-btn ${initialStatus === 'Tersedia' ? 'active-status' : ''}" data-status="Tersedia">Tidak Ada Penghuni</button>
            </div>
            <div id="dynamic-form-content" style="margin-top: 30px;"></div>
        </div>`;
    contentArea.innerHTML = formHtml;

    const renderFormContent = (status) => {
        const container = document.getElementById('dynamic-form-content');
        if (status === 'Tersedia') {
            // Bagian untuk mengosongkan kamar (tidak perlu diubah)
            container.innerHTML = `
                <div class="empty-state-card" style="margin-top: 0; padding: 30px; border: 2px dashed #e74c3c; box-shadow: none;">
                    <i class="fas fa-exclamation-triangle icon" style="font-size: 3.5em; color: #e74c3c;"></i>
                    <h4 class="title" style="font-size: 1.6em; color: #c0392b;">Konfirmasi Pengosongan Kamar</h4>
                    <p class="message" style="max-width: 350px; margin: 10px auto;">Anda akan menghapus semua data penghuni. Status kamar akan diubah menjadi <strong style="color: var(--primary-color);">Tersedia</strong>.</p>
                    <p class="message" style="font-weight: 700; color: #c0392b; margin-top:10px;">Tindakan ini tidak dapat dibatalkan.</p>
                    <div class="form-actions" style="justify-content: center; margin-top: 25px;">
                        <button type="button" id="apply-empty-btn" class="form-btn destructive-btn"><i class="fas fa-trash-alt"></i> Ya, Kosongkan Data</button>
                        <button type="button" id="form-cancel-btn" class="form-btn safe-btn">Batal</button>
                    </div>
                </div>`;
            
            document.getElementById('apply-empty-btn').addEventListener('click', (e) => {
                handleFormSubmit({ kamar: data.kamar }, true, e.currentTarget);
            });
            document.getElementById('form-cancel-btn').addEventListener('click', () => renderDatabaseContent(contentArea));

        } else { // Status 'Tidak Tersedia' (Ada Penghuni)
            let jatuhTempoValue = data.jatuhTempo ? new Date(data.jatuhTempo).toISOString().split('T')[0] : '';

            const nominalOptions = [325000, 350000, 375000, 400000];
            const isNominalLainnya = data.nominal && !nominalOptions.includes(Number(data.nominal));
            const nominalLainnyaValue = (isNominalLainnya && !isNaN(Number(data.nominal))) ? data.nominal : '';

            container.innerHTML = `
                <form id="database-form" class="database-form">
                    <h4 style="text-align:center; margin-bottom:20px; color: var(--primary-color);">Edit Data Penghuni</h4>
                    <input type="hidden" name="kamar" value="${data.kamar || ''}">
                    <input type="hidden" name="statusKamar" value="Tidak Tersedia">
                    
                    <label for="form-nama">Nama Lengkap:</label>
                    <input type="text" id="form-nama" name="nama" value="${data.nama || ''}" required>

                    <label for="form-nik">NIK KTP (16 Angka):</label>
                    <input type="text" id="form-nik" name="nik" value="${data.nik || ''}" maxlength="16" pattern="[0-9]{16}" title="Harus 16 digit angka">

                    <label class="label">Upload ID:</label>
                    <div class="custom-file-upload-container">
                        <button type="button" class="custom-file-btn" onclick="openUploadModal('${data.kamar}')">
                            <i class="fas fa-upload"></i> Pilih File
                        </button>
                          <span class="custom-file-text">${data.FileLink ? 'File sudah terunggah' : 'Belum ada file dipilih'}</span>
                    </div>

                    <label for="form-whatsapp">Nomor WhatsApp:</label>
                    <input type="tel" id="form-whatsapp" name="whatsapp" value="${data.whatsapp || ''}" placeholder="Contoh: 81234567890">
                    
                    <label for="form-ttl">Tempat, Tanggal Lahir:</label>
                    <input type="text" id="form-ttl" name="ttl" value="${data.ttl || ''}" placeholder="Contoh: Jakarta, 17 Agustus 1990">
                    
                    <label for="form-alamat">Alamat Asal:</label>
                    <input type="text" id="form-alamat" name="alamat" value="${data.alamat || ''}" placeholder="Sesuai KTP">
                    
                    <label for="form-status">Status:</label>
                    <select id="form-status" name="status" required>
                        <option value="">-- Pilih Status --</option>
                        <option value="Mahasiswa" ${data.status === 'Mahasiswa' ? 'selected' : ''}>Mahasiswa</option>
                        <option value="Bekerja" ${data.status === 'Bekerja' ? 'selected' : ''}>Bekerja</option>
                        <option value="Lainnya" ${data.status === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                    </select>
                    <hr style="margin: 25px 0;">

                    <label for="form-nominal-select">Nominal Pembayaran (Rp):</label>
                    <p style="font-size: 0.8em; color: #f39c12; margin-top: -2px; margin-bottom: 8px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span><span>Nominal yang tertera adalah Bulanan (perbulan!)</span>
                    </p>
                    <select id="form-nominal-select" required>
                        <option value="" disabled ${!data.nominal ? 'selected' : ''}>-- Pilih Nominal (Perbulan) --</option>
                        <option value="325000" ${data.nominal == 325000 ? 'selected' : ''}>Rp 325.000</option>
                        <option value="350000" ${data.nominal == 350000 ? 'selected' : ''}>Rp 350.000</option>
                        <option value="375000" ${data.nominal == 375000 ? 'selected' : ''}>Rp 375.000</option>
                        <option value="400000" ${data.nominal == 400000 ? 'selected' : ''}>Rp 400.000</option>
                        <option value="lainnya" ${isNominalLainnya ? 'selected' : ''}>Lainnya</option>
                    </select>
                    <div id="form-nominal-lainnya-container" style="display: ${isNominalLainnya ? 'block' : 'none'}; margin-top: 10px;">
                        <label for="form-nominal-lainnya">Masukkan Nominal Lainnya (Rp):</label>
                        <input type="text" id="form-nominal-lainnya" value="${isNominalLainnya ? data.nominal : ''}" placeholder="Contoh: 500000">
                    </div>
                    <input type="hidden" id="form-nominal" name="nominal" value="${data.nominal || '325000'}">

                    <label for="form-jatuh-tempo">Jatuh Tempo:</label>
                    <input type="date" id="form-jatuh-tempo" name="jatuhTempo" value="${jatuhTempoValue}" required>
                    <p style="font-size: 0.8em; color: #f39c12; margin-top: 8px; display: flex; align-items: center; gap: 8px;">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Secara otomatis merubah status pembayaran berdasarkan tanggal jatuh tempo.</span>
                    </p>

                    <div class="form-actions">
                        <button type="submit" class="form-btn">Simpan Perubahan</button>
                        <button type="button" id="form-cancel-btn" class="form-btn cancel">Batal</button>
                    </div>
                </form>`;
            
            // --- LOGIKA UNTUK DROPDOWN NOMINAL ---
            const nominalSelect = document.getElementById('form-nominal-select');
            const nominalLainnyaContainer = document.getElementById('form-nominal-lainnya-container');
            const nominalLainnyaInput = document.getElementById('form-nominal-lainnya');
            const nominalHiddenInput = document.getElementById('form-nominal');

            const updateNominal = () => {
                if (nominalSelect.value === 'lainnya') {
                    nominalLainnyaContainer.style.display = 'block';
                    nominalHiddenInput.value = nominalLainnyaInput.value.replace(/[^0-9]/g, '');
                } else {
                    nominalLainnyaContainer.style.display = 'none';
                    nominalHiddenInput.value = nominalSelect.value;
                }
            };

            nominalSelect.addEventListener('change', updateNominal);
            nominalLainnyaInput.addEventListener('input', () => {
                // Hanya update jika opsi "Lainnya" yang dipilih
                if (nominalSelect.value === 'lainnya') {
                    nominalHiddenInput.value = nominalLainnyaInput.value.replace(/[^0-9]/g, '');
                }
            });
            
            // Validasi input NIK agar hanya angka
            const nikInput = document.getElementById('form-nik');
            if(nikInput) {
                nikInput.addEventListener('input', () => {
                    nikInput.value = nikInput.value.replace(/[^0-9]/g, '');
                });
            }

            document.getElementById('form-cancel-btn').addEventListener('click', () => renderDatabaseContent(contentArea));
        }
    };
    
    // Logika untuk tombol toggle (tidak perlu diubah)
    const konfirmasiBtns = document.querySelectorAll('.konfirmasi-btn');
    konfirmasiBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            konfirmasiBtns.forEach(b => b.classList.remove('active-status'));
            e.currentTarget.classList.add('active-status');
            renderFormContent(e.currentTarget.dataset.status);
        });
    });
    
    renderFormContent(initialStatus);
}

/**
 * Menangani proses pengiriman data form ke Google Apps Script.
 */
async function handleFormSubmit(eventOrData, isEmptying = false, buttonEl = null) {
    if (eventOrData && eventOrData.target) {
        eventOrData.preventDefault();
    }
    let originalButtonText = buttonEl ? buttonEl.innerHTML : 'Simpan Perubahan';
    if (buttonEl) {
        buttonEl.disabled = true;
        buttonEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    }
    try {
        const dataToSend = { action: 'update', sheet: 'penghuni' };
        let residentData;
        if (isEmptying) {
            // --- BLOK PENGOSONGAN DATA YANG SUDAH DIPERBAIKI ---
            dataToSend.kamar = eventOrData.kamar;
            dataToSend.nama = '';
            dataToSend.nik = '';
            dataToSend.whatsapp = '';
            dataToSend.ttl = '';
            dataToSend.alamat = '';
            dataToSend.status = '';
            dataToSend.jatuhTempo = '';
            dataToSend.FileLink = '';
            dataToSend.statusKamar = 'Tersedia';
            dataToSend.nominal = '0';
            dataToSend.bayarTerakhir = '';
            dataToSend.iuranListrik = '0';
            dataToSend.statusTagihan = '';
            dataToSend.jumlahBulan = '0';
            // --- AKHIR BLOK PERBAIKAN ---
        } else {
            const form = eventOrData.target;
            residentData = databaseData.penghuni.find(p => p.kamar === form.querySelector('[name="kamar"]').value);
            dataToSend.kamar = form.querySelector('[name="kamar"]').value;
            dataToSend.nama = form.querySelector('[name="nama"]').value;
            dataToSend.nik = form.querySelector('[name="nik"]').value;
            dataToSend.whatsapp = form.querySelector('[name="whatsapp"]').value;
            dataToSend.ttl = form.querySelector('[name="ttl"]').value;
            dataToSend.alamat = form.querySelector('[name="alamat"]').value;
            dataToSend.status = form.querySelector('[name="status"]').value;
            dataToSend.jatuhTempo = form.querySelector('[name="jatuhTempo"]').value;
            dataToSend.nominal = form.querySelector('[name="nominal"]').value;
            dataToSend.statusKamar = form.querySelector('[name="statusKamar"]').value;
            dataToSend.bayarTerakhir = residentData.bayarTerakhir || '';
            // Pastikan data iuran listrik juga terkirim
            dataToSend.iuranListrik = residentData.iuranListrik || '';
            dataToSend.statusTagihan = residentData.statusTagihan || '';
            dataToSend.jumlahBulan = residentData.jumlahBulan || '';
        }
        if (!isEmptying && residentData && dataToSend.statusKamar === 'Tidak Tersedia') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const jatuhTempoString = dataToSend.jatuhTempo;
            const parts = jatuhTempoString.split('-');
            const jatuhTempoDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
            if (jatuhTempoDate >= today) {
                dataToSend.bayarTerakhir = new Date().toISOString().split('T')[0];
            } else {
                dataToSend.bayarTerakhir = residentData.bayarTerakhir || '';
            }
        }
        const response = await fetch(API_URL, {
            method: 'POST',
            body: new URLSearchParams(dataToSend),
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Terjadi kesalahan di server.');
        }
        showCustomAlert(result.message || 'Data berhasil disimpan!');
        renderDatabaseContent(document.getElementById('content-area'));
    } catch (error) {
        console.error('Error saat mengirim form:', error);
        showCustomAlert(`Gagal menyimpan data: ${error.message}`);
    } finally {
        if (buttonEl) {
            buttonEl.disabled = false;
            buttonEl.innerHTML = originalButtonText;
        }
    }
}

/**
 * Fungsi pembantu yang khusus menangani pengiriman data ke server API.
 * PENTING: Fungsi ini harus diletakkan di luar fungsi lain, di level global.
 */
async function sendDataToServer(data, buttonEl) {
    let originalButtonText = buttonEl ? buttonEl.innerHTML : 'Simpan Perubahan';

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            body: new URLSearchParams(data)
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }
        showCustomAlert(result.message);
        renderDatabaseContent(document.getElementById('content-area'));
    } catch (error) {
        showCustomAlert(`Gagal menyimpan data: ${error.message}`);
    } finally {
        // Kode ini akan selalu dijalankan, baik sukses maupun gagal.
        if (buttonEl) {
            buttonEl.disabled = false;
            buttonEl.innerHTML = originalButtonText;
        }
    }
}


function displayContent(pageId) {
    currentPageId = pageId;
    if (pageHistory[pageHistory.length - 1] !== pageId) {
        pageHistory.push(pageId);
    }
    // Cukup beri tahu browser bahwa ada navigasi, tanpa data detail
    history.pushState({ navigated: true }, '', `#${pageId}`);

    const mainScreen = document.getElementById('main-screen');
    const dynamicContent = document.getElementById('dynamic-content');
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '';

    // Pastikan mainScreen disembunyikan dengan benar
    mainScreen.style.opacity = '0';
    mainScreen.style.transform = 'translateX(-100%)';
    setTimeout(() => {
        mainScreen.style.display = 'none';
        dynamicContent.style.display = 'flex';
        setTimeout(() => {
            dynamicContent.style.opacity = '1';
            dynamicContent.style.transform = 'translateX(0)';
        }, 50);
    }, 400);

    const pageRenderers = {
        'tentang-kos': () => {
            contentArea.innerHTML = document.getElementById('tentang-kos-content').innerHTML;
            setupTentangKosTabs();
        },
        'datasheet-view': () => renderDataSheetContent(contentArea),
        'cctv-live': () => contentArea.innerHTML = document.getElementById('cctv-live-content').innerHTML,
        'aturan-kost': () => contentArea.innerHTML = document.getElementById('aturan-kost-content').innerHTML,
        'database': () => renderDatabaseContent(contentArea),
        'informasi': () => contentArea.innerHTML = document.getElementById('informasi-content').innerHTML,
        'daftar-penghuni-readonly': () => renderViewOnlyDatabase(contentArea),
        'daftar-kamar-readonly': () => renderViewOnlyRooms(contentArea),
        'password-wifi': () => contentArea.innerHTML = document.getElementById('password-wifi-content').innerHTML,
        'cctv': () => renderCctvContent(contentArea),
        'server': () => renderServerContent(contentArea),
        'tagihan-listrik': () => renderTagihanListrik(contentArea),
        'iuran-listrik-readonly': () => renderIuranListrikReadOnly(contentArea),
        'live-chat': () => renderLiveChatForm(contentArea),
        // Tambahkan halaman generate pembayaran di sini agar bisa diakses oleh displayContent
        'generate-pembayaran-content': () => contentArea.innerHTML = document.getElementById('generate-pembayaran-content').innerHTML,
        'susantoro-draft-content': () => contentArea.innerHTML = document.getElementById('susantoro-draft-content').innerHTML,
        'catatan-view': () => {
        contentArea.innerHTML = `
            <h3 style="color: var(--primary-color); margin-bottom: 20px;">Catatan</h3>
            <p>Ini adalah halaman untuk catatan. Anda bisa menambahkan konten form atau tabel di sini.</p>
        `;  
    },
        'public-database-content': () => {
            contentArea.innerHTML = document.getElementById('public-database-content').innerHTML;
        },
        'access-datasheet-content': () => {
            contentArea.innerHTML = document.getElementById('access-datasheet-content').innerHTML;
        }
        
    };

    const renderFunction = pageRenderers[pageId] || (() => {
        contentArea.innerHTML = `<h3>Halaman Tidak Ditemukan</h3>`;
    });
    renderFunction();
}

function formatRupiah(number) {
    if (!number) return '0';
    if (typeof number === 'string') {
        number = number.replace(/\./g, '');
    }
    return new Intl.NumberFormat('id-ID').format(number);
}

function updateRealtimeDisplay() {
    document.getElementById('realtime-display').textContent = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'long' });
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    // Coba parsing dengan format yang lebih fleksibel
    const date = new Date(dateString);
    if (isNaN(date)) {
        // Jika parsing gagal, coba format lain atau kembalikan string asli
        const parts = dateString.split('-');
        if (parts.length === 3) {
            // Asumsikan YYYY-MM-DD
            return new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        return dateString; // Kembalikan apa adanya jika format tidak dikenali
    }
    return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getIndonesianDayOfWeek(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date)) {
        return '';
    }
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()];
}


function showCustomAlert(message) {
    const alert = document.getElementById('custom-alert-backdrop');
    alert.querySelector('.alert-message').textContent = message;
    alert.classList.remove('hidden');
    alert.classList.add('show');
}

function setupPasswordToggle() {
    const toggle = document.querySelector('.toggle-password');
    toggle.addEventListener('click', function() {
        const input = document.getElementById('password-input');
        input.type = input.type === 'password' ? 'text' : 'password';
        this.textContent = this.textContent === 'Lihat' ? 'Sembunyikan' : 'Lihat';
    });
}

function handleCopyClick(target) {
    const targetId = target.closest('.copy-btn').dataset.target;
    copyToClipboard(document.getElementById(targetId).textContent);
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        const notification = document.getElementById('copy-success-notification');
        notification.classList.remove('hidden');
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 1500);
    } catch (err) {
        showCustomAlert('Gagal menyalin.');
    }
}

// GANTI SELURUH FUNGSI renderDatabaseContent ANDA DENGAN INI
async function renderDatabaseContent(contentArea) {
    contentArea.innerHTML = getProgressLoaderHtml('Memuat Database Admin....');
    
    const bar = document.getElementById('progress-bar-inner');
    const percentageText = document.getElementById('progress-percentage');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        if(bar) bar.style.width = progress + '%';
        if(percentageText) percentageText.textContent = progress + '%';
    }, 150);

    try {
        const response = await fetch(`${API_URL}?action=read`);
        const result = await response.json();
        if (!result.success || !result.data || !result.data.penghuni) {
            throw new Error(result.message || 'Gagal mengambil data dari server');
        }
        databaseData.penghuni = result.data.penghuni;

        let html = `
            <div class="database-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="color: var(--primary-color); margin: 0;">Database Penghuni Kost</h3>
                <div>
                    <button id="susantoro-draft-btn" class="form-btn draft-btn" data-page="susantoro-draft-menu"><i class="fas fa-user-circle"></i> Draft Susantoro</button>
                    <button id="refresh-data-btn" class="form-btn refresh-btn"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>`;

        databaseData.penghuni.forEach(data => {
            const isOwnerRoom = data.kamar === 'A1';
            const isAvailable = data.statusKamar === 'Tersedia';
            let cardClass = isOwnerRoom ? 'owner-room' : (isAvailable ? 'available-room' : '');

            if (isOwnerRoom) {
                // Tampilan Kartu Pemilik (A1)
                html += `
                    <div class="database-card ${cardClass}" data-kamar="${data.kamar}">
                        <h4>Kamar ${data.kamar} - ${data.nama}</h4>
                        <div class="database-detail-item"><span>No. WhatsApp</span><span class="database-value" style="color: var(--accent-color); font-weight: 600;">Terkonfirmasi!</span></div>
                        <div class="database-detail-item"><span>Status Pembayaran</span><span class="database-value status-lunas"><i class="fas fa-check-circle"></i> Lunas</span></div>
                        <div class="database-detail-item"><span>Status Kamar</span><span class="database-value status-menunggak"><i class="fas fa-times-circle"></i> Tidak Disewakan!</span></div>
                    </div>`;
            } 
            else if (isAvailable) {
                // Tampilan ringkas untuk kamar KOSONG
                html += `
                    <div class="database-card ${cardClass}" data-kamar="${data.kamar}">
                        <h4>Kamar ${data.kamar} - <i>Kosong</i></h4>
                        <div class="database-detail-item">
                            <span>Status Pembayaran</span>
                            <span class="database-value" style="color: #f39c12; font-size: 1.2em;" title="Tidak berlaku untuk kamar kosong">
                                <i class="fas fa-exclamation-triangle"></i>
                            </span>
                        </div>
                        <div class="database-detail-item">
                            <span>Status Kamar</span>
                            <span class="database-value status-tersedia"><i class="fas fa-check-circle"></i> ${data.statusKamar}</span>
                        </div>
                        <div class="card-actions">
                            <button class="form-btn edit-btn" data-kamar="${data.kamar}"><i class="fas fa-edit"></i> Edit</button>
                        </div>
                    </div>`;
            } else {
                // Tampilan untuk kamar yang DIHUNI dengan TATA LETAK BARU
                
                // >>> LOGIKA STATUS PEMBAYARAN SEWA <<<<<
                let statusSewa = 'Lunas';
                let statusSewaClass = 'status-lunas';
                let statusSewaIcon = 'fas fa-check-circle';

                if (data.jatuhTempo && typeof data.jatuhTempo === 'string') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const parts = data.jatuhTempo.split('-');
                    const jatuhTempo = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    if (jatuhTempo < today) {
                        statusSewa = 'Belum Bayar';
                        statusSewaClass = 'status-menunggak';
                        statusSewaIcon = 'fas fa-exclamation-triangle';
                    }
                }
                
                // >>> LOGIKA TAGIHAN LISTRIK DENGAN PERBAIKAN <<<
                const iuranListrik = parseInt(data.iuranListrik) || 0;
                let totalTagihanListrik = 0;
                const statusTagihan = data.statusTagihan || 'Belum Bayar';
                
                if (statusTagihan === 'Belum Bayar') {
                    totalTagihanListrik = iuranListrik;
                } else if (statusTagihan === 'Menunggak') {
                    totalTagihanListrik = iuranListrik * (parseInt(data.jumlahBulan) || 0);
                }

                let tagihanListrikHtml = '';
                if (statusTagihan === 'Lunas') {
                    tagihanListrikHtml = `<span class="database-value status-lunas">Rp ${formatRupiah(0)}</span>`;
                } else if (statusTagihan === 'Menunggak' || statusTagihan === 'Belum Bayar') {
                    tagihanListrikHtml = `<span class="database-value status-menunggak">Rp ${formatRupiah(totalTagihanListrik)}</span>`;
                }
                
                let jumlahBulanHtml = '';
                if (statusTagihan === 'Menunggak' && data.jumlahBulan > 0) {
                    jumlahBulanHtml = `
                        <div class="database-detail-item">
                            <span>Jumlah Bulan</span>
                            <span class="database-value" style="color: #e74c3c;">${data.jumlahBulan} bulan</span>
                        </div>`;
                }

                const statusTagihanIcon = (statusTagihan === 'Lunas') ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
                const statusTagihanClass = (statusTagihan === 'Lunas') ? 'status-lunas' : 'status-menunggak';


                const canViewId = data.FileLink && data.nik;
                const viewIdHtml = canViewId 
                    ? `<button class="view-id-btn" data-url="${data.FileLink}">Lihat</button>` 
                    : `<button class="view-id-btn disabled-btn" disabled>Lihat</button>`;
                
                html += `
                    <div class="database-card ${cardClass}" data-kamar="${data.kamar}">
                        <h4 style="line-height: 1.3; margin-bottom: 20px;">
                            Kamar ${data.kamar} - ${data.nama}<br>
                            <span style="font-weight: normal; font-size: 0.9em;">NIK: ${data.nik || '-'}</span>
                        </h4>
                        
                        <div class="database-detail-item"><span>ID KTP/SIM <span class="upload-file-text">(Upload File)</span></span><span class="database-value">${viewIdHtml}</span></div>
                        <div class="database-detail-item"><span>No. WhatsApp</span><span class="database-value whatsapp-number">${data.whatsapp || '-'}</span></div>
                        <div class="database-detail-item"><span>Tempat, Tanggal Lahir</span><span class="database-value">${data.ttl || '-'}</span></div>
                        <div class="database-detail-item"><span>Alamat</span><span class="database-value">${data.alamat || '-'}</span></div>
                        <div class="database-detail-item"><span>Status</span><span class="database-value">${data.status || '-'}</span></div>

                        <hr style="border: none; height: 1px; background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0)); margin: 15px 0;">

                        <div class="database-detail-item"><span>Jumlah Pembayaran</span><span class="database-value">Rp ${formatRupiah(data.nominal || '0')}</span></div>
                        <div class="database-detail-item"><span>Status Pembayaran</span><span class="database-value ${statusSewaClass}"><i class="${statusSewaIcon}"></i> ${statusSewa}</span></div>
                        <div class="database-detail-item"><span>Jatuh Tempo</span><span class="database-value">${formatDate(data.jatuhTempo)}</span></div>
                        <div class="database-detail-item"><span>Pembayaran Terakhir</span><span class="database-value" style="color: #f39c12;">${formatDate(data.bayarTerakhir)}</span></div>
                        <hr style="border: none; height: 1px; background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0)); margin: 15px 0;">

                        <div class="database-detail-item"><span>Tagihan Listrik</span><span class="database-value">${tagihanListrikHtml}</span></div>
                        <div class="database-detail-item"><span>Status Tagihan</span><span class="database-value ${statusTagihanClass}"><i class="${statusTagihanIcon}"></i> ${statusTagihan}</span></div>
                        ${jumlahBulanHtml}

                        <div class="database-detail-item"><span>Status Kamar</span><span class="database-value status-tidak-tersedia"><i class="fas fa-times-circle"></i> ${data.statusKamar}</span></div>
                        
                        <div class="card-actions">
                            <button class="form-btn generate-btn" data-nama="${data.nama}" data-kamar="${data.kamar}" data-nominal="${data.nominal}" data-jatuh-tempo="${data.jatuhTempo}" data-whatsapp="${data.whatsapp || ''}"><i class="fas fa-receipt"></i> e-Kwitansi</button>
                            <button class="form-btn reminder-btn" data-nama="${data.nama}" data-kamar="${data.kamar}" data-nominal="${data.nominal}" data-jatuh-tempo="${data.jatuhTempo}" data-whatsapp="${data.whatsapp || ''}"><i class="fas fa-bell"></i></button>
                            <button class="form-btn edit-btn" data-kamar="${data.kamar}"><i class="fas fa-edit"></i> Edit</button>
                        </div>
                    </div>`;
            }
        });
        
        clearInterval(interval);
        if(bar) bar.style.width = '100%';
        if(percentageText) percentageText.textContent = '100%';
        
        setTimeout(() => {
            contentArea.innerHTML = html;
        }, 300);

    } catch (error) {
        clearInterval(interval);
        contentArea.innerHTML = `<div class="error-message">Gagal memuat data. Silakan coba lagi. <br><small>${error.message}</small></div>`;
    }
}






// ===============================================
// =========== DAFTAR PENGHUNI KOS ==============
// ===============================================

async function renderViewOnlyDatabase(contentArea) {
    contentArea.innerHTML = getProgressLoaderHtml('Memuat Penghuni Kost....');
    const bar = document.getElementById('progress-bar-inner');
    const percentageText = document.getElementById('progress-percentage');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        bar.style.width = progress + '%';
        percentageText.textContent = progress + '%';
    }, 150);
    try {
        const response = await fetch(`${API_URL}?action=read`);
        const result = await response.json();
        if (!result.success || !result.data || !result.data.penghuni) {
            throw new Error(result.message || 'Format data dari server salah.');
        }
        
        const penghuniData = result.data.penghuni;
        let databaseHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="color: var(--primary-color); margin: 0;">Daftar Penghuni Kost</h3>
                <button id="refresh-data-btn" class="form-btn refresh-btn"><i class="fas fa-sync-alt"></i> Refresh</button>
            </div>
            <p>Berikut adalah daftar semua penghuni kost yang aktif.</p>`;

        if (penghuniData.length > 0) {
            penghuniData.forEach(data => {
                const isOwnerRoom = data.kamar === 'A1';
                const isAvailable = data.statusKamar === 'Tersedia';

                if (isOwnerRoom) {
                    databaseHtml += `
                        <div class="database-card owner-room">
                            <h4><i class="fas fa-user-tie"></i> Kamar A1 - Pemilik</h4>
                            <div class="database-detail-item"><span>Status</span><span class="database-value">Tidak Disewakan</span></div>
                        </div>`;
                } else if (isAvailable) {
                    // Kamar kosong tidak ditampilkan di halaman publik ini
                    return; 
                } else {
                    // === LOGIKA STATUS PEMBAYARAN SEWA ===
                    let statusSewa = 'Lunas';
                    let statusSewaClass = 'status-lunas';
                    let statusSewaIcon = 'fas fa-check-circle';

                    if (data.jatuhTempo && typeof data.jatuhTempo === 'string') {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const parts = data.jatuhTempo.split('-');
                        const jatuhTempo = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        if (jatuhTempo < today) {
                            statusSewa = 'Belum Bayar';
                            statusSewaClass = 'status-menunggak';
                            statusSewaIcon = 'fas fa-exclamation-triangle';
                        }
                    }

                    // === LOGIKA TAGIHAN LISTRIK ===
                    const iuranListrik = parseInt(data.iuranListrik) || 0;
                    let totalTagihan = parseInt(data.nominal) || 0;
                    const statusTagihan = data.statusTagihan || 'Tidak Ada';

                    let tagihanListrikHtml = '';
                    if (statusTagihan === 'Lunas') {
                        tagihanListrikHtml = `<span class="database-value status-lunas">Rp ${formatRupiah(0)}</span>`;
                    } else if (statusTagihan === 'Menunggak') {
                        tagihanListrikHtml = `<span class="database-value status-menunggak">Rp ${formatRupiah(totalTagihan)}</span>`;
                    } else if (statusTagihan === 'Belum Bayar') {
                        tagihanListrikHtml = `<span class="database-value status-menunggak">Rp ${formatRupiah(totalTagihan)}</span>`;
                    }

                    let jumlahBulanHtml = '';
                    if (statusTagihan === 'Menunggak' && data.jumlahBulan > 0) {
                        jumlahBulanHtml = `
                            <div class="database-detail-item">
                                <span>Jumlah Bulan</span>
                                <span class="database-value" style="color: #e74c3c;">${data.jumlahBulan} bulan</span>
                            </div>`;
                    }

                    const statusTagihanIcon = (statusTagihan === 'Lunas') ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
                    const statusTagihanClass = (statusTagihan === 'Lunas') ? 'status-lunas' : 'status-menunggak';
                    
                    const kamarStatusClass = isAvailable ? 'status-tersedia' : 'status-tidak-tersedia';
                    const kamarStatusIcon = isAvailable ? 'fas fa-check-circle' : 'fas fa-times-circle';


                    databaseHtml += `
                        <div class="database-card" data-kamar="${data.kamar}">
                            <h4><i class="fas fa-user"></i> Kamar ${data.kamar} - ${data.nama}</h4>
                            <div class="database-detail-item"><span>No. WhatsApp</span><span class="database-value whatsapp-number">Tersembunyi...</span></div>
                            
                            <div class="database-detail-item"><span>Jatuh Tempo Sewa</span><span class="database-value">${formatDate(data.jatuhTempo)}</span></div>
                            <div class="database-detail-item"><span>Status Pembayaran Sewa</span><span class="database-value ${statusSewaClass}"><i class="${statusSewaIcon}"></i> ${statusSewa}</span></div>
                            <div class="database-detail-item"><span>Pembayaran Terakhir</span><span class="database-value" style="color: #f39c12;">${formatDate(data.bayarTerakhir)}</span></div>
                            
                            <hr style="border: none; height: 1px; background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0)); margin: 15px 0;">

                            <div class="database-detail-item"><span>Tagihan Listrik</span><span class="database-value">${tagihanListrikHtml}</span></div>
                            <div class="database-detail-item"><span>Status Tagihan</span><span class="database-value ${statusTagihanClass}"><i class="${statusTagihanIcon}"></i> ${statusTagihan}</span></div>
                            ${jumlahBulanHtml}
                            <div class="database-detail-item"><span>Status Kamar</span><span class="database-value ${kamarStatusClass}"><i class="${kamarStatusIcon}"></i> ${data.statusKamar || 'Tidak Ada Data'}</span></div>
                        </div>`;
                }
            });
        } else {
            databaseHtml += `<p style="text-align: center; color: var(--light-text-color);">Tidak ada data penghuni yang ditemukan.</p>`;
        }
        contentArea.innerHTML = databaseHtml;
        document.getElementById('refresh-data-btn').addEventListener('click', () => renderViewOnlyDatabase(contentArea));
    } catch (error) {
        contentArea.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">Gagal memuat data penghuni. ${error.message}</p>`;
    }
}


// ===============================================
// ============== DAFTAR KAMAR KOS ===============
// ===============================================
async function renderViewOnlyRooms(contentArea) {
    contentArea.innerHTML = getProgressLoaderHtml('Memuat Daftar Kamar Kos...');
    const bar = document.getElementById('progress-bar-inner');
    const percentageText = document.getElementById('progress-percentage');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        bar.style.width = progress + '%';
        percentageText.textContent = progress + '%';
    }, 150);
    try {
        const response = await fetch(`${API_URL}?action=read&sheet=penghuni`);
        const result = await response.json();
        if (!result.success || !result.data || !result.data.penghuni) {
            throw new Error(result.message || 'Format data dari server salah.');
        }

        const occupiedRooms = result.data.penghuni.reduce((acc, current) => {
            if (current.statusKamar !== 'Tersedia') {
                acc[current.kamar] = current;
            }
            return acc;
        }, {});

        let roomsHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <button id="refresh-data-btn" class="form-btn refresh-btn" style="margin-top: 0;"><i class="fas fa-sync-alt"></i> Refresh Data</button>
                <h3 style="color: var(--primary-color); margin: 0;">Daftar Kamar Kost</h3>
            </div>
            <p>Berikut adalah daftar semua kamar beserta status ketersediaannya.</p>
            <div class="rooms-grid">`;

        allRooms.forEach(roomNumber => {
            const roomData = occupiedRooms[roomNumber];
            const isOwnerRoom = roomNumber === 'A1';

            if (isOwnerRoom) {
                // KEMBALIKAN KARTU KHUSUS UNTUK KAMAR PEMILIK
                roomsHtml += `
                    <div class="room-card owner-room">
                        <div class="room-header">
                            <i class="fas fa-key room-icon"></i>
                            <h4 class="room-number">${roomNumber}</h4>
                        </div>
                        <p class="room-status">Kamar Pemilik</p>
                    </div>`;
            } else if (roomData) {
                // Tampilan untuk kamar yang dihuni
                roomsHtml += `
                    <div class="room-card occupied-room">
                        <div class="room-header">
                            <i class="fas fa-bed room-icon"></i>
                            <h4 class="room-number">Kamar ${roomNumber}</h4>
                        </div>
                        <p class="room-status"><i class="fas fa-times-circle"></i>Dihuni oleh: ${roomData.nama}</p>
                        <p class="room-status"><i class="fas fa-calendar-alt"></i>Jatuh Tempo: <span style="color: #f39c12;"> ${formatDate(roomData.jatuhTempo)}</span></p>
                    </div>`;
            } else {
                // Tampilan untuk kamar yang tersedia
                roomsHtml += `
                    <div class="room-card available-room" data-room="${roomNumber}">
                        <div class="room-header">
                            <i class="fas fa-bed room-icon"></i>
                            <h4 class="room-number">Kamar ${roomNumber}</h4>
                        </div>
                        <p class="room-status"><i class="fas fa-check-circle"></i>Tersedia</p>
                        <button class="book-now-btn">Booking Sekarang</button>
                    </div>`;
            }
        });

        roomsHtml += `</div>`;
        contentArea.innerHTML = roomsHtml;
        
        document.querySelectorAll('.book-now-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                showBookingModal(e.target.closest('.room-card').dataset.room);
            });
        });
        document.getElementById('refresh-data-btn').addEventListener('click', () => renderViewOnlyRooms(contentArea));

    } catch (error) {
        contentArea.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">Gagal memuat data kamar. ${error.message}</p>`;
    }
}


// ===============================================
// ============== DAFTAR VIEW ONLY DATABASE ===============
// ===============================================
async function renderViewOnlyDatabase(contentArea) {
    contentArea.innerHTML = getProgressLoaderHtml('Memuat Penghuni Kost....');
    const bar = document.getElementById('progress-bar-inner');
    const percentageText = document.getElementById('progress-percentage');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        bar.style.width = progress + '%';
        percentageText.textContent = progress + '%';
    }, 150);
    try {
        const response = await fetch(`${API_URL}?action=read`);
        const result = await response.json();
        if (!result.success || !result.data || !result.data.penghuni) {
            throw new Error(result.message || 'Format data dari server salah.');
        }

        const penghuniData = result.data.penghuni;
        let databaseHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="color: var(--primary-color); margin: 0;">Daftar Penghuni Kost</h3>
                <button id="refresh-data-btn" class="form-btn refresh-btn"><i class="fas fa-sync-alt"></i> Refresh</button>
            </div>
            <p>Berikut adalah daftar semua penghuni kost yang aktif.</p>`;

        if (penghuniData.length > 0) {
            penghuniData.forEach(data => {
                const isOwnerRoom = data.kamar === 'A1';
                const isAvailable = data.statusKamar === 'Tersedia';

                if (isOwnerRoom) {
                    databaseHtml += `
                        <div class="database-card owner-room">
                            <h4><i class="fas fa-user-tie"></i> Kamar A1 - Pemilik</h4>
                            <div class="database-detail-item"><span>Status</span><span class="database-value">Tidak Disewakan</span></div>
                        </div>`;
                } else if (isAvailable) {
                    // Kamar kosong tidak ditampilkan di halaman publik ini
                    return;
                } else {
                    // === LOGIKA STATUS PEMBAYARAN SEWA ===
                    let statusSewa = 'Lunas';
                    let statusSewaClass = 'status-lunas';
                    let statusSewaIcon = 'fas fa-check-circle';

                    if (data.jatuhTempo && typeof data.jatuhTempo === 'string') {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const parts = data.jatuhTempo.split('-');
                        const jatuhTempo = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        if (jatuhTempo < today) {
                            statusSewa = 'Belum Bayar';
                            statusSewaClass = 'status-menunggak';
                            statusSewaIcon = 'fas fa-exclamation-triangle';
                        }
                    }

                    // === LOGIKA TAGIHAN LISTRIK ===
                    const iuranListrik = parseInt(data.iuranListrik) || 0;
                    let totalTagihan = parseInt(data.nominal) || 0;
                    const statusTagihan = data.statusTagihan || 'Tidak Ada';

                    let tagihanListrikHtml = '';
                    if (statusTagihan === 'Lunas') {
                        tagihanListrikHtml = `<span class="database-value status-lunas">Rp ${formatRupiah(0)}</span>`;
                    } else if (statusTagihan === 'Menunggak') {
                        tagihanListrikHtml = `<span class="database-value status-menunggak">Rp ${formatRupiah(totalTagihan)}</span>`;
                    } else if (statusTagihan === 'Belum Bayar') {
                        tagihanListrikHtml = `<span class="database-value status-menunggak">Rp ${formatRupiah(totalTagihan)}</span>`;
                    }

                    let jumlahBulanHtml = '';
                    if (statusTagihan === 'Menunggak' && data.jumlahBulan > 0) {
                        jumlahBulanHtml = `
                            <div class="database-detail-item">
                                <span>Jumlah Bulan</span>
                                <span class="database-value" style="color: #e74c3c;">${data.jumlahBulan} bulan</span>
                            </div>`;
                    }

                    const statusTagihanIcon = (statusTagihan === 'Lunas') ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
                    const statusTagihanClass = (statusTagihan === 'Lunas') ? 'status-lunas' : 'status-menunggak';

                    const kamarStatusClass = isAvailable ? 'status-tersedia' : 'status-tidak-tersedia';
                    const kamarStatusIcon = isAvailable ? 'fas fa-check-circle' : 'fas fa-times-circle';

                    databaseHtml += `
                        <div class="database-card" data-kamar="${data.kamar}">
                            <h4><i class="fas fa-user"></i> Kamar ${data.kamar} - ${data.nama}</h4>
                            <div class="database-detail-item"><span>No. WhatsApp</span><span class="database-value whatsapp-number">Tersembunyi...</span></div>

                            <div class="database-detail-item"><span>Jatuh Tempo Sewa</span><span class="database-value">${formatDate(data.jatuhTempo)}</span></div>
                            <div class="database-detail-item"><span>Status Pembayaran Sewa</span><span class="database-value ${statusSewaClass}"><i class="${statusSewaIcon}"></i> ${statusSewa}</span></div>
                            <div class="database-detail-item"><span>Pembayaran Terakhir</span><span class="database-value" style="color: #f39c12;">${formatDate(data.bayarTerakhir)}</span></div>

                            <hr style="border: none; height: 1px; background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0)); margin: 15px 0;">

                            <div class="database-detail-item"><span>Tagihan Listrik</span><span class="database-value">${tagihanListrikHtml}</span></div>
                            <div class="database-detail-item"><span>Status Tagihan</span><span class="database-value ${statusTagihanClass}"><i class="${statusTagihanIcon}"></i> ${statusTagihan}</span></div>
                            ${jumlahBulanHtml}
                            <div class="database-detail-item"><span>Status Kamar</span><span class="database-value ${kamarStatusClass}"><i class="${kamarStatusIcon}"></i> ${data.statusKamar || 'Tidak Ada Data'}</span></div>
                        </div>`;
                }
            });
        } else {
            databaseHtml += `<p style="text-align: center; color: var(--light-text-color);">Tidak ada data penghuni yang ditemukan.</p>`;
        }
        contentArea.innerHTML = databaseHtml;
        document.getElementById('refresh-data-btn').addEventListener('click', () => renderViewOnlyDatabase(contentArea));
    } catch (error) {
        contentArea.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">Gagal memuat data penghuni. ${error.message}</p>`;
    }
}




// ===============================================
// ============== DATA TAGIHAN LISTRIK ===============
// ===============================================
function renderTagihanListrik(contentArea) {
    // 1. Salin template HTML ke area konten
    contentArea.innerHTML = document.getElementById('tagihan-listrik-content').innerHTML;
    
    // 2. Tambahkan event listener ke tab filter yang baru saja ditampilkan
    const filterTabs = document.getElementById('electricity-filter-tabs');
    if (filterTabs) {
        filterTabs.addEventListener('click', (e) => {
            const button = e.target.closest('.tab-button');
            if (button) {
                document.querySelectorAll('#electricity-filter-tabs .tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const filterKey = button.dataset.filter.replace('kamar', '');
                const listArea = document.getElementById('electricity-bill-list');
                
                // Panggil fungsi untuk memuat data sesuai tab yang diklik
                renderFilteredElectricityBills(listArea, filterKey);
            }
        });
    }
}

async function renderFilteredElectricityBills(contentArea, filterKey) {
    contentArea.innerHTML = getProgressLoaderHtml('Memuat Data Iuran Listrik...');
    const bar = document.getElementById('progress-bar-inner');
    const percentageText = document.getElementById('progress-percentage');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        bar.style.width = progress + '%';
        percentageText.textContent = progress + '%';
    }, 150);
    try {
        const response = await fetch(`${API_URL}?action=read&sheet=penghuni`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const electricityData = result.data.penghuni;
        const filteredData = electricityData.filter(data => data.kamar.startsWith(filterKey));

        let electricityHtml = ``;
        if (filteredData.length > 0) {
            filteredData.forEach(data => {
                if (data.statusKamar === 'Tersedia') {
                    electricityHtml += `
                        <div class="database-card" data-kamar="${data.kamar}" style="background-color: #f8f9fa; border-left: 5px solid #6c757d;">
                            <h4>Kamar ${data.kamar}</h4>
                            <div class="database-detail-item">
                                <span style="font-weight: 600; color: #28a745;">Kamar ini sedang tidak dihuni.</span>
                            </div>
                            <div class="database-detail-item"><span>Iuran Listrik</span><span class="database-value">-</span></div>
                            <div class="database-detail-item"><span>Status Tagihan</span><span class="database-value">-</span></div>
                        </div>`;
                } else {
                    const iuranListrik = parseInt(data.iuranListrik) || 0;
                    const totalTagihan = parseInt(data.nominal) || 0;
                    const statusIcon = data.statusTagihan === 'Lunas' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
                    const statusClass = data.statusTagihan === 'Lunas' ? 'status-lunas' : 'status-menunggak';

                    let jumlahBulanHtml = '';
                    if (data.statusTagihan === 'Menunggak' && data.jumlahBulan > 0) {
                        jumlahBulanHtml = `
                            <div class="database-detail-item">
                                <span>Jumlah Bulan</span>
                                <span class="database-value" style="color: #e74c3c;">${data.jumlahBulan} bulan</span>
                            </div>`;
                    }
                    
                    let editButtonHtml = '';
                    if (data.kamar !== 'A1') {
                        editButtonHtml = `
                            <div class="card-actions">
                                <button class="form-btn reminder-btn" data-type="listrik" data-nama="${data.nama}" data-kamar="${data.kamar}" data-nominal="${totalTagihan}" data-whatsapp="${data.whatsapp || ''}"><i class="fas fa-bell"></i> Reminder</button>
                                <button class="form-btn edit-btn" data-kamar="${data.kamar}"><i class="fas fa-edit"></i> Edit</button>
                            </div>`;
                    }

                    electricityHtml += `
                        <div class="database-card" data-kamar="${data.kamar}">
                            <h4>Kamar ${data.kamar} - ${data.nama}</h4>
                            <div class="database-detail-item"><span>No. WhatsApp</span><span class="database-value whatsapp-number">${data.whatsapp || 'Tidak ada'}</span></div>
                            <div class="database-detail-item"><span>Iuran Listrik</span><span class="database-value">Rp ${formatRupiah(iuranListrik)}/bulan</span></div>
                            <div class="database-detail-item"><span>Status Tagihan</span><span class="database-value ${statusClass}"><i class="${statusIcon}"></i> ${data.statusTagihan || 'Tidak Ada'}</span></div>
                            ${jumlahBulanHtml}
                            <div class="database-detail-item"><span>Total Tagihan</span><span class="database-value ${statusClass}">Rp ${formatRupiah(totalTagihan)}</span></div>
                            ${editButtonHtml}
                        </div>`;
                }
            });
        } else {
            electricityHtml += `<p style="text-align: center; color: var(--light-text-color);">Tidak ada data kamar di blok ini.</p>`;
        }
        contentArea.innerHTML = electricityHtml;

        contentArea.querySelectorAll('.edit-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const kamarId = e.currentTarget.dataset.kamar;
                const resident = electricityData.find(p => p.kamar === kamarId);
                if (resident) {
                    renderElectricityBillForm(document.getElementById('content-area'), resident);
                }
            });
        });
        
        // Listener baru untuk tombol reminder
        contentArea.querySelectorAll('.reminder-btn').forEach(button => {
             button.addEventListener('click', (e) => {
                e.stopPropagation();
                handleReminderClick(e.currentTarget);
            });
        });

    } catch (error) {
        contentArea.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">Gagal memuat data. ${error.message}</p>`;
    }
}

// GANTI SELURUH FUNGSI renderDatabaseContent ANDA DENGAN INI
async function renderDatabaseContent(contentArea) {
    contentArea.innerHTML = getProgressLoaderHtml('Memuat Database Admin....');
    
    const bar = document.getElementById('progress-bar-inner');
    const percentageText = document.getElementById('progress-percentage');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        if(bar) bar.style.width = progress + '%';
        if(percentageText) percentageText.textContent = progress + '%';
    }, 150);

    try {
        const response = await fetch(`${API_URL}?action=read`);
        const result = await response.json();
        if (!result.success || !result.data || !result.data.penghuni) {
            throw new Error(result.message || 'Gagal mengambil data dari server');
        }
        databaseData.penghuni = result.data.penghuni;

        let html = `
            <div class="database-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
                <h3 style="color: var(--primary-color); margin: 0;">Database Penghuni Kost</h3>
                <div>
                    <button id="susantoro-draft-btn" class="form-btn draft-btn" data-page="susantoro-draft-menu"><i class="fas fa-user-circle"></i> Draft Susantoro</button>
                    <button id="refresh-data-btn" class="form-btn refresh-btn"><i class="fas fa-sync-alt"></i> Refresh</button>
                </div>
            </div>`;

        databaseData.penghuni.forEach(data => {
            const isOwnerRoom = data.kamar === 'A1';
            const isAvailable = data.statusKamar === 'Tersedia';
            let cardClass = isOwnerRoom ? 'owner-room' : (isAvailable ? 'available-room' : '');

            if (isOwnerRoom) {
                // Tampilan Kartu Pemilik (A1)
                html += `
                    <div class="database-card ${cardClass}" data-kamar="${data.kamar}">
                        <h4>Kamar ${data.kamar} - ${data.nama}</h4>
                        <div class="database-detail-item"><span>No. WhatsApp</span><span class="database-value" style="color: var(--accent-color); font-weight: 600;">Terkonfirmasi!</span></div>
                        <div class="database-detail-item"><span>Status Pembayaran</span><span class="database-value status-lunas"><i class="fas fa-check-circle"></i> Lunas</span></div>
                        <div class="database-detail-item"><span>Status Kamar</span><span class="database-value status-menunggak"><i class="fas fa-times-circle"></i> Tidak Disewakan!</span></div>
                    </div>`;
            } 
            else if (isAvailable) {
                // Tampilan ringkas untuk kamar KOSONG
                html += `
                    <div class="database-card ${cardClass}" data-kamar="${data.kamar}">
                        <h4>Kamar ${data.kamar} - <i>Kosong</i></h4>
                        <div class="database-detail-item">
                            <span>Status Pembayaran</span>
                            <span class="database-value" style="color: #f39c12; font-size: 1.2em;" title="Tidak berlaku untuk kamar kosong">
                                <i class="fas fa-exclamation-triangle"></i>
                            </span>
                        </div>
                        <div class="database-detail-item">
                            <span>Status Kamar</span>
                            <span class="database-value status-tersedia"><i class="fas fa-check-circle"></i> ${data.statusKamar}</span>
                        </div>
                        <div class="card-actions">
                            <button class="form-btn edit-btn" data-kamar="${data.kamar}"><i class="fas fa-edit"></i> Edit</button>
                        </div>
                    </div>`;
            } else {
                // Tampilan untuk kamar yang DIHUNI dengan TATA LETAK BARU
                
                // >>> LOGIKA STATUS PEMBAYARAN SEWA <<<<<
                let statusSewa = 'Lunas';
                let statusSewaClass = 'status-lunas';
                let statusSewaIcon = 'fas fa-check-circle';

                if (data.jatuhTempo && typeof data.jatuhTempo === 'string') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const parts = data.jatuhTempo.split('-');
                    const jatuhTempo = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    if (jatuhTempo < today) {
                        statusSewa = 'Belum Bayar';
                        statusSewaClass = 'status-menunggak';
                        statusSewaIcon = 'fas fa-exclamation-triangle';
                    }
                }
                
                // >>> LOGIKA TAGIHAN LISTRIK DENGAN PERBAIKAN <<<
                const iuranListrik = parseInt(data.iuranListrik) || 0;
                let totalTagihanListrik = 0;
                const statusTagihan = data.statusTagihan || 'Belum Bayar';
                
                if (statusTagihan === 'Belum Bayar') {
                    totalTagihanListrik = iuranListrik;
                } else if (statusTagihan === 'Menunggak') {
                    totalTagihanListrik = iuranListrik * (parseInt(data.jumlahBulan) || 0);
                }

                let tagihanListrikHtml = '';
                if (statusTagihan === 'Lunas') {
                    tagihanListrikHtml = `<span class="database-value status-lunas">Rp ${formatRupiah(0)}</span>`;
                } else if (statusTagihan === 'Menunggak' || statusTagihan === 'Belum Bayar') {
                    tagihanListrikHtml = `<span class="database-value status-menunggak">Rp ${formatRupiah(totalTagihanListrik)}</span>`;
                }
                
                let jumlahBulanHtml = '';
                if (statusTagihan === 'Menunggak' && data.jumlahBulan > 0) {
                    jumlahBulanHtml = `
                        <div class="database-detail-item">
                            <span>Jumlah Bulan</span>
                            <span class="database-value" style="color: #e74c3c;">${data.jumlahBulan} bulan</span>
                        </div>`;
                }

                const statusTagihanIcon = (statusTagihan === 'Lunas') ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
                const statusTagihanClass = (statusTagihan === 'Lunas') ? 'status-lunas' : 'status-menunggak';


                const canViewId = data.FileLink && data.nik;
                const viewIdHtml = canViewId 
                    ? `<button class="view-id-btn" data-url="${data.FileLink}">Lihat</button>` 
                    : `<button class="view-id-btn disabled-btn" disabled>Lihat</button>`;
                
                html += `
                    <div class="database-card ${cardClass}" data-kamar="${data.kamar}">
                        <h4 style="line-height: 1.3; margin-bottom: 20px;">
                            Kamar ${data.kamar} - ${data.nama}<br>
                            <span style="font-weight: normal; font-size: 0.9em;">NIK: ${data.nik || '-'}</span>
                        </h4>
                        
                        <div class="database-detail-item"><span>ID KTP/SIM <span class="upload-file-text">(Upload File)</span></span><span class="database-value">${viewIdHtml}</span></div>
                        <div class="database-detail-item"><span>No. WhatsApp</span><span class="database-value whatsapp-number">${data.whatsapp || '-'}</span></div>
                        <div class="database-detail-item"><span>Tempat, Tanggal Lahir</span><span class="database-value">${data.ttl || '-'}</span></div>
                        <div class="database-detail-item"><span>Alamat</span><span class="database-value">${data.alamat || '-'}</span></div>
                        <div class="database-detail-item"><span>Status</span><span class="database-value">${data.status || '-'}</span></div>

                        <hr style="border: none; height: 1px; background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0)); margin: 15px 0;">

                        <div class="database-detail-item"><span>Jumlah Pembayaran</span><span class="database-value">Rp ${formatRupiah(data.nominal || '0')}</span></div>
                        <div class="database-detail-item"><span>Status Pembayaran</span><span class="database-value ${statusSewaClass}"><i class="${statusSewaIcon}"></i> ${statusSewa}</span></div>
                        <div class="database-detail-item"><span>Jatuh Tempo</span><span class="database-value">${formatDate(data.jatuhTempo)}</span></div>
                        <div class="database-detail-item"><span>Pembayaran Terakhir</span><span class="database-value" style="color: #f39c12;">${formatDate(data.bayarTerakhir)}</span></div>
                        <hr style="border: none; height: 1px; background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.1), rgba(0,0,0,0)); margin: 15px 0;">

                        <div class="database-detail-item"><span>Tagihan Listrik</span><span class="database-value">${tagihanListrikHtml}</span></div>
                        <div class="database-detail-item"><span>Status Tagihan</span><span class="database-value ${statusTagihanClass}"><i class="${statusTagihanIcon}"></i> ${statusTagihan}</span></div>
                        ${jumlahBulanHtml}

                        <div class="database-detail-item"><span>Status Kamar</span><span class="database-value status-tidak-tersedia"><i class="fas fa-times-circle"></i> ${data.statusKamar}</span></div>
                        
                        <div class="card-actions">
                            <button class="form-btn generate-btn" data-nama="${data.nama}" data-kamar="${data.kamar}" data-nominal="${data.nominal}" data-jatuh-tempo="${data.jatuhTempo}" data-whatsapp="${data.whatsapp || ''}"><i class="fas fa-receipt"></i> e-Kwitansi</button>
                            <button class="form-btn reminder-btn" data-nama="${data.nama}" data-kamar="${data.kamar}" data-nominal="${data.nominal}" data-jatuh-tempo="${data.jatuhTempo}" data-whatsapp="${data.whatsapp || ''}"><i class="fas fa-bell"></i></button>
                            <button class="form-btn edit-btn" data-kamar="${data.kamar}"><i class="fas fa-edit"></i> Edit</button>
                        </div>
                    </div>`;
            }
        });
        
        clearInterval(interval);
        if(bar) bar.style.width = '100%';
        if(percentageText) percentageText.textContent = '100%';
        
        setTimeout(() => {
            contentArea.innerHTML = html;
        }, 300);

    } catch (error) {
        clearInterval(interval);
        contentArea.innerHTML = `<div class="error-message">Gagal memuat data. Silakan coba lagi. <br><small>${error.message}</small></div>`;
    }
}

async function handleElectricityBillFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = {
        action: 'update',
        sheet: 'penghuni',
        kamar: form.querySelector('#electricity-bill-form-kamar').value,
        iuranListrik: form.querySelector('#iuranListrik').value,
        statusTagihan: form.querySelector('#statusTagihan').value,
        jumlahBulan: form.querySelector('#jumlahBulan').value,
        nominal: form.querySelector('#total-tagihan-hidden').value,
    };

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menyimpan...';

    try {
        const response = await fetch(API_URL, { 
            method: 'POST', 
            // Menggunakan URLSearchParams untuk mengirim data form dengan benar
            body: new URLSearchParams(data) 
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        showCustomAlert(result.message);
        displayContent('tagihan-listrik');
    } catch (error) {
        showCustomAlert(`Gagal menyimpan: ${error.message}`);
        submitButton.disabled = false;
        submitButton.textContent = 'Simpan';
    }
}


// ===============================================
// ============== DATA TAGIHAN LISTRIK READONLY=========
// ===============================================
function renderIuranListrikReadOnly(contentArea) {
    // 1. Salin template HTML ke area konten
    contentArea.innerHTML = document.getElementById('iuran-listrik-readonly-content').innerHTML;

    // 2. Tambahkan event listener ke tab filter yang baru saja ditampilkan
    const filterTabs = document.getElementById('electricity-filter-tabs-readonly');
    if (filterTabs) {
        filterTabs.addEventListener('click', (e) => {
            const button = e.target.closest('.tab-button');
            if (button) {
                // Hapus kelas 'active' dari semua tombol dan tambahkan ke yang diklik
                document.querySelectorAll('#electricity-filter-tabs-readonly .tab-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                const filterKey = button.dataset.filter; // Ambil filter (A, B, C, atau D)
                const listArea = document.getElementById('electricity-bill-list-readonly');
                
                // Panggil fungsi untuk memuat data sesuai tab yang diklik
                renderFilteredViewOnlyElectricityBills(listArea, filterKey);
            }
        });
    }
}

async function renderFilteredViewOnlyElectricityBills(listArea, filterKey) {
    listArea.innerHTML = getProgressLoaderHtml('Memuat Iuran Listrik...');
    const bar = document.getElementById('progress-bar-inner');
    const percentageText = document.getElementById('progress-percentage');
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        bar.style.width = progress + '%';
        percentageText.textContent = progress + '%';
    }, 150);
    try {
        const response = await fetch(`${API_URL}?action=read&sheet=penghuni`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const electricityData = result.data.penghuni;
        const filteredData = electricityData.filter(data => data.kamar.startsWith(filterKey) && data.statusKamar !== 'Tersedia');
        
        let electricityHtml = ``;
        if (filteredData.length > 0) {
            filteredData.forEach(data => {
                // PENAMBAHAN LOGIKA: Cek apakah kamar ini adalah kamar pemilik (A1)
                if (data.kamar === 'A1') {
                    // Jika ya, buat kartu khusus pemilik
                    electricityHtml += `
                        <div class="database-card owner-room">
                            <h4><i class="fas fa-user-tie"></i> Kamar A1 - Pemilik</h4>
                            <div class="database-detail-item"><span>Status</span><span class="database-value">Tidak Dikenakan Iuran</span></div>
                        </div>`;
                } else {
                    // Jika bukan, gunakan logika yang sudah ada untuk penghuni biasa
                    const iuranListrik = parseInt(data.iuranListrik) || 0;
                    let totalTagihan = parseInt(data.nominal) || 0;
                    const statusIcon = data.statusTagihan === 'Lunas' ? 'fas fa-check-circle' : 'fas fa-exclamation-triangle';
                    const statusClass = data.statusTagihan === 'Lunas' ? 'status-lunas' : 'status-menunggak';
                    
                    if (data.statusTagihan === 'Lunas') {
                        totalTagihan = 0;
                    }

                    let jumlahBulanHtml = '';
                    if (data.statusTagihan === 'Menunggak' && data.jumlahBulan > 0) {
                        jumlahBulanHtml = `
                            <div class="database-detail-item">
                                <span>Jumlah Bulan</span>
                                <span class="database-value" style="color: #e74c3c;">${data.jumlahBulan} bulan</span>
                            </div>`;
                    }

                    electricityHtml += `
                        <div class="database-card" data-kamar="${data.kamar}">
                            <h4>Kamar ${data.kamar} - ${data.nama}</h4>
                            <div class="database-detail-item"><span>No. WhatsApp</span><span class="database-value whatsapp-number">Tersembunyi...</span></div>
                            <div class="database-detail-item"><span>Iuran Listrik</span><span class="database-value">Rp ${formatRupiah(iuranListrik)}/bulan</span></div>
                            <div class="database-detail-item"><span>Status Tagihan</span><span class="database-value ${statusClass}"><i class="${statusIcon}"></i> ${data.statusTagihan || 'Tidak Ada'}</span></div>
                            ${jumlahBulanHtml}
                            <div class="database-detail-item"><span>Total Tagihan</span><span class="database-value ${statusClass}">Rp ${formatRupiah(totalTagihan)}</span></div>
                        </div>`;
                }
            });
        } else {
            electricityHtml += `<p style="text-align: center; color: var(--light-text-color);">Tidak ada data tagihan listrik di blok ini.</p>`;
        }
        listArea.innerHTML = electricityHtml;
    } catch (error) {
        listArea.innerHTML = `<p style="text-align: center; color: var(--light-text-color);">Gagal memuat data. ${error.message}</p>`;
    }
}


// ===============================================
// ============== DATA SHEET ===============
// ===============================================
document.addEventListener('change', (e) => {
    if (e.target.name === 'select-row' && e.target.type === 'radio') {
        selectedRowId = e.target.value;
        console.log("Selected row ID:", selectedRowId);
    }
});

async function renderDataSheetContent(contentArea) {
    // 1. Langsung tampilkan loading state di seluruh area konten
    contentArea.innerHTML = getProgressLoaderHtml('Memuat Data Sheet....');
    const bar = document.getElementById('progress-bar-inner');
    const percentageText = document.getElementById('progress-percentage');
    let progress = 0;
    
    const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 10) + 5;
        if (progress >= 95) {
            progress = 95;
            clearInterval(interval);
        }
        if(bar) bar.style.width = progress + '%';
        if(percentageText) percentageText.textContent = progress + '%';
    }, 150);

    try {
        const response = await fetch(`${API_DATA_SHEET}?action=read`);
        const result = await response.json();
        
        // 2. Setelah data dimuat, hentikan animasi dan render konten tabel
        clearInterval(interval);

        if (!result.success) {
            throw new Error(result.message);
        }
        
        // Render semua konten tabel sekaligus
        let htmlContent = document.getElementById('datasheet-content').innerHTML;
        contentArea.innerHTML = htmlContent;

        const tableBody = contentArea.querySelector('#data-table tbody');
        if (result.data && result.data.length > 0) {
            tableBody.innerHTML = buildTableRows(result.data);
        } else {
           contentArea.innerHTML = getProgressLoaderHtml('Memuat data...');
        }
    } catch (error) {
        // 3. Jika gagal, hentikan animasi dan tampilkan pesan error
        clearInterval(interval);
        console.error('Error saat memuat data sheet:', error);
        contentArea.innerHTML = `<p style="text-align: center; color: #e74c3c; padding: 20px;">Gagal memuat data: ${error.message}</p>`;
    }
}

// Ganti seluruh fungsi buildTableRows Anda dengan kode ini
function buildTableRows(data) {
    if (!data || data.length === 0) {
        return `<tr><td colspan="9" style="text-align: center;">Tidak ada data yang ditemukan.</td></tr>`;
    }
    return data.map((item, index) => `
        <tr data-id="${item.id}">
            <td>
                <label class="radio-container">
                    <input type="radio" name="select-row" value="${item.id}">
                    <span class="radio-custom"></span>
                </label>
            </td>
            <td>${index + 1}</td>
            <td>${item.kamar || '-'}</td>
            <td>${item.nama || '-'}</td>
            <td>
                ${item.FileLink && item.FileLink !== '-' ? 
                    `<a href="#" class="view-id-btn" data-url="${item.FileLink}">Lihat ID</a>` : 
                    `<span>Data tidak ada</span>`}
            </td>
            <td></td>
            <td>${item.tanggal || '-'}</td>
            <td>${item.deskripsi || '-'}</td>
            <td>${item.status || '-'}</td>
        </tr>
    `).join('');
}


/**
 * Menampilkan modal dengan pratinjau gambar dari Google Drive.
 * @param {string} imageUrl - URL asli dari Google Drive yang disimpan di spreadsheet.
 */
function showIdModal(imageUrl) {
    // 1. Validasi
    if (!imageUrl || imageUrl.trim() === '-' || !imageUrl.includes('drive.google.com')) {
        showCustomAlert("Tidak ada file ID yang valid untuk ditampilkan.");
        return;
    }

    // 2. Ekstrak ID file dari URL Google Drive
    let fileId = null;
    try {
        const urlParams = new URL(imageUrl).searchParams;
        fileId = urlParams.get('id');
    } catch (e) {
        showCustomAlert("Format URL file tidak valid.");
        return;
    }

    if (!fileId) {
        showCustomAlert("Gagal mendapatkan ID file dari URL.");
        return;
    }

    // 3. Buat URL baru yang menunjuk ke skrip Anda sendiri dengan aksi 'getImage'
    const proxyImageUrl = `${API_URL}?action=getImage&id=${fileId}`;

    // 4. Siapkan elemen modal
    const modal = document.getElementById('id-modal-backdrop');
    const iframePreview = document.getElementById('id-iframe-preview'); // Kita akan menggunakan iframe
    const imageLink = document.getElementById('id-image-link');

    // 5. Tampilkan gambar di dalam iframe
    iframePreview.src = proxyImageUrl;
    
    if (imageLink) {
        imageLink.href = imageUrl; 
    }
    modal.classList.remove('hidden');
    modal.classList.add('show');
}


// ===============================================
// === FUNGSI TAMBAHAN UNTUK CRUD DATA SHEET ===
// ===============================================

async function handleDataSheetAdd(target) {
    const kamar = prompt("Kamar:");
    if (!kamar) return;
    const tanggal = prompt("Tanggal:");
    if (!tanggal) return;
    const deskripsi = prompt("Deskripsi:");
    if (!deskripsi) return;
    const status = prompt("Status:");
    if (!status) return;

    await sendDataSheetRequest('create', { kamar, tanggal, deskripsi, status });
}


// GANTI FUNGSI LAMA DENGAN VERSI BARU INI
async function handleDataSheetEdit() {
    if (!selectedRowId) {
        showCustomAlert("Pilih baris data yang ingin Anda edit terlebih dahulu.");
        return;
    }

    // Ambil data dari baris tabel yang dipilih
    const row = document.querySelector(`tr[data-id="${selectedRowId}"]`);
    if (!row) {
        showCustomAlert("Baris yang dipilih tidak ditemukan. Coba refresh halaman.");
        return;
    }

    const data = {
        id: selectedRowId,
        kamar: row.cells[2].textContent,
        nama: row.cells[3].textContent,
        tanggal: row.cells[6].textContent,
        deskripsi: row.cells[7].textContent,
        status: row.cells[8].textContent
    };
    
    // Isi form di dalam modal dengan data
    document.getElementById('datasheet-edit-id').value = data.id;
    document.getElementById('datasheet-edit-kamar').value = data.kamar;
    document.getElementById('datasheet-edit-nama').value = data.nama;
    document.getElementById('datasheet-edit-tanggal').value = formatDateToYyyyMmDd(data.tanggal);
    document.getElementById('datasheet-edit-deskripsi').value = data.deskripsi;
    document.getElementById('datasheet-edit-status').value = data.status;

    // Tampilkan modal yang "keren"
    const modal = document.getElementById('datasheet-edit-modal-backdrop');
    modal.classList.remove('hidden');
    modal.classList.add('show');
    document.body.classList.add('modal-open');
}

// TAMBAHKAN FUNGSI BARU INI
async function sendDataSheetRequest(action, data) {
    const formData = new FormData();
    formData.append('action', action);
    for (const key in data) {
        formData.append(key, data[key]);
    }

    try {
        const response = await fetch(API_DATA_SHEET, {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message || 'Terjadi kesalahan di server.');
        }
        showCustomAlert(result.message || 'Operasi berhasil!');
        renderDataSheetContent(document.getElementById('content-area')); // Muat ulang data
    } catch (error) {
        showCustomAlert(`Gagal: ${error.message}`);
    }
}

// ===============================================
// ============== LIVE CHAT FORM WHATSAPP ===============
// ===============================================
function renderLiveChatForm(contentArea) {
    // 1. Membuat HTML untuk form
    const formHtml = `
        <div class="database-form-container">
            <h3 style="color: var(--primary-color); margin-bottom: 20px;">Live Chat dan Kirim Pesan</h3>
            <p>Silakan isi form di bawah ini untuk menanyakan ketersediaan kamar. Pesan akan dikirimkan melalui WhatsApp.</p>
            <form id="livechat-form" class="database-form">
                <label for="chat-nama">Nama:</label>
                <input type="text" id="chat-nama" name="nama" placeholder="Masukkan nama lengkap Anda" required>
                
                <label for="chat-whatsapp">Nomor WhatsApp:</label>
                <input type="tel" id="chat-whatsapp" name="whatsapp" placeholder="Contoh: 81234567890" required>
                
                <label for="chat-alamat">Alamat Asal:</label>
                <input type="text" id="chat-alamat" name="alamat" placeholder="Contoh: Jakarta" required>
                
                <label for="chat-status">Status:</label>
                <select id="chat-status" name="status" required>
                    <option value="" disabled selected>Pilih status Anda</option>
                    <option value="Mahasiswa">Mahasiswa</option>
                    <option value="Bekerja">Bekerja</option>
                    <option value="Umum">Umum</option>
                </select>
                
                <div class="form-actions" style="margin-top: 25px;">
                    <button type="submit" class="form-btn" style="background-color: #25D366; width: 100%;">
                        <i class="fab fa-whatsapp"></i> Kirim via WhatsApp
                    </button>
                </div>
            </form>
        </div>
    `;
    
    // 2. Menampilkan form ke halaman
    contentArea.innerHTML = formHtml;

    // 3. Menambahkan event listener ke form yang baru dibuat
    const liveChatForm = document.getElementById('livechat-form');
    if (liveChatForm) {
        liveChatForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Mencegah form mengirim data secara normal

            // Ambil data dari setiap input
            const nama = document.getElementById('chat-nama').value;
            const whatsapp = document.getElementById('chat-whatsapp').value;
            const alamat = document.getElementById('chat-alamat').value;
            const status = document.getElementById('chat-status').value;

            // Nomor WhatsApp tujuan (pengelola kost)
            const targetWhatsappNumber = '628156818286'; // Ganti jika perlu

            // Buat template pesan sesuai permintaan
            const message = `
Yth. Bapak/Ibu kost,
saya di bawah ini:
- Nama: ${nama}
- Nomor WhatsApp: ${whatsapp}
- Alamat Asal: ${alamat}
- Status: ${status}

Terkait ini saya mau menanyakan perihal sewa kamar, apakah ada yang tersedia? Terima kasih.
            `;

            // Buat URL WhatsApp dan buka di tab baru
            const whatsappUrl = `https://wa.me/${targetWhatsappNumber}?text=${encodeURIComponent(message.trim())}`;
            window.open(whatsappUrl, '_blank');
        });
    }
}


// ===============================================
// ============== PASSWORD WIFI DATA ===============
// ===============================================
const wifiData = {
    kamarA: [
        { title: 'Kamar A1', username: 'user A1', password: '426958' }, 
        { title: 'Kamar A2', username: 'user A2', password: '984263' }, 
        { title: 'Kamar A3', username: 'user A3', password: '569926' }, 
        { title: 'Kamar A4', username: 'user A4', password: '685862' }, 
        { title: 'Kamar A5', username: 'user A5', password: '486832' }, 
        { title: 'Kamar A6', username: 'user A6', password: '464333' }, 
        { title: 'Kamar A7', username: 'user A7', password: '425859' }, 
        { title: 'Kamar A8', username: 'user A8', password: '953494' }, 
        { title: 'Kamar A9', username: 'user A9', password: '538737' }
    ],
    kamarB: [
        { title: 'Kamar B1', username: 'user B1', password: '948244' }, 
        { title: 'Kamar B2', username: 'user B2', password: '554458' }, 
        { title: 'Kamar B3', username: 'user B3', password: '897728' }, 
        { title: 'Kamar B4', username: 'user B4', password: '223873' }, 
        { title: 'Kamar B5', username: 'user B5', password: '884626' }, 
        { title: 'Kamar B6', username: 'user B6', password: '843624' }
    ],
    kamarC: [
        { title: 'Kamar C1', username: 'user C1', password: '777629' }, 
        { title: 'Kamar C2', username: 'user C2', password: '679635' }, 
        { title: 'Kamar C3', username: 'user C3', password: '525227' }, 
        { title: 'Kamar C4', username: 'user C4', password: '267873' }, 
        { title: 'Kamar C5', username: 'user C5', password: '996328' }, 
        { title: 'Kamar C6', username: 'user C6', password: '474875' }
    ],
    kamarD: [
        { title: 'Kamar D1', username: 'user D1', password: '282647' }, 
        { title: 'Kamar D2', username: 'user D2', password: '967368' }, 
        { title: 'Kamar D3', username: 'user D3', password: '356242' }, 
        { title: 'Kamar D4', username: 'user D4', password: '639879' }, 
        { title: 'Kamar D5', username: 'user D5', password: '958544' }, 
        { title: 'Kamar D6', username: 'user D6', password: '286895' }, 
        { title: 'Kamar D7', username: 'user D7', password: '239684' }, 
        { title: 'Kamar D8', username: 'user D8', password: '764844' }, 
        { title: 'Kamar D9', username: 'user D9', password: '526399' }, 
        { title: 'Kamar D10', username: 'user D10', password: '334868' }
    ],
    userAccess: [
        { title: 'Access Space Kamar A', username: 'user-acs A', password: '627228' }, 
        { title: 'Access Space Kamar B', username: 'user-acs B', password: '282926' }, 
        { title: 'Access Space Kamar C', username: 'user-acs C', password: '182828' }, 
        { title: 'Access Space Kamar D', username: 'user-acs D', password: '728251' }
    ],
    userTamu: [
        { title: 'User Tamu', username: 'user-tamu', password: '08/2025' }, 
        { title: 'Voucher Family', username: null, password: 'FAMILY_V2025' }
    ],
    all: []
};
wifiData.all = [
    ...wifiData.kamarA, 
    ...wifiData.kamarB, 
    ...wifiData.kamarC, 
    ...wifiData.kamarD, 
    ...wifiData.userAccess, 
    ...wifiData.userTamu
];

function renderWifiContent(filterKey) {
    const dataToRender = wifiData[filterKey];
    let wifiHtml = '';
    if (dataToRender) {
        wifiHtml += `<div class="wifi-grid">`;
        dataToRender.forEach((wifi, index) => {
            const uniqueId = `wifi-pass-${filterKey}-${index}`;
            const fullText = `Nama Wifi:\n*KOST PUTRA BU YANI*\n\nUsername:\n> ${wifi.username || 'Tidak ada'}\nPassword:\n> ${wifi.password}`;
            wifiHtml += `<div class="wifi-card-item"><h2>${wifi.title}</h2><pre class="text-box" id="${uniqueId}">${fullText}</pre><div class="button-group"><button class="copy-btn" data-target="${uniqueId}"><i class="fas fa-copy"></i> Salin</button><button class="wifi-share-wa-btn" data-target="${uniqueId}"><i class="fab fa-whatsapp"></i> Share</button></div></div>`;
        });
        wifiHtml += `</div>`;
    }
    return wifiHtml;
}
function handleWifiFilter(target) {
    const filterKey = target.closest('.filter-modal-btn').dataset.filter;
    document.getElementById('wifi-content-grid').innerHTML = renderWifiContent(filterKey);
    document.getElementById('wifi-content-grid').classList.remove('hidden');
    document.getElementById('wifi-filter-modal-backdrop').classList.remove('show');
}

function handleCloseModal(target) {
    const modal = target.closest('#password-modal-backdrop, #wifi-filter-modal-backdrop, #custom-alert-backdrop, #setup-modal-backdrop, #receipt-preview-modal-backdrop, #booking-modal-backdrop');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.classList.add('hidden'), 300);
        document.body.classList.remove('modal-open');
    }
}


// ===============================================
// ============== SERVER & CCTV ===============
// ===============================================
function renderCctvContent(contentArea) {
    const mainAccount = { title: 'Informasi Perangkat Login', username: 'mbahteh@gmail.com', password: 'parinten123' };
    contentArea.innerHTML = `
        <div class="cctv-main-card">
            <i class="fas fa-video cctv-icon-anim"></i>
            <h4 class="cctv-main-title">${mainAccount.title}</h4>
            <div class="cctv-info-section">
                <div class="cctv-detail">
                    <span class="cctv-label">Username</span>
                    <div class="cctv-value-container">
                        <span id="cctv-username-1" class="cctv-value">${mainAccount.username}</span>
                        <button class="copy-btn" data-target="cctv-username-1"><i class="fas fa-copy"></i></button>
                    </div>
                </div>
                <div class="cctv-detail">
                    <span class="cctv-label">Password</span>
                    <div class="cctv-value-container">
                        <span id="cctv-password-1" class="cctv-value">${mainAccount.password}</span>
                        <button class="copy-btn" data-target="cctv-password-1"><i class="fas fa-copy"></i></button>
                    </div>
                </div>
            </div>
        </div>
        <div class="cctv-secondary-content-container">
            ${document.getElementById('cctv-secondary-content').innerHTML}
        </div>
        <p style="font-size: 0.9em; color: var(--light-text-color); margin-top: 20px; text-align: center;">
            Harap gunakan informasi ini dengan bijak dan bertanggung jawab.
        </p>`;
}

function renderServerContent(contentArea) {
    const serverData = [
        { title: 'ROUTER INDIBIZ', accounts: [{ type: 'Admin', username: 'admin', password: 'Telkomdso123', link: 'http://192.168.1.1/' }, { type: 'User', username: 'user', password: 'AdmRT Indibiz#2025*', link: 'http://192.168.1.1/' }] }, 
        { title: 'ROUTER ZTE 670', accounts: [{ type: 'Admin', username: 'admin', password: 'Telkomdso123', link: 'http://192.168.1.2/' }, { type: 'User', username: 'user', password: 'AdmRT ZTEIndibiz2025#', link: 'http://192.168.1.2/' }] }, 
        { title: 'SETTING MIKROTIK (Menggunakan WinBox)', accounts: [{ type: 'Admin', username: 'admin', password: '123', link: 'Ip: Server Akses' }] }, 
        { title: 'SETTING MIKHMON', accounts: [{ type: 'Mikhmon', username: 'mikhmon', password: '1234', link: 'Ip:Server Mikhmon' }] }, 
        { title: 'CATATAN AKSES VIA SERVER VPN', accounts: [{ type: 'VPN MIKROTIK', username: 'admin', password: '123', link: 'https://vpn-oosnetwork.com:3399/258989036384' }, { type: 'User', username: 'admin', password: null, link: '/' }] }, 
        { title: 'Member Area', accounts: [{ type: 'Member', username: '258989036384', password: '1234', link: 'https://client-oosnetwork.my.id' }] }
    ];

    let serverHtml = `<h3 style="color: var(--primary-color); margin-bottom: 20px;">Informasi Akses Server</h3>`;
    serverData.forEach((section) => {
        serverHtml += `<div class="server-card"><h4>${section.title}</h4><div class="server-details-grid">`;
        section.accounts.forEach((account, index) => {
            const uniqueId = `server-info-${section.title.replace(/\s+/g, '-')}-${index}`;
            if (account.username) serverHtml += `<div class="detail-item"><span class="detail-label">${account.type} Username</span><div class="detail-value-container"><span id="${uniqueId}-user" class="detail-value">${account.username}</span><button class="copy-btn" data-target="${uniqueId}-user"><i class="fas fa-copy"></i></button></div></div>`;
            if (account.password) serverHtml += `<div class="detail-item"><span class="detail-label">${account.type} Password</span><div class="detail-value-container"><span id="${uniqueId}-pass" class="detail-value">${account.password}</span><button class="copy-btn" data-target="${uniqueId}-pass"><i class="fas fa-copy"></i></button></div></div>`;
            if (account.link) {
                const isUrl = account.link.startsWith('http');
                serverHtml += `<div class="detail-item full-width-link"><span class="detail-label">Alamat atau Link</span><div class="detail-value-container">${isUrl ? `<a href="${account.link}" target="_blank" class="detail-link">${account.link}</a>` : `<span id="${uniqueId}-link" class="detail-value">${account.link}</span>`}${!isUrl ? `<button class="copy-btn" data-target="${uniqueId}-link"><i class="fas fa-copy"></i></button>` : ''}</div></div>`;
            }
        });
        serverHtml += `</div></div>`;
    });
    contentArea.innerHTML = serverHtml;
}



// ===============================================
// ============== FILTER TAB TENTANG KOS =========
// ===============================================
function setupTentangKosTabs() {
    const tabContainer = document.querySelector('#dynamic-content .tab-container');
    if (!tabContainer) return;

    // --- BAGIAN PENTING: MENGISI GALERI FOTO ---
    const galleryGrid = tabContainer.querySelector('.gallery-grid');
    const imageSources = document.querySelectorAll('#gallery-images-list img');
    
    // Cek agar galeri tidak diisi berulang kali
    if (galleryGrid && galleryGrid.children.length === 0) {
        imageSources.forEach(imgSource => {
            const img = document.createElement('img');
            img.src = imgSource.src;
            img.alt = imgSource.alt;
            galleryGrid.appendChild(img);
        });
    }
    // --- AKHIR BAGIAN PENTING ---

    const tabButtons = tabContainer.querySelectorAll('.tab-button');
    const tabPanes = tabContainer.querySelectorAll('.tab-pane');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Logika untuk mengganti tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            tabPanes.forEach(pane => {
                pane.classList.add('hidden');
                pane.classList.remove('active');
            });

            const targetTabId = `tab-${button.dataset.tab}`;
            const targetPane = tabContainer.querySelector(`#${targetTabId}`);
            if (targetPane) {
                targetPane.classList.remove('hidden');
                targetPane.classList.add('active');
            }
        });
    });

    // ===============================================
    // ===== LOGIKA UNTUK LIGHTBOX (POP-UP GAMBAR) ===
    // ===============================================
    const lightbox = document.querySelector('.lightbox');
    const lightboxImage = document.querySelector('.lightbox-image');
    const galleryImages = tabContainer.querySelectorAll('.gallery-grid img');
    let currentIndex = 0;

    if (!lightbox || !lightboxImage || galleryImages.length === 0) return;

    const showImage = (index) => {
        lightboxImage.src = galleryImages[index].src;
        currentIndex = index;
        lightbox.classList.add('active');
    };

    galleryImages.forEach((img, index) => {
        img.addEventListener('click', () => showImage(index));
    });

    document.querySelector('.lightbox-close').addEventListener('click', () => lightbox.classList.remove('active'));
    document.querySelector('.lightbox-prev').addEventListener('click', () => {
        currentIndex = (currentIndex > 0) ? currentIndex - 1 : galleryImages.length - 1;
        showImage(currentIndex);
    });
    document.querySelector('.lightbox-next').addEventListener('click', () => {
        currentIndex = (currentIndex < galleryImages.length - 1) ? currentIndex + 1 : 0;
        showImage(currentIndex);
    });
}

    // ===============================================
    // ===== MODAL WHATSAPP ===
    // ===============================================

function showBookingModal(roomNumber) {
    const modal = document.getElementById('booking-modal-backdrop');
    modal.querySelector('#booking-room-number').textContent = roomNumber;
    modal.querySelector('#booking-form-room').value = roomNumber;
    modal.classList.remove('hidden');
    modal.classList.add('show');
}





// ===============================================
// ============== MENU SETUP POPUP =================
// ===============================================
function handleMenuClick(menuCard) {
    const pageId = menuCard.dataset.page;
    if (pageId === 'setup') {
        document.getElementById('setup-modal-backdrop').classList.add('show');
        return;
    }
    if (menuCard.closest('#setup-modal')) {
        const modal = document.getElementById('setup-modal-backdrop');
        modal.classList.remove('show');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
    
    if (menuCard.classList.contains('password-protected')) {
        currentPageId = pageId;
        const modal = document.getElementById('password-modal-backdrop');
        modal.classList.remove('hidden');
        modal.classList.add('show');
        modal.querySelector('#modal-submit-btn').dataset.targetPassword = '12';
    } else {
        displayContent(pageId);
    }
}


// ===============================================
// ============== PASSWORD & SETTING =================
// ===============================================
function handlePasswordModal(target) {
    const modal = document.getElementById('password-modal-backdrop');
    if (target.id === 'modal-cancel-btn') {
        modal.classList.remove('show');
    } else if (target.id === 'modal-submit-btn') {
        const passwordInput = document.getElementById('password-input');
        if (passwordInput.value === target.dataset.targetPassword) {
            modal.classList.remove('show');
            displayContent(currentPageId);
            passwordInput.value = '';
            document.getElementById('password-error').classList.add('hidden');
        } else {
            document.getElementById('password-error').classList.remove('hidden');
        }
    }
}


// ===== START: BLOK KODE PERBAIKAN KWITANSI (Salin semua di bawah ini) =====

/**
 * Mengubah angka menjadi teks terbilang Rupiah.
 */
function numberToText(n) {
    if (n === null || n === undefined) return "Nol";
    n = parseInt(String(n).replace(/\./g, ''));
    const units = ["", "Satu", "Dua", "Tiga", "Empat", "Lima", "Enam", "Tujuh", "Delapan", "Sembilan"];
    const teens = ["Sepuluh", "Sebelas", "Dua Belas", "Tiga Belas", "Empat Belas", "Lima Belas", "Enam Belas", "Tujuh Belas", "Delapan Belas", "Sembilan Belas"];
    const tens = ["", "", "Dua Puluh", "Tiga Puluh", "Empat Puluh", "Lima Puluh", "Enam Puluh", "Tujuh Puluh", "Delapan Puluh", "Sembilan Puluh"];
    const thousands = ["", "Ribu", "Juta", "Milyar", "Triliun"];

    if (n === 0) return "Nol";
    let text = "";
    let i = 0;
    while (n > 0) {
        let chunk = n % 1000;
        if (chunk > 0) {
            let chunkText = "";
            let hundreds = Math.floor(chunk / 100);
            let remainder = chunk % 100;
            if (hundreds === 1) chunkText += "Seratus ";
            else if (hundreds > 0) chunkText += units[hundreds] + " Ratus ";
            if (remainder >= 10 && remainder <= 19) chunkText += teens[remainder - 10] + " ";
            else {
                let tensPart = Math.floor(remainder / 10);
                let unitsPart = remainder % 10;
                if (tensPart > 0) chunkText += tens[tensPart] + " ";
                if (unitsPart > 0) chunkText += units[unitsPart] + " ";
            }
            if (i === 1 && chunk === 1) text = "Seribu " + text;
            else text = chunkText.trim() + " " + thousands[i] + " " + text;
        }
        n = Math.floor(n / 1000);
        i++;
    }
    return text.trim().replace(/\s+/g, ' ');
}


/**
 * Menyiapkan form pembayaran dengan data penghuni yang dipilih.
 */
function displayGeneratePembayaranForm(data) {
    const contentArea = document.getElementById('content-area');
    
    // Menunggu DOM di contentArea siap sebelum memanipulasinya
    setTimeout(() => {
        const selectNamaLabel = contentArea.querySelector('label[for="nama-penghuni-bayar"]');
        const selectNama = contentArea.querySelector('#nama-penghuni-bayar');
        
        if (selectNamaLabel && selectNama) {
            const staticNameDisplay = document.createElement('div');
            staticNameDisplay.innerHTML = `<strong style="font-size: 1.1em;">${data.nama}</strong> (Kamar ${data.kamar})`;
            staticNameDisplay.style.padding = '12px';
            staticNameDisplay.style.backgroundColor = '#f0f4f8';
            staticNameDisplay.style.border = '1px solid #e0e0e0';
            staticNameDisplay.style.borderRadius = '8px';
            selectNama.replaceWith(staticNameDisplay);
        }
        
        contentArea.querySelector('#ruang-kamar-bayar').value = data.kamar || '';
        contentArea.querySelector('#nominal-bayar').value = data.nominal || '';
        contentArea.querySelector('#jatuh-tempo-bayar').value = data.jatuhTempo || '';
        contentArea.querySelector('#whatsapp-bayar').value = data.whatsapp || '';

        let hiddenInput = contentArea.querySelector('#nama-penghuni-bayar-hidden');
        if (!hiddenInput) {
            hiddenInput = document.createElement('input');
            hiddenInput.type = 'hidden';
            hiddenInput.id = 'nama-penghuni-bayar-hidden';
            contentArea.querySelector('form').prepend(hiddenInput);
        }
        hiddenInput.value = data.nama || '';
    }, 100); // Jeda 100ms untuk memastikan halaman form sudah termuat
}

// Temukan fungsi handleGenerateKuitansi
/**
 * Menampilkan modal untuk memilih bulan pembayaran sebelum membuat kuitansi.
 * @param {object} data - Data penghuni dari tombol e-Kwitansi yang diklik.
 */
function showKwitansiOptionsModal(data) {
    const modalBackdrop = document.getElementById('kwitansi-options-modal-backdrop');
    const modalContent = document.getElementById('kwitansi-options-modal');

    const formHtml = `
    <button class="kwitansi-close-btn">×</button> 
        <div class="modal-header">
            <h3 class="modal-title">Pilih Periode Pembayaran</h3>
        </div>
        <div class="modal-body">
             <div class="tenant-info-box">
                <p><strong>${data.nama}</strong> <span style="font-weight: normal;">Kamar ${data.kamar}</span></p>
            </div>
            <div class="form-group">
                <label for="modal-start-month">Pembayaran sewa untuk:</label>
                <select id="modal-start-month" required>
                    <option value="">Pilih Bulan</option>
                    <option value="Januari">Januari</option>
                    <option value="Februari">Februari</option>
                    <option value="Maret">Maret</option>
                    <option value="April">April</option>
                    <option value="Mei">Mei</option>
                    <option value="Juni">Juni</option>
                    <option value="Juli">Juli</option>
                    <option value="Agustus">Agustus</option>
                    <option value="September">September</option>
                    <option value="Oktober">Oktober</option>
                    <option value="November">November</option>
                    <option value="Desember">Desember</option>
                </select>
                <select id="modal-end-month">
                    <option value="">Pilih Bulan</option>
                    <option value="Januari">Januari</option>
                    <option value="Februari">Februari</option>
                    <option value="Maret">Maret</option>
                    <option value="April">April</option>
                    <option value="Mei">Mei</option>
                    <option value="Juni">Juni</p>
                    <option value="Juli">Juli</option>
                    <option value="Agustus">Agustus</option>
                    <option value="September">September</option>
                    <option value="Oktober">Oktober</option>
                    <option value="November">November</option>
                    <option value="Desember">Desember</option>
                </select>
                <p id="modal-single-month-note" style="color: red; font-size: 0.8em; margin-top: 5px; display: none;">Jika hanya 1 bulan, tidak perlu memilih periode akhir.</p>
            </div>
            <div class="modal-actions">
                <button id="modal-generate-kuitansi-btn" class="modal-btn submit" data-nama="${data.nama}" data-kamar="${data.kamar}" data-nominal="${data.nominal}" data-whatsapp="${data.whatsapp}">Buat Kuitansi</button>
            </div>
        </div>
    `;

    modalContent.innerHTML = formHtml;
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('show');

    const closeBtn = modalContent.querySelector('.kwitansi-close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modalBackdrop.classList.remove('show');
            setTimeout(() => modalBackdrop.classList.add('hidden'), 300);
        });
    }
    
    const generateBtn = document.getElementById('modal-generate-kuitansi-btn');
    generateBtn.addEventListener('click', () => {
        const startMonthName = document.getElementById('modal-start-month').value;
        const endMonthName = document.getElementById('modal-end-month').value;
        const nominalPerMonth = parseInt(data.nominal);

        if (!startMonthName) {
            showCustomAlert('Bulan awal pembayaran wajib diisi.');
            return;
        }

        const months = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        const startMonthIndex = months.indexOf(startMonthName);
        const endMonthIndex = months.indexOf(endMonthName);
        
        let totalMonths = 1;
        let totalNominal = nominalPerMonth;

        if (endMonthName && endMonthIndex > 0) {
            if (endMonthIndex >= startMonthIndex) {
                totalMonths = endMonthIndex - startMonthIndex + 1;
            } else {
                totalMonths = (12 - startMonthIndex) + endMonthIndex + 1;
            }
            totalNominal = nominalPerMonth * totalMonths;
        }

        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
        
        // --- PERBAIKAN PENTING: data.whatsapp DITERUSKAN DENGAN BENAR ---
        handleGenerateKuitansi({
            nama: data.nama,
            kamar: data.kamar,
            nominal: totalNominal,
            totalMonths: totalMonths,
            startMonth: startMonthName,
            endMonth: endMonthName,
            whatsapp: data.whatsapp
        });
        // --- AKHIR PERBAIKAN ---

        modalBackdrop.classList.remove('show');
        setTimeout(() => modalBackdrop.classList.add('hidden'), 300);
    });
    
    const startMonthSelect = document.getElementById('modal-start-month');
    const endMonthSelect = document.getElementById('modal-end-month');
    const singleMonthNote = document.getElementById('modal-single-month-note');
    
    const updateNoteVisibility = () => {
        if (startMonthSelect.value && !endMonthSelect.value) {
            singleMonthNote.style.display = 'block';
        } else {
            singleMonthNote.style.display = 'none';
        }
    };
    startMonthSelect.addEventListener('change', updateNoteVisibility);
    endMonthSelect.addEventListener('change', updateNoteVisibility);
}

function handlePreviewKuitansi() {
    if (!generatedReceiptData || !generatedReceiptData.imageData) {
        showCustomAlert('Tidak ada kuitansi untuk ditampilkan. Buat kuitansi terlebih dahulu.');
        return;
    }
    
    const modalBackdrop = document.getElementById('receipt-preview-modal-backdrop');
    const image = document.getElementById('receipt-preview-image');

    // Mengatur sumber gambar dari data kuitansi yang sudah disimpan
    image.src = generatedReceiptData.imageData;

    // Menampilkan modal pratinjau
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('show');
}

function handleDownloadKuitansi() {
    if (!generatedReceiptData || !generatedReceiptData.imageData) {
        showCustomAlert('Tidak ada kuitansi untuk diunduh. Buat kuitansi terlebih dahulu.');
        return;
    }
    const link = document.createElement('a');
    link.href = generatedReceiptData.imageData;
    link.download = `kwitansi_${generatedReceiptData.namaPenghuni.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function handleShareKuitansi() {
    if (!generatedReceiptData || !generatedReceiptData.imageData) {
        showCustomAlert('Tidak ada kuitansi untuk dibagikan. Buat kuitansi terlebih dahulu.');
        return;
    }
    const namaPenghuni = generatedReceiptData.namaPenghuni;
    
    // Logika unduh file tetap di sini agar kuitansi diunduh sebelum peringatan muncul
    const link = document.createElement('a');
    link.href = generatedReceiptData.imageData;
    link.download = `kwitansi_${namaPenghuni.replace(/\s+/g, '_')}.png`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // HANYA memanggil fungsi peringatan
    showShareAlert(namaPenghuni, generatedReceiptData.whatsapp);
}


/**
 * Menangani proses pembuatan kuitansi dari data yang dipilih.
 * @param {object} data - Data yang dibutuhkan untuk membuat kuitansi.
 */
async function handleGenerateKuitansi(data) {
    const contentArea = document.getElementById('content-area');

    try {
        const nominal = parseInt(String(data.nominal).replace(/[^0-9]/g, '')) || 0;
        const nominalInWords = numberToText(nominal);
        const nominalFormatted = formatRupiah(nominal);
        const periodeTeks = data.endMonth ? `${data.startMonth} - ${data.endMonth}` : data.startMonth;
        const totalMonthsText = data.totalMonths > 1 ? `(${data.totalMonths} bulan)` : '';
        const receiptDate = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const now = new Date();
        const digitalPrintDate = now.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const digitalPrintTime = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

        const receiptHtml = `
            <div id="receipt-card-render" style="width: 380px; font-family: 'Segoe UI', Arial, sans-serif; padding: 15px 25px 25px; box-sizing: border-box; background: #ffffff; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                <div style="text-align: center; border-bottom: 2px solid #e0e0e0; padding-bottom: 15px; margin-bottom: 15px;">
                    <img src="images/logo-kwitansi.jpg" alt="Logo Kost Bu Yani" style="width: 120px; height: auto; margin-bottom: 5px;">
                    <h2 style="margin: 0; font-size: 1.8em; color: #1e3a8a;">KOST PUTRA BU YANI</h2>
                    <p style="margin: 5px 0 0; font-size: 0.9em; color: #6b7280;">Kos Putra Bu Yani, Jalan Ngemplak No. 33, RT.4/RW.8, Sendangadi, Kec. Mlati, Kab. Sleman, Yogyakarta</p>
                </div>
                <div style="text-align: center; margin-bottom: 15px;">
                    <h3 style="margin: 0; font-size: 1.5em; color: #1f2937;">KUITANSI PEMBAYARAN</h3>
                </div>
                <div style="text-align: center; border: 1px dashed #d1d5db; padding: 10px 15px; border-radius: 8px; margin-bottom: 15px;">
                    <p style="margin: 0 0 2px 0; font-size: 1.1em; font-weight: 600; color: #1e40af;">Jumlah Pembayaran</p>
                    <p style="margin: 0; font-size: 1.6em; font-weight: 700; color: #1e40af;">Rp ${nominalFormatted}</p>
                </div>
                <div style="text-align: center; padding: 0 0 15px 0; font-style: italic; margin-bottom: 15px; border-bottom: 1px dashed #d1d5db;">
                    <p style="margin: 0; font-weight: 500; font-size: 0.9em;">"Terbilang: ${nominalInWords} Rupiah"</p>
                </div>
                <div style="font-size: 1em; color: #374151;">
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #d1d5db;">
                        <span style="font-weight: 600; color: #1f2937;">Telah Diterima Dari</span>
                        <span style="font-weight: 500; text-align: right;">${data.nama}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #d1d5db;">
                        <span style="font-weight: 600; color: #1f2937;">Untuk Pembayaran</span>
                        <span style="font-weight: 500; text-align: right;">Sewa Kost Kamar ${data.kamar} ${totalMonthsText}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #d1d5db;">
                        <span style="font-weight: 600; color: #1f2937;">Periode</span>
                        <span style="font-weight: 500; text-align: right;">${periodeTeks}</span>
                    </div>
                    <div style="padding: 15px 0; text-align: center; border-bottom: 1px dashed #d1d5db;">
                        <p style="margin: 0; font-size: 0.9em; font-weight: 600; color: #1e40af;">Terima kasih atas kepercayaan Anda.</p>
                        <p style="margin: 5px 0 0; font-size: 0.8em; font-weight: 400; color: #6b7280;">Semoga Anda selalu betah dan nyaman tinggal di sini.</p>
                    </div>
                </div>
                <div style="text-align: center; padding: 10px 0; font-size: 0.75em; color: #9ca3af; font-style: normal;">
                    <p style="margin: 0;">Kuitansi ini dicetak secara digital pada</p>
                    <p style="margin: 2px 0 0; font-weight: 600; color: #6b7280;">${digitalPrintDate}, ${digitalPrintTime} WIB</p>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px dashed #d1d5db; padding-top: 15px;">
                    <div style="flex-basis: 50%; text-align: left; padding-right: 15px;">
                        <p style="margin: 0; font-size: 0.7em; color: #6b7280;">
                            <i class="fas fa-map-marker-alt"></i> Kos Putra Bu Yani, Jalan Ngemplak No. 33, RT.4/RW.8, Sendangadi, Kec. Mlati, Kab. Sleman, Yogyakarta
                        </p>
                        <p style="margin: 5px 0 0; font-size: 0.7em; color: #6b7280;">
                            <i class="fab fa-whatsapp"></i> WhatsApp: 0812-3456-7890
                        </p>
                    </div>
                    <div style="flex-basis: 50%; text-align: right;">
                        <span style="display: block; font-size: 0.8em; color: #6b7280;">Yogyakarta, ${receiptDate}</span>
                        <img src="images/tanda-tangan.png" alt="Tanda Tangan" style="width: 30px; height: auto; margin: 10px 0 5px auto; display: block;">
                        <span style="display: block; font-size: 0.8em; color: #6b7280; font-weight: 600;">(Susantoro)</span>
                    </div>
                </div>
            </div>
        `;

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = receiptHtml;
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        document.body.appendChild(tempDiv);
        
        const images = tempDiv.querySelectorAll('img');
        const promises = Array.from(images).map(img => new Promise((resolve, reject) => {
            if (img.complete) return resolve();
            img.onload = resolve;
            img.onerror = () => reject(new Error(`Gagal memuat gambar: ${img.src}`));
        }));
        await Promise.all(promises);

        const canvas = await html2canvas(tempDiv.querySelector('#receipt-card-render'), { scale: 4 });
        
        // Simpan URL gambar kuitansi ke variabel global
        generatedReceiptData = {
            imageData: canvas.toDataURL('image/png'),
            namaPenghuni: data.nama,
            whatsapp: data.whatsapp // Tambahkan baris ini
        };

        contentArea.innerHTML = `
        <div class="receipt-success-card">
            <div class="status-icon-circle">
                <i class="fas fa-check-circle status-icon-check"></i>
            </div>
            <h4 class="receipt-success-title">Kuitansi Berhasil Dibuat</h4>
            <p class="receipt-success-message">Silakan pratinjau atau bagikan kuitansi digital kepada penghuni.</p>
            <div class="receipt-actions">
                <button id="preview-kuitansi-btn" class="receipt-btn preview"><i class="fas fa-eye"></i> Pratinjau Kuitansi</button>
                <button id="download-kuitansi-btn" class="receipt-btn download"><i class="fas fa-download"></i> Unduh Kuitansi</button>
                <button id="share-kuitansi-btn" class="receipt-btn share-whatsapp"><i class="fab fa-whatsapp"></i> Bagikan via WhatsApp</button>
                <button id="cancel-kuitansi-btn" class="receipt-btn cancel"><i class="fas fa-arrow-left"></i> Kembali ke Database</button>
            </div>
        </div>
        `;
        
        document.getElementById('preview-kuitansi-btn').addEventListener('click', handlePreviewKuitansi);
        document.getElementById('download-kuitansi-btn').addEventListener('click', handleDownloadKuitansi);
        document.getElementById('share-kuitansi-btn').addEventListener('click', handleShareKuitansi);
        document.getElementById('cancel-kuitansi-btn').addEventListener('click', () => displayContent('database'));

    } catch (error) {
        showCustomAlert('Gagal membuat gambar kuitansi: ' + error.message);
        console.error('HTML2Canvas Error:', error);
        displayContent('database');
    } finally {
        if (tempDiv.parentNode) {
            document.body.removeChild(tempDiv);
        }
    }
}