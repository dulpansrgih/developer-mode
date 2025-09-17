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
    
    // Temukan data penghuni berdasarkan kamar
    const penghuni = databaseData.penghuni.find(p => p.kamar === kamar);

    // Tampilkan modal
    modalBackdrop.classList.remove('hidden');
    modalBackdrop.classList.add('show');
    modalBackdrop.querySelector('#modal-kamar-input').value = kamar;
    
    // Perbarui teks berdasarkan status file ID
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