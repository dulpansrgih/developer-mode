// upID.js
// Perantara antara aplikasi web (JavaScript) dan Google Apps Script (backend Drive + Spreadsheet)

const APPSCRIPT_URL = "https://script.google.com/macros/s/AKfycby1IQ_cKtNeWq0vRDdbs2Irjrji8OBS9kEFJAMLD-tT_ZWghyPv0ceRt5o4jn3r0vUR/exec"; 
// ↑ Ganti dengan URL Web App Anda (yang berakhiran /exec)

/**
 * Upload file KTP ke Apps Script untuk disimpan di Google Drive.
 * Mengembalikan URL file yang diunggah.
 * @param {File} file - File KTP
 * @param {string} kamarId - ID kamar/penghuni
 * @param {string} namaPenghuni - (opsional) nama penghuni
 */
export async function uploadKTPToAppsScript(file, kamarId, namaPenghuni = "-") {
  if (!file) throw new Error("Tidak ada file untuk diupload.");

  // Validasi ukuran
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Ukuran file maksimal 2MB.");
  }

  const base64 = await fileToBase64(file);
  const payload = {
    filename: `${kamarId}_${Date.now()}_${file.name}`,
    mimetype: file.type || "application/octet-stream",
    data: base64.replace(/^data:.*;base64,/, ""),
    kamarId,
    namaPenghuni
  };

  const res = await fetch(APPSCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Gagal upload ke Apps Script: ${res.status} ${txt}`);
  }

  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Upload gagal tanpa pesan.");
  return json.url;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });
}
