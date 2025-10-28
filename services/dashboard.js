export function renderDashboard(user) {
  return `
  <section class="animate-fadeIn">
    <h2 class="text-2xl font-semibold text-blue-600 mb-4">Dashboard Admin</h2>
    <p class="text-gray-700 dark:text-gray-300">Selamat datang, ${user.email}</p>
    <div class="grid sm:grid-cols-2 gap-4 mt-4">
      <div class="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl">📋 Data Penghuni (readonly)</div>
      <div class="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl">🏠 Data Kamar (readonly)</div>
      <div class="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl">⚡ Iuran Listrik</div>
      <div class="bg-blue-50 dark:bg-gray-800 p-4 rounded-xl">📹 Live CCTV</div>
    </div>
  </section>`;
}
