// conf/appScript.js
// Script Khusus Catatan Me (Fitur Lengkap: CRUD + Camera/Upload + Preview + Cool Loading)

const GAS_URL = "https://script.google.com/macros/s/AKfycbyk1GaCcqLrqUzVPIkWlhATvdwZDFPL9zClr6fNUNIoUE05Ywf7bkoD3HQ6uvmj_5LY/exec";

export function renderCatatanMe(container) {
    // STATE LOKAL
    let activeNotesData = [];
    let editingNoteId = null;
    let cameraStream = null;
    let capturedBlob = null;

    // --- SETUP SKELETON ANIMATION (Biar terlihat sibuk) ---
    // Kita buat 6 kartu dummy yang berkedip (shimmering)
    const skeletonCard = `
        <div class="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse flex flex-col gap-3 h-48">
            <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            <div class="space-y-2 flex-1">
                <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded w-full"></div>
                <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded w-5/6"></div>
                <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded w-4/6"></div>
            </div>
            <div class="flex justify-between items-center mt-auto pt-2 border-t border-gray-50 dark:border-gray-700">
                <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                <div class="h-6 w-6 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            </div>
        </div>
    `;
    const initialSkeleton = Array(6).fill(skeletonCard).join('');

    container.innerHTML = `
        <div class="min-h-screen pb-24 bg-yellow-50 dark:bg-gray-900 transition-colors relative">
            
            <div class="sticky top-0 z-20 px-4 py-4 bg-yellow-50/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-yellow-100 dark:border-gray-800 flex justify-between items-center transition-all duration-300">
                <h2 class="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Catatan Me 📒</h2>
                
                <div id="status-badge" class="flex items-center gap-2 bg-yellow-200 text-yellow-900 px-3 py-1.5 rounded-full shadow-sm border border-yellow-300 transition-all duration-300">
                    <svg id="loading-spinner" class="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span id="note-count" class="text-xs font-bold">Syncing...</span>
                </div>
            </div>

            <div id="notes-grid" class="p-4 grid grid-cols-2 gap-3 pb-32">
                ${initialSkeleton}
            </div>

            <button onclick="window.openNoteModal()" class="fixed bottom-24 right-4 w-14 h-14 bg-gray-900 dark:bg-yellow-500 text-white dark:text-gray-900 rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-110 transition z-40">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>

            <div id="note-modal" class="fixed inset-0 z-[70] hidden flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity duration-300">
                <div class="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-6">
                        <h3 id="modal-title" class="font-bold text-xl text-gray-800 dark:text-white">Tulis Baru</h3>
                        <button onclick="window.closeNoteModal()" class="bg-gray-100 dark:bg-gray-700 p-2 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                    <form id="form-note" class="space-y-5">
                        <input type="text" id="input-title" name="title" placeholder="Judul Catatan..." class="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-yellow-400 dark:focus:border-yellow-500 outline-none font-bold text-gray-800 dark:text-white transition">
                        <textarea id="input-content" name="content" rows="5" placeholder="Ketuk untuk menulis cerita..." class="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border-2 border-transparent focus:border-yellow-400 dark:focus:border-yellow-500 outline-none text-gray-600 dark:text-gray-300 resize-none transition leading-relaxed" required></textarea>
                        
                        <div class="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-2xl border border-dashed border-gray-300 dark:border-gray-600">
                            <div class="flex gap-2 mb-2">
                                <input type="file" id="file-upload" class="hidden" accept="image/*,application/pdf">
                                <label for="file-upload" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 transition shadow-sm border border-gray-100 dark:border-gray-700">
                                    <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                                    <span class="text-[10px] font-bold text-gray-500">Galeri / File</span>
                                </label>
                                
                                <button type="button" onclick="window.openCameraModal()" class="flex-1 flex flex-col items-center justify-center gap-1 py-3 bg-white dark:bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-50 transition shadow-sm border border-gray-100 dark:border-gray-700">
                                    <svg class="w-6 h-6 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                    <span class="text-[10px] font-bold text-gray-500">Kamera</span>
                                </button>
                            </div>
                            
                            <div id="preview-container" class="hidden relative rounded-xl overflow-hidden mt-2 border border-gray-200 dark:border-gray-600 bg-black">
                                <img id="img-preview-mini" src="" class="w-full h-40 object-contain">
                                <button type="button" onclick="window.clearAttachment()" class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md hover:bg-red-600 transition">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <p id="file-label" class="text-[10px] text-center text-gray-400 italic mt-2">Tidak ada lampiran</p>
                        </div>

                        <div class="flex justify-between items-center px-2">
                            <span class="text-xs font-bold text-gray-400 uppercase">Warna Kartu</span>
                            <div class="flex gap-2">
                                <label><input type="radio" id="color-yellow" name="color" value="yellow" checked class="peer sr-only"><div class="w-8 h-8 rounded-full bg-yellow-200 border-2 border-transparent peer-checked:border-gray-800 peer-checked:scale-110 transition cursor-pointer shadow-sm"></div></label>
                                <label><input type="radio" id="color-green" name="color" value="green" class="peer sr-only"><div class="w-8 h-8 rounded-full bg-green-200 border-2 border-transparent peer-checked:border-gray-800 peer-checked:scale-110 transition cursor-pointer shadow-sm"></div></label>
                                <label><input type="radio" id="color-blue" name="color" value="blue" class="peer sr-only"><div class="w-8 h-8 rounded-full bg-blue-200 border-2 border-transparent peer-checked:border-gray-800 peer-checked:scale-110 transition cursor-pointer shadow-sm"></div></label>
                                <label><input type="radio" id="color-pink" name="color" value="pink" class="peer sr-only"><div class="w-8 h-8 rounded-full bg-pink-200 border-2 border-transparent peer-checked:border-gray-800 peer-checked:scale-110 transition cursor-pointer shadow-sm"></div></label>
                            </div>
                        </div>

                        <button type="submit" id="btn-save-note" class="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-4 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition transform active:scale-95 flex items-center justify-center gap-2">
                            <span>Simpan Catatan</span>
                        </button>
                    </form>
                </div>
            </div>

            <div id="camera-modal" class="fixed inset-0 z-[80] hidden bg-black flex flex-col">
                <div class="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    <video id="camera-stream" autoplay playsinline class="w-full h-full object-cover transform scale-x-[-1]"></video>
                    <canvas id="camera-canvas" class="hidden"></canvas>
                    <div class="absolute inset-0 pointer-events-none opacity-30 border-[1px] border-white/50 m-6 rounded-3xl"></div>
                    <div class="absolute top-6 right-6 bg-black/50 px-3 py-1 rounded-full text-white text-xs font-bold backdrop-blur-md">Mode Foto</div>
                </div>
                
                <div class="h-36 bg-black flex justify-between items-center px-10 pb-6">
                    <button onclick="window.closeCameraModal()" class="text-white font-bold text-sm bg-gray-800/80 px-5 py-2.5 rounded-full hover:bg-gray-700 transition">Batal</button>
                    
                    <button onclick="window.takePicture()" class="w-20 h-20 bg-white rounded-full border-4 border-gray-400 flex items-center justify-center active:scale-90 transition duration-150 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                        <div class="w-16 h-16 border-2 border-black rounded-full"></div>
                    </button>
                    
                    <button class="w-12 opacity-0">spacer</button>
                </div>
            </div>

            <div id="preview-modal" class="fixed inset-0 z-[90] hidden flex flex-col justify-center items-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
                <div class="w-full max-w-lg bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[85vh]">
                    <div class="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
                        <h3 class="font-bold text-gray-800 dark:text-white flex items-center gap-2"><svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg> Preview</h3>
                        <button onclick="document.getElementById('preview-modal').classList.add('hidden')" class="bg-gray-200 dark:bg-gray-700 p-2 rounded-full hover:bg-red-500 hover:text-white transition">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>
                    <div class="flex-1 bg-gray-100 dark:bg-black relative">
                        <iframe id="preview-frame" src="" class="w-full h-full border-none" allow="autoplay"></iframe>
                        <div id="loading-preview" class="absolute inset-0 flex flex-col items-center justify-center text-gray-400 gap-2">
                            <svg class="w-8 h-8 animate-spin text-gray-500" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span class="text-xs font-bold">Memuat dokumen...</span>
                        </div>
                    </div>
                    <div class="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-center">
                        <a id="download-link" href="#" target="_blank" class="text-xs font-bold bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-4 py-2 rounded-lg hover:bg-blue-100 transition">Buka di Tab Baru ↗</a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // --- LOGIC HANDLING ---

    // 1. FILE UPLOAD HANDLING
    const fileUpload = document.getElementById('file-upload');
    const fileLabel = document.getElementById('file-label');
    const previewContainer = document.getElementById('preview-container');
    const imgPreview = document.getElementById('img-preview-mini');

    const updateFilePreview = (file, sourceName) => {
        fileLabel.innerText = sourceName;
        // Jika gambar, tampilkan preview mini
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imgPreview.src = e.target.result;
                previewContainer.classList.remove('hidden');
            };
            reader.readAsDataURL(file);
        } else {
            previewContainer.classList.add('hidden');
        }
    };

    if (fileUpload) {
        fileUpload.onchange = (e) => {
            const file = e.target.files[0];
            capturedBlob = null;
            if (file) updateFilePreview(file, `📄 ${file.name}`);
        };
    }

    window.clearAttachment = () => {
        fileUpload.value = '';
        capturedBlob = null;
        previewContainer.classList.add('hidden');
        fileLabel.innerText = "Tidak ada lampiran";
        imgPreview.src = '';
    };

    // 2. CAMERA HANDLING (WEBRTC)
    window.openCameraModal = async () => {
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-stream');
        try {
            cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
            video.srcObject = cameraStream;
            modal.classList.remove('hidden');
        } catch (err) {
            alert("Gagal membuka kamera: " + err.message);
        }
    };

    window.closeCameraModal = () => {
        const modal = document.getElementById('camera-modal');
        const video = document.getElementById('camera-stream');
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            cameraStream = null;
        }
        video.srcObject = null;
        modal.classList.add('hidden');
    };

    window.takePicture = () => {
        const video = document.getElementById('camera-stream');
        const canvas = document.getElementById('camera-canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(blob => {
            capturedBlob = blob;
            fileUpload.value = '';
            const url = URL.createObjectURL(blob);
            imgPreview.src = url;
            previewContainer.classList.remove('hidden');
            fileLabel.innerText = `📷 Foto Kamera (${new Date().toLocaleTimeString()})`;
            window.closeCameraModal();
        }, 'image/jpeg', 0.8);
    };

    // 3. MODAL UTAMA
    window.openNoteModal = () => {
        editingNoteId = null;
        document.getElementById('form-note').reset();
        window.clearAttachment();
        document.getElementById('modal-title').innerText = "Tulis Baru";
        document.getElementById('note-modal').classList.remove('hidden');
    };

    window.closeNoteModal = () => {
        document.getElementById('note-modal').classList.add('hidden');
        editingNoteId = null;
    }

    // 4. EDIT LOGIC
    window.editCatatan = (id) => {
        const noteToEdit = activeNotesData.find(n => n.id === id);
        if (!noteToEdit) return;
        editingNoteId = id;
        document.getElementById('modal-title').innerText = "Edit Catatan";
        document.getElementById('input-title').value = noteToEdit.title || '';
        document.getElementById('input-content').value = noteToEdit.content || '';
        const colorRadio = document.getElementById(`color-${noteToEdit.color}`);
        if (colorRadio) colorRadio.checked = true;
        window.clearAttachment();
        if (noteToEdit.fileUrl) fileLabel.innerText = "📄 File lama tersimpan (Upload baru untuk mengganti)";
        document.getElementById('note-modal').classList.remove('hidden');
    };

    // 5. SUBMIT HANDLING
    document.getElementById('form-note').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-note');
        const originalText = btn.innerHTML;
        // Animasi tombol loading
        btn.innerHTML = `<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> <span>Menyimpan...</span>`;
        btn.disabled = true;

        let fileData = "", fileName = "", mimeType = "";
        let finalFile = null;
        if (capturedBlob) finalFile = new File([capturedBlob], `camera_${Date.now()}.jpg`, { type: "image/jpeg" });
        else if (fileUpload.files.length > 0) finalFile = fileUpload.files[0];

        if (finalFile) {
            fileName = finalFile.name; mimeType = finalFile.type;
            const reader = new FileReader();
            reader.readAsDataURL(finalFile);
            await new Promise(resolve => reader.onload = () => {
                fileData = reader.result.split(',')[1];
                resolve();
            });
        }

        const payload = {
            title: e.target.title.value,
            content: e.target.content.value,
            color: e.target.color.value,
            fileName, mimeType, fileData
        };

        let actionStr = "?action=add";
        if (editingNoteId) { actionStr = "?action=update"; payload.id = editingNoteId; }

        try {
            await fetch(GAS_URL + actionStr, { method: "POST", body: JSON.stringify(payload) });
            window.closeNoteModal();
            if(window.showToast) window.showToast(editingNoteId ? "Berhasil diperbarui!" : "Berhasil disimpan!");
            fetchNotes(); // Reload to show new data
        } catch (err) {
            console.error(err);
            alert("Gagal menyimpan. Cek koneksi.");
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    };

    // 6. FETCH & RENDER
    const fetchNotes = async () => {
        const badge = document.getElementById('status-badge');
        const count = document.getElementById('note-count');
        const spinner = document.getElementById('loading-spinner');
        
        // Mode Loading
        if(badge) {
            badge.className = "flex items-center gap-2 bg-yellow-200 text-yellow-900 px-3 py-1.5 rounded-full shadow-sm border border-yellow-300 transition-all duration-300";
            count.innerText = "Syncing...";
            spinner.classList.remove('hidden');
        }

        try {
            const res = await fetch(GAS_URL + "?action=get");
            const json = await res.json();
            activeNotesData = Array.isArray(json.data) ? json.data : [];
            renderGrid(activeNotesData);
            
            // Mode Selesai (Update Badge)
            if(badge) {
                badge.className = "flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 transition-all duration-300";
                count.innerText = `${activeNotesData.length} Notes`;
                spinner.classList.add('hidden'); // Sembunyikan spinner
            }
        } catch (e) {
            document.getElementById('notes-grid').innerHTML = `<div class="col-span-2 text-center py-20 text-gray-400 text-xs">Gagal memuat data.</div>`;
            if(badge) {
                count.innerText = "Error";
                badge.classList.add('bg-red-100', 'text-red-600', 'border-red-200');
            }
        }
    };

    const renderGrid = (data) => {
        const grid = document.getElementById('notes-grid');
        if(!grid) return;
        grid.innerHTML = '';
        if(data.length === 0) { grid.innerHTML = `<div class="col-span-2 text-center py-20 text-gray-400">Belum ada catatan.</div>`; return; }

        const colorMap = { yellow: 'bg-yellow-200 text-yellow-900', green: 'bg-green-200 text-green-900', blue: 'bg-blue-200 text-blue-900', pink: 'bg-pink-200 text-pink-900' };

        data.forEach(n => {
            const bg = colorMap[n.color] || colorMap.yellow;
            const dateStr = new Date(n.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
            
            grid.innerHTML += `
                <div class="${bg} p-5 rounded-3xl shadow-sm flex flex-col justify-between min-h-[160px] relative group animate-fade-in transition-all duration-300 hover:scale-[1.02] hover:shadow-md cursor-pointer border border-white/20">
                    <div onclick="window.editCatatan('${n.id}')" class="flex-1">
                        ${n.title ? `<h4 class="font-black text-base mb-2 line-clamp-2 leading-tight">${n.title}</h4>` : ''}
                        <p class="text-sm whitespace-pre-wrap leading-relaxed line-clamp-4 font-medium opacity-90">${n.content}</p>
                    </div>
                    
                    ${n.fileUrl ? `
                        <button onclick="window.openPreview('${n.fileUrl}')" class="mt-4 text-[10px] bg-white/40 px-3 py-2 rounded-xl flex items-center gap-2 w-max hover:bg-white/60 transition font-bold cursor-pointer shadow-sm text-gray-900 backdrop-blur-sm">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                            Lampiran
                        </button>
                    ` : ''}

                    <div class="flex justify-between items-center mt-4 pt-3 border-t border-black/5">
                        <span class="text-[10px] font-bold opacity-60 uppercase tracking-wider">${dateStr}</span>
                        <div class="flex gap-1">
                            <button onclick="window.editCatatan('${n.id}')" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 transition text-black/50 hover:text-blue-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></button>
                            <button onclick="window.hapusCatatan('${n.id}')" class="w-8 h-8 flex items-center justify-center rounded-full bg-white/30 hover:bg-white/50 transition text-black/50 hover:text-red-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                        </div>
                    </div>
                </div>
            `;
        });
    };

    window.openPreview = (url) => { const modal = document.getElementById('preview-modal'); const frame = document.getElementById('preview-frame'); const link = document.getElementById('download-link'); const loader = document.getElementById('loading-preview'); if(!url) return; let previewUrl = url; const idMatch = url.match(/id=([^&]+)/) || url.match(/\/d\/([^/]+)/); if (idMatch && idMatch[1]) { const fileId = idMatch[1]; previewUrl = `https://drive.google.com/file/d/${fileId}/preview`; } modal.classList.remove('hidden'); loader.classList.remove('hidden'); frame.onload = () => { loader.classList.add('hidden'); }; frame.src = previewUrl; link.href = url; };
    window.hapusCatatan = async (id) => { if(confirm("Hapus catatan ini?")) { try { await fetch(GAS_URL + `?action=delete&id=${id}`, { method: "POST" }); fetchNotes(); } catch (err) { alert("Gagal menghapus."); } } };

    fetchNotes();
}