// conf/appScript.js
// Script Khusus Catatan Me (Terhubung ke Google Apps Script)

// --- KONFIGURASI ---
// GANTI URL INI DENGAN URL DEPLOYMENT WEB APP ANDA
const GAS_URL = "MASUKAN_URL_WEB_APP_SCRIPT_ANDA_DISINI"; 

export function renderCatatanMe(container) {
    container.innerHTML = `
        <div class="min-h-screen pb-24 bg-yellow-50 dark:bg-gray-900 transition-colors relative">
            <div class="sticky top-0 z-20 px-4 py-4 bg-yellow-50/90 dark:bg-gray-900/90 backdrop-blur-sm border-b border-yellow-100 dark:border-gray-800 flex justify-between items-center">
                <h2 class="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Catatan Me 📒</h2>
                <span id="note-count" class="text-xs font-bold bg-yellow-200 text-yellow-800 px-2 py-1 rounded-lg">Loading...</span>
            </div>

            <div id="notes-grid" class="p-4 grid grid-cols-2 gap-3 pb-32">
                <div class="bg-gray-200 dark:bg-gray-800 h-32 rounded-2xl animate-pulse"></div>
                <div class="bg-gray-200 dark:bg-gray-800 h-32 rounded-2xl animate-pulse"></div>
            </div>

            <button onclick="window.openNoteModal()" class="fixed bottom-24 right-4 w-14 h-14 bg-gray-900 dark:bg-yellow-500 text-white dark:text-gray-900 rounded-full shadow-xl flex items-center justify-center hover:scale-110 transition z-40">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>

            <div id="note-modal" class="fixed inset-0 z-[70] hidden flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div class="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-scale-up">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="font-bold text-gray-800 dark:text-white">Catatan Baru</h3>
                        <button onclick="document.getElementById('note-modal').classList.add('hidden')" class="text-gray-400"><svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                    </div>
                    <form id="form-note" class="space-y-4">
                        <input type="text" name="title" placeholder="Judul" class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border-none outline-none font-bold text-gray-800 dark:text-white">
                        <textarea name="content" rows="4" placeholder="Tulis sesuatu..." class="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-700 border-none outline-none text-gray-600 dark:text-gray-300 resize-none" required></textarea>
                        
                        <div class="relative">
                            <input type="file" name="file" id="file-input" class="hidden" accept="image/*,application/pdf">
                            <label for="file-input" class="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition w-max">
                                <svg class="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                <span class="text-xs font-bold text-gray-500" id="file-label">Lampirkan File</span>
                            </label>
                        </div>

                        <div class="flex gap-3 justify-center pt-2">
                            <label><input type="radio" name="color" value="yellow" checked class="peer sr-only"><div class="w-8 h-8 rounded-full bg-yellow-200 border-2 border-transparent peer-checked:border-black cursor-pointer"></div></label>
                            <label><input type="radio" name="color" value="green" class="peer sr-only"><div class="w-8 h-8 rounded-full bg-green-200 border-2 border-transparent peer-checked:border-black cursor-pointer"></div></label>
                            <label><input type="radio" name="color" value="blue" class="peer sr-only"><div class="w-8 h-8 rounded-full bg-blue-200 border-2 border-transparent peer-checked:border-black cursor-pointer"></div></label>
                            <label><input type="radio" name="color" value="pink" class="peer sr-only"><div class="w-8 h-8 rounded-full bg-pink-200 border-2 border-transparent peer-checked:border-black cursor-pointer"></div></label>
                        </div>

                        <button type="submit" id="btn-save-note" class="w-full bg-black dark:bg-white text-white dark:text-black font-bold py-3 rounded-xl shadow-lg">Simpan</button>
                    </form>
                </div>
            </div>
        </div>
    `;

    // --- LOGIC ---
    // 1. Fetch Data
    const fetchNotes = async () => {
        try {
            const res = await fetch(GAS_URL + "?action=get");
            const json = await res.json();
            renderGrid(json.data);
        } catch (e) {
            console.error(e);
            document.getElementById('notes-grid').innerHTML = `<p class="col-span-2 text-center text-red-500">Gagal memuat data.</p>`;
        }
    };

    // 2. Render Grid
    const renderGrid = (data) => {
        const grid = document.getElementById('notes-grid');
        const count = document.getElementById('note-count');
        if(!grid) return;

        count.innerText = `${data.length} Notes`;
        grid.innerHTML = '';

        if(data.length === 0) {
            grid.innerHTML = `<div class="col-span-2 text-center py-20 text-gray-400">Belum ada catatan.</div>`;
            return;
        }

        const colorMap = {
            yellow: 'bg-yellow-200 text-yellow-900',
            green: 'bg-green-200 text-green-900',
            blue: 'bg-blue-200 text-blue-900',
            pink: 'bg-pink-200 text-pink-900'
        };

        data.forEach(n => {
            const bg = colorMap[n.color] || colorMap.yellow;
            // Format tanggal ISO string
            const date = new Date(n.date).toLocaleDateString('id-ID');
            
            grid.innerHTML += `
                <div class="${bg} p-4 rounded-2xl shadow-sm flex flex-col justify-between min-h-[140px] relative group animate-fade-in">
                    <div>
                        ${n.title ? `<h4 class="font-bold text-sm mb-1">${n.title}</h4>` : ''}
                        <p class="text-xs whitespace-pre-wrap leading-relaxed">${n.content}</p>
                    </div>
                    
                    ${n.fileUrl ? `
                        <a href="${n.fileUrl}" target="_blank" class="mt-2 text-[10px] bg-black/10 px-2 py-1 rounded flex items-center gap-1 w-max hover:bg-black/20">
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"></path></svg>
                            Lihat Lampiran
                        </a>
                    ` : ''}

                    <div class="flex justify-between items-end mt-3 border-t border-black/5 pt-2">
                        <span class="text-[10px] opacity-60 font-bold">${date}</span>
                        <button onclick="window.hapusCatatan('${n.id}')" class="text-red-500/50 hover:text-red-600"><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
                    </div>
                </div>
            `;
        });
    };

    // 3. Handle File Input Label
    document.getElementById('file-input').onchange = (e) => {
        const file = e.target.files[0];
        document.getElementById('file-label').innerText = file ? file.name : "Lampirkan File";
    };

    // 4. Save Logic (POST to GAS)
    document.getElementById('form-note').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btn-save-note');
        btn.innerHTML = "Menyimpan...";
        btn.disabled = true;

        const fileInput = document.getElementById('file-input');
        let fileData = "";
        let fileName = "";
        let mimeType = "";

        // Convert File to Base64
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            fileName = file.name;
            mimeType = file.type;
            const reader = new FileReader();
            reader.readAsDataURL(file);
            await new Promise(resolve => reader.onload = () => {
                fileData = reader.result.split(',')[1];
                resolve();
            });
        }

        const payload = {
            title: e.target.title.value,
            content: e.target.content.value,
            color: e.target.color.value,
            fileName: fileName,
            mimeType: mimeType,
            fileData: fileData
        };

        try {
            await fetch(GAS_URL + "?action=add", {
                method: "POST",
                body: JSON.stringify(payload)
            });
            document.getElementById('note-modal').classList.add('hidden');
            e.target.reset();
            fetchNotes(); // Reload
        } catch (err) {
            alert("Gagal menyimpan: " + err);
        } finally {
            btn.innerHTML = "Simpan";
            btn.disabled = false;
        }
    };

    // 5. Delete Logic
    window.hapusCatatan = async (id) => {
        if(confirm("Hapus catatan ini?")) {
            await fetch(GAS_URL + `?action=delete&id=${id}`, { method: "POST" });
            fetchNotes();
        }
    };

    window.openNoteModal = () => document.getElementById('note-modal').classList.remove('hidden');

    // Init Load
    fetchNotes();
}