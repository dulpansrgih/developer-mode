// Local helper to format currency (kept here to avoid circular imports)
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

export function showKuitansiWindow(kamarData, tagihanData = {}) {
  try {
    const periode = tagihanData.bulanAwal && tagihanData.bulanAkhir ? 
      `${new Date(tagihanData.bulanAwal).toLocaleDateString('id-ID', {month:'long', year:'numeric'})} - ${new Date(tagihanData.bulanAkhir).toLocaleDateString('id-ID', {month:'long', year:'numeric'})}` : 
      '-';

    const html = `
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Kuitansi Pembayaran - ${kamarData.namaKamar}</title>
        <style>
          @page { size: A5; margin: 10mm; }
          body {
            font-family: Arial, Helvetica, sans-serif;
            padding: 20px;
            color: #1f2937;
            max-width: 800px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
          }
          .header h1 {
            color: #1e40af;
            margin: 0;
            font-size: 24px;
          }
          .header p {
            color: #6b7280;
            margin: 5px 0 0;
            font-size: 14px;
          }
          .content {
            margin: 20px 0;
          }
          .row {
            display: flex;
            margin: 12px 0;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 8px;
          }
          .label {
            flex: 1;
            font-weight: 600;
            color: #4b5563;
          }
          .value {
            flex: 2;
            color: #1f2937;
          }
          .meta {
            margin-top: 30px;
            font-size: 12px;
            color: #6b7280;
            text-align: right;
          }
          .status {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 14px;
          }
          .status.paid {
            background: #dcfce7;
            color: #166534;
          }
          .status.unpaid {
            background: #fee2e2;
            color: #991b1b;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          @media print {
            body { padding: 0; }
            .print-button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>KUITANSI PEMBAYARAN</h1>
          <p>Kost Putri Bunda Yulia</p>
        </div>
        
        <div class="content">
          <div class="row">
            <div class="label">Nomor Kamar</div>
            <div class="value">${kamarData.namaKamar}</div>
          </div>
          <div class="row">
            <div class="label">Nama Penghuni</div>
            <div class="value">${kamarData.namaPenghuni || '-'}</div>
          </div>
          <div class="row">
            <div class="label">Periode Pembayaran</div>
            <div class="value">${periode}</div>
          </div>
          <div class="row">
            <div class="label">Nominal per Bulan</div>
            <div class="value">${formatCurrency(kamarData.nominalPerBulan || 0)}</div>
          </div>
          <div class="row">
            <div class="label">Total Tagihan</div>
            <div class="value">${formatCurrency(tagihanData.totalTagihan || 0)}</div>
          </div>
          <div class="row">
            <div class="label">Tanggal Pembayaran</div>
            <div class="value">${tagihanData.tanggalPembayaran ? new Date(tagihanData.tanggalPembayaran).toLocaleDateString('id-ID') : '-'}</div>
          </div>
          <div class="row">
            <div class="label">Status</div>
            <div class="value">
              <span class="status ${tagihanData.tanggalPembayaran ? 'paid' : 'unpaid'}">
                ${tagihanData.tanggalPembayaran ? 'LUNAS' : 'BELUM LUNAS'}
              </span>
            </div>
          </div>
        </div>

        <div class="meta">
          Dicetak pada: ${new Date().toLocaleString('id-ID')}
        </div>

        <div class="footer">
          <p>Terima kasih atas pembayaran Anda.</p>
          <p>Simpan kuitansi ini sebagai bukti pembayaran yang sah.</p>
        </div>

        <button class="print-button" onclick="window.print()" style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          padding: 10px 20px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        ">
          Cetak Kuitansi
        </button>
      </body>
      </html>`;

    const w = window.open('', '_blank', 'toolbar=0,location=0,menubar=0');
    w.document.open();
    w.document.write(html);
    w.document.close();
  } catch (err) {
    console.error('Gagal generate kuitansi:', err);
    alert('Gagal menampilkan kuitansi: ' + (err.message || err));
  }
}

export function generateWhatsAppReminder(kamarData, tagihanData = {}) {
  try {
    const periode = tagihanData.bulanAwal && tagihanData.bulanAkhir ? 
      `${new Date(tagihanData.bulanAwal).toLocaleDateString('id-ID', {month:'long', year:'numeric'})} - ${new Date(tagihanData.bulanAkhir).toLocaleDateString('id-ID', {month:'long', year:'numeric'})}` : 
      'periode saat ini';

    const nominal = formatCurrency(tagihanData.totalTagihan || 0);
    const jatuhTempo = tagihanData.jatuhTempo ? 
      new Date(tagihanData.jatuhTempo).toLocaleDateString('id-ID') : 
      'segera';

    const message = encodeURIComponent(
      `*Reminder Pembayaran Kost*\n\n` +
      `Kepada Yth.\n` +
      `${kamarData.namaPenghuni}\n` +
      `Kamar ${kamarData.namaKamar}\n\n` +
      `Dengan hormat,\n` +
      `Ini adalah pengingat untuk pembayaran kost:\n\n` +
      `Periode: ${periode}\n` +
      `Nominal: ${nominal}\n` +
      `Jatuh Tempo: ${jatuhTempo}\n\n` +
      `Mohon dapat segera melakukan pembayaran.\n` +
      `Terima kasih atas perhatiannya.\n\n` +
      `Salam,\n` +
      `Admin Kost Putri Bunda Yulia`
    );

    const phone = kamarData.kontak ? kamarData.kontak.replace(/\D/g, '') : '';
    if (!phone) throw new Error('Nomor kontak tidak tersedia');

    return `https://wa.me/${phone}?text=${message}`;
  } catch (err) {
    console.error('Gagal generate reminder:', err);
    throw err;
  }
}

export function calculateDaysUntilDue(jatuhTempo) {
  if (!jatuhTempo) return null;
  
  const today = new Date();
  const dueDate = new Date(jatuhTempo);
  const diffTime = dueDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}