// Tambahkan fungsi ini di awal file script.js
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
/*
// ===============================================
// =========== FUNGSI BARU DATA SHEET ==========
// ===============================================

async function renderDataSheetContent(contentArea) {
    contentArea.innerHTML = document.getElementById('datasheet-content').innerHTML;
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">${getProgressLoaderHtml('Memuat data...')}</td></tr>`;

    try {
        const response = await fetch(`${API_DATA_SHEET}?action=read`);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message);
        }

        if (result.data && result.data.length > 0) {
            tableBody.innerHTML = buildTableRows(result.data);
        } else {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Tidak ada data yang ditemukan.</td></tr>`;
        }
    } catch (error) {
        console.error('Error saat memuat data sheet:', error);
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #e74c3c;">Gagal memuat data: ${error.message}</td></tr>`;
    }
}

function buildTableRows(data) {
    return data.map(item => `
        <tr data-id="${item.id}">
            <td><input type="radio" name="select-row" value="${item.id}"></td>
            <td>${item.id}</td>
            <td>${item.nama}</td>
            <td>${item.kamar}</td>
            <td>${item.tanggal}</td>
            <td>${item.deskripsi}</td>
            <td>${item.status}</td>
        </tr>
    `).join('');
}

document.body.addEventListener('change', (e) => {
    if (e.target.name === 'select-row') {
        selectedRowId = e.target.value;
    }
});

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

async function handleDataSheetEdit() {
    if (!selectedRowId) {
        showCustomAlert("Pilih baris data yang ingin Anda edit terlebih dahulu.");
        return;
    }

    const row = document.querySelector(`tr[data-id="${selectedRowId}"]`);
    const data = {
        id: selectedRowId,
        kamar: row.cells[2].textContent,
        nama: row.cells[3].textContent,
        tanggal: row.cells[6].textContent,
        deskripsi: row.cells[7].textContent,
        status: row.cells[8].textContent
    };
    
    document.getElementById('datasheet-edit-id').value = data.id;
    document.getElementById('datasheet-edit-kamar').value = data.kamar;
    document.getElementById('datasheet-edit-nama').value = data.nama;
    document.getElementById('datasheet-edit-tanggal').value = data.tanggal;
    document.getElementById('datasheet-edit-deskripsi').value = data.deskripsi;
    document.getElementById('datasheet-edit-status').value = data.status;

    const modal = document.getElementById('datasheet-edit-modal-backdrop');
    modal.classList.remove('hidden');
    modal.classList.add('show');
}


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
    */