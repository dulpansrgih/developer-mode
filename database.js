/**
 * Mengubah file menjadi format Base64.
 */
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result.split(",");
            resolve({
                fileName: file.name,
                mimeType: data[0].match(/:(\w.+);/)[1],
                data: data[1],
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Tambahkan dua fungsi baru ini di script.js
/**
 * Membuka modal popup untuk upload file.
 * @param {string} kamar - Nomor kamar yang akan di-upload.
 */
function openUploadModal(kamar) {
    const modalBackdrop = document.getElementById('upload-modal-backdrop');
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('show');
    modalBackdrop.querySelector('#modal-kamar-input').value = kamar;
}

function openUploadModal(kamar) {
    const modalBackdrop = document.getElementById('upload-modal-backdrop');
    const fileNameDisplay = document.getElementById('modal-file-name-display');
    const uploadButtonText = document.getElementById('upload-button-text');
    
    const penghuni = databaseData.penghuni.find(p => p.kamar === kamar);

    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('show');
    modalBackdrop.querySelector('#modal-kamar-input').value = kamar;
    
    if (penghuni && penghuni.FileLink) {
        fileNameDisplay.textContent = 'File sudah terunggah';
        uploadButtonText.textContent = 'Update';
    } else {
        fileNameDisplay.textContent = 'Belum ada file dipilih';
        uploadButtonText.textContent = 'Upload';
    }
}

/**
 * Menutup modal popup.
 */
function closeUploadModal() {
    const modalBackdrop = document.getElementById('upload-modal-backdrop');
    modalBackdrop.classList.remove('show');

    // Reset input file agar pengguna bisa mengunggah file baru
    const fileInput = document.getElementById('modal-file-input');
    if (fileInput) fileInput.value = '';

    // JANGAN mereset status file. Status akan diupdate oleh openUploadModal
    // ketika modal dibuka kembali.

    // Reset teks tombol menjadi "Upload" saat modal ditutup
    const uploadButtonText = document.getElementById('upload-button-text');
    if (uploadButtonText) {
        uploadButtonText.textContent = 'Upload';
    }

    // Sembunyikan pesan sukses unggah (ini sudah benar)
    const uploadedFileDisplay = document.getElementById('uploaded-file-display');
    if (uploadedFileDisplay) {
        uploadedFileDisplay.textContent = '';
    }
}

// Tambahkan event listener untuk drag-and-drop
const dragDropArea = document.getElementById('drag-drop-area');
const browseLink = document.getElementById('browse-link');
const fileInput = document.getElementById('modal-file-input');
const fileNameDisplay = document.getElementById('modal-file-name-display');

// Menghindari perilaku default browser
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Menyorot area saat file diseret ke dalamnya
['dragenter', 'dragover'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, () => dragDropArea.classList.add('highlight'), false);
});
['dragleave', 'drop'].forEach(eventName => {
    dragDropArea.addEventListener(eventName, () => dragDropArea.classList.remove('highlight'), false);
});

// Mengelola file yang di-drop
dragDropArea.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files;
    handleFiles(files);
});

// Membuka dialog file saat "browse" diklik
browseLink.addEventListener('click', (e) => {
    e.preventDefault();
    fileInput.click();
});

// Menangani file yang dipilih
fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

function handleFiles(files) {
    if (files.length > 0) {
        fileNameDisplay.textContent = files[0].name;
    } else {
        fileNameDisplay.textContent = 'Belum ada file dipilih';
    }
}


/**
 * Menampilkan pop-up peringatan sebelum membuka WhatsApp.
 * @param {string} nama - Nama penghuni yang akan dibagikan.
 * @param {string} whatsappNumber - Nomor WhatsApp penghuni.
 */
function showShareAlert(nama, whatsappNumber) {
    if (!whatsappNumber || whatsappNumber.trim() === '') {
        showCustomAlert('Nomor WhatsApp untuk penghuni ini tidak tersedia.');
        return;
    }
    const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
    const customAlert = document.getElementById('custom-alert-backdrop');
    customAlert.innerHTML = `
        <div class="alert-content">
            <h4 class="alert-title">Perhatian!</h4>
            <p class="alert-message">
                Gambar tidak otomatis terkirim ke Chat WhatsApp, pastikan telah mengunduh kuitansi.
            </p>
            <div class="alert-actions">
                <button id="alert-continue-btn" class="form-btn">Lanjut</button>
            </div>
        </div>
    `;
    customAlert.classList.remove('hidden');
    customAlert.classList.add('show');
    const continueBtn = document.getElementById('alert-continue-btn');
    continueBtn.addEventListener('click', () => {
        const whatsappUrl = `https://wa.me/${cleanNumber}`;
        window.open(whatsappUrl, '_blank');
        customAlert.classList.remove('show');
        setTimeout(() => customAlert.classList.add('hidden'), 300);
    });
}

// Ganti seluruh fungsi renderElectricityBillForm Anda dengan kode ini
function renderElectricityBillForm(contentArea, data) {
    const formHtml = `
        <div class="database-form-container">
            <h3 style="text-align: center; font-size: 1.5em; margin-bottom: 25px;">Edit Iuran Listrik Kamar ${data.kamar}</h3>
            <form id="edit-electricity-bill-form" class="database-form">
                <input type="hidden" id="electricity-bill-form-kamar" name="kamar" value="${data.kamar}">

                <label for="iuranListrik">Iuran Listrik (Rp/bulan):</label>
                <input type="number" id="iuranListrik" name="iuranListrik" value="${data.iuranListrik || 0}" required>

                <label for="statusTagihan">Status Tagihan:</label>
                <select id="statusTagihan" name="statusTagihan" required>
                    <option value="Lunas" ${data.statusTagihan === 'Lunas' ? 'selected' : ''}>Lunas</option>
                    <option value="Belum Bayar" ${data.statusTagihan === 'Belum Bayar' ? 'selected' : ''}>Belum Bayar</option>
                    <option value="Menunggak" ${data.statusTagihan === 'Menunggak' ? 'selected' : ''}>Menunggak</option>
                </select>

                <div id="jumlahBulanContainer" style="display: ${data.statusTagihan === 'Menunggak' ? 'block' : 'none'};">
                    <label for="jumlahBulan">Jumlah Bulan Menunggak:</label>
                    <input type="number" id="jumlahBulan" name="jumlahBulan" value="${data.jumlahBulan || 0}" min="2">
                    <p id="jumlahBulanWarning" class="form-warning" style="display: none; color: #e74c3c; font-size: 0.9em; margin-top: 5px;">
                        <i class="fas fa-exclamation-triangle"></i> Minimal 2 bulan untuk status Menunggak.
                    </p>
                </div>

                <hr style="margin: 20px 0;">
                <label>Total Tagihan:</label>
                <p id="total-tagihan-display" style="font-weight: bold; font-size: 1.2em; color: var(--accent-color);">Rp 0</p>
                <input type="hidden" id="total-tagihan-hidden" name="nominal" value="${data.nominal || 0}">

                <div class="form-actions" style="margin-top: 20px;">
                    <button type="submit" class="form-btn">Simpan Perubahan</button>
                    <button type="button" id="cancel-edit-bill" class="form-btn cancel">Batal</button>
                </div>
            </form>
        </div>
    `;

    contentArea.innerHTML = formHtml;

    const iuranInput = document.getElementById('iuranListrik');
    const statusSelect = document.getElementById('statusTagihan');
    const jumlahBulanInput = document.getElementById('jumlahBulan');
    const jumlahBulanContainer = document.getElementById('jumlahBulanContainer');
    const totalTagihanDisplay = document.getElementById('total-tagihan-display');
    const totalTagihanHidden = document.getElementById('total-tagihan-hidden');
    const jumlahBulanWarning = document.getElementById('jumlahBulanWarning');

    const updateTagihan = () => {
        const iuran = parseInt(iuranInput.value) || 0;
        const status = statusSelect.value;
        let total = 0;
        let jumlahBulan = 0;

        if (status === 'Menunggak') {
            jumlahBulanContainer.style.display = 'block';
            jumlahBulan = parseInt(jumlahBulanInput.value) || 0;
            
            // Logika baru untuk menampilkan peringatan
            if (jumlahBulan < 2) {
                jumlahBulanWarning.style.display = 'block';
                // Jika kurang dari 2, set total menjadi 0
                total = 0;
            } else {
                jumlahBulanWarning.style.display = 'none';
                total = iuran * jumlahBulan;
            }

        } else if (status === 'Belum Bayar') {
            jumlahBulanContainer.style.display = 'none';
            jumlahBulanWarning.style.display = 'none';
            total = iuran;
        } else {
            jumlahBulanContainer.style.display = 'none';
            jumlahBulanWarning.style.display = 'none';
            total = 0;
        }

        totalTagihanDisplay.textContent = `Rp ${formatRupiah(total)}`;
        totalTagihanHidden.value = total;
    };
    
    iuranInput?.addEventListener('input', updateTagihan);
    statusSelect?.addEventListener('change', updateTagihan);
    jumlahBulanInput?.addEventListener('input', updateTagihan);
    
    updateTagihan();

    document.getElementById('cancel-edit-bill')?.addEventListener('click', () => {
        displayContent('tagihan-listrik');
    });
    
    // Pastikan tombol submit dinonaktifkan jika jumlah bulan kurang dari 2
    document.getElementById('edit-electricity-bill-form')?.addEventListener('submit', (e) => {
        if (statusSelect.value === 'Menunggak' && (parseInt(jumlahBulanInput.value) || 0) < 2) {
            e.preventDefault();
            showCustomAlert('Jumlah bulan menunggak minimal 2.');
        }
    });
}

