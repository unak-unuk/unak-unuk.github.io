document.addEventListener('DOMContentLoaded', () => {
    // --- Elemen DOM ---
    const reportDateInput = document.getElementById('reportDate');
    const reportShiftSelect = document.getElementById('reportShift');
    const unitNameInput = document.getElementById('unitName');
    const itemDescriptionInput = document.getElementById('itemDescription');
    const itemStatusSelect = document.getElementById('itemStatus');
    const addItemBtn = document.getElementById('addItemBtn');
    const currentReportItemsContainer = document.getElementById('currentReportItemsContainer');
    const noCurrentItemsMessage = document.getElementById('noCurrentItemsMessage');
    const saveReportBtn = document.getElementById('saveReportBtn');
    const cancelEditReportBtn = document.getElementById('cancelEditReportBtn');
    const editingReportIdInput = document.getElementById('editingReportId');
    const savedReportsContainer = document.getElementById('savedReportsContainer');
    const noSavedReportsMessage = document.getElementById('noSavedReportsMessage');

    // --- Variabel Data ---
    let currentReportItems = []; // Array untuk menyimpan item laporan yang sedang dibuat/diedit
    let allSavedReports = JSON.parse(localStorage.getItem('dailyUnitReports')) || [];
    let editingItemId = null; // Untuk melacak item mana yang sedang diedit di bagian "Detail Item Laporan"

    // --- Fungsi Bantuan ---
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    }

    function formatDate(dateString) {
        // Mengembalikan format lengkap seperti "Senin, 9 Juni 2025"
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', options);
    }

    // --- Fungsi untuk Menampilkan Item Laporan yang Sedang Dibuat/Diedit ---
    function displayCurrentReportItems() {
        currentReportItemsContainer.innerHTML = ''; // Bersihkan container
        if (currentReportItems.length === 0) {
            noCurrentItemsMessage.style.display = 'block';
            return;
        } else {
            noCurrentItemsMessage.style.display = 'none';
        }

        currentReportItems.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('report-item-entry');
            itemDiv.dataset.id = item.id;

            const statusEmoji = item.status === 'OK' ? '✅' : '❌';
            const statusClass = item.status === 'OK' ? 'status-ok' : 'status-kendur';

            itemDiv.innerHTML = `
                <span>${item.unit} ${item.description} <span class="${statusClass}">${item.status} ${statusEmoji}</span></span>
                <div class="actions">
                    <button class="btn-yellow edit-item-btn">Edit</button>
                    <button class="btn-red delete-item-btn">Hapus</button>
                </div>
            `;
            currentReportItemsContainer.appendChild(itemDiv);
        });
    }

    // --- Fungsi untuk Menampilkan Laporan yang Tersimpan ---
    function displaySavedReports() {
        savedReportsContainer.innerHTML = ''; // Bersihkan container
        if (allSavedReports.length === 0) {
            noSavedReportsMessage.style.display = 'block';
            return;
        } else {
            noSavedReportsMessage.style.display = 'none';
        }

        // Urutkan laporan berdasarkan tanggal (terbaru di atas)
        allSavedReports.sort((a, b) => new Date(b.date) - new Date(a.date));

        allSavedReports.forEach(report => {
            const reportCard = document.createElement('div');
            reportCard.classList.add('report-card');
            reportCard.dataset.id = report.id;

            const formattedDate = formatDate(report.date);

            let itemsListHtml = '';
            if (report.items && report.items.length > 0) {
                itemsListHtml = '<ul>';
                report.items.forEach((item, index) => {
                    const statusEmoji = item.status === 'OK' ? '✅' : '❌';
                    itemsListHtml += `<li>${index + 1}. ${item.unit} ${item.description} ${item.status} ${statusEmoji}</li>`;
                });
                itemsListHtml += '</ul>';
            } else {
                itemsListHtml = '<p>_Tidak ada item dalam laporan ini_</p>';
            }

            reportCard.innerHTML = `
                <p><strong>Tanggal:</strong> ${formattedDate}</p>
                <p><strong>Shift:</strong> ${report.shift}</p>
                <p><strong>Data Unit:</strong></p>
                ${itemsListHtml}
                <div class="report-actions">
                    <button class="btn-yellow edit-report-btn">Edit Laporan</button>
                    <button class="btn-red delete-report-btn">Hapus Laporan</button>
                    <button class="btn-green whatsapp-report-btn">Kirim ke WhatsApp</button>
                </div>
            `;
            savedReportsContainer.appendChild(reportCard);
        });
    }

    // --- Logika Tambah/Edit Item Laporan ---
    addItemBtn.addEventListener('click', () => {
        const unit = unitNameInput.value.trim();
        const description = itemDescriptionInput.value.trim();
        const status = itemStatusSelect.value;

        if (!unit || !description) {
            alert('Unit dan Deskripsi item tidak boleh kosong!');
            return;
        }

        if (editingItemId) {
            // Mode Edit Item
            const itemIndex = currentReportItems.findIndex(item => item.id === editingItemId);
            if (itemIndex > -1) {
                currentReportItems[itemIndex] = {
                    ...currentReportItems[itemIndex],
                    unit,
                    description,
                    status
                };
            }
            editingItemId = null; // Reset editing mode
            addItemBtn.textContent = 'Tambah Item';
        } else {
            // Mode Tambah Item Baru
            const newItem = {
                id: generateUniqueId(),
                unit,
                description,
                status
            };
            currentReportItems.push(newItem);
        }

        displayCurrentReportItems();
        unitNameInput.value = '';
        itemDescriptionInput.value = '';
        itemStatusSelect.value = 'OK';
        unitNameInput.focus();
    });

    // Delegasi Event untuk Edit/Hapus Item (di dalam currentReportItemsContainer)
    currentReportItemsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-item-btn')) {
            const itemDiv = e.target.closest('.report-item-entry');
            const itemIdToEdit = itemDiv.dataset.id;
            const itemToEdit = currentReportItems.find(item => item.id === itemIdToEdit);

            if (itemToEdit) {
                unitNameInput.value = itemToEdit.unit;
                itemDescriptionInput.value = itemToEdit.description;
                itemStatusSelect.value = itemToEdit.status;
                editingItemId = itemToEdit.id; // Set item yang sedang diedit
                addItemBtn.textContent = 'Perbarui Item';
                unitNameInput.focus();
            }
        } else if (e.target.classList.contains('delete-item-btn')) {
            const itemDiv = e.target.closest('.report-item-entry');
            const itemIdToDelete = itemDiv.dataset.id;

            if (confirm('Anda yakin ingin menghapus item ini?')) {
                currentReportItems = currentReportItems.filter(item => item.id !== itemIdToDelete);
                displayCurrentReportItems();
                // Jika item yang dihapus sedang diedit, batalkan mode edit item
                if (editingItemId === itemIdToDelete) {
                    editingItemId = null;
                    addItemBtn.textContent = 'Tambah Item';
                    unitNameInput.value = '';
                    itemDescriptionInput.value = '';
                    itemStatusSelect.value = 'OK';
                }
            }
        }
    });

    // --- Logika Simpan/Edit Laporan Keseluruhan ---
    saveReportBtn.addEventListener('click', () => {
        const date = reportDateInput.value;
        const shift = reportShiftSelect.value;
        const reportId = editingReportIdInput.value;

        if (!date || !shift || currentReportItems.length === 0) {
            alert('Tanggal, Shift, dan setidaknya satu item laporan harus diisi!');
            return;
        }

        if (reportId) {
            // Mode Edit Laporan Keseluruhan
            const reportIndex = allSavedReports.findIndex(r => r.id === reportId);
            if (reportIndex > -1) {
                allSavedReports[reportIndex] = {
                    ...allSavedReports[reportIndex],
                    date,
                    shift,
                    items: [...currentReportItems] // Salin array item
                };
            }
            editingReportIdInput.value = ''; // Reset ID
            saveReportBtn.textContent = 'Simpan Laporan Lengkap';
            cancelEditReportBtn.style.display = 'none';
        } else {
            // Mode Tambah Laporan Baru
            const newReport = {
                id: generateUniqueId(),
                date,
                shift,
                items: [...currentReportItems] // Salin array item agar tidak berubah saat currentReportItems direset
            };
            allSavedReports.push(newReport);
        }

        localStorage.setItem('dailyUnitReports', JSON.stringify(allSavedReports));
        resetFormAndCurrentItems();
        displaySavedReports();
    });

    // Batal Edit Laporan Keseluruhan
    cancelEditReportBtn.addEventListener('click', () => {
        resetFormAndCurrentItems();
        editingReportIdInput.value = '';
        saveReportBtn.textContent = 'Simpan Laporan Lengkap';
        cancelEditReportBtn.style.display = 'none';
    });

    // --- Delegasi Event untuk Edit/Hapus/WhatsApp Laporan yang Tersimpan ---
    savedReportsContainer.addEventListener('click', (e) => {
        const reportCard = e.target.closest('.report-card');
        if (!reportCard) return; // Klik di luar kartu laporan

        const reportId = reportCard.dataset.id;
        const reportToAct = allSavedReports.find(r => r.id === reportId);

        if (!reportToAct) return;

        if (e.target.classList.contains('edit-report-btn')) {
            // Edit Laporan Keseluruhan
            reportDateInput.value = reportToAct.date;
            reportShiftSelect.value = reportToAct.shift;
            currentReportItems = JSON.parse(JSON.stringify(reportToAct.items || [])); // Salin dalam
            displayCurrentReportItems();
            editingReportIdInput.value = reportToAct.id; // Set ID laporan yang sedang diedit
            saveReportBtn.textContent = 'Perbarui Laporan Lengkap';
            cancelEditReportBtn.style.display = 'inline-block';
            window.scrollTo({ top: 0, behavior: 'smooth' }); // Gulir ke atas
        } else if (e.target.classList.contains('delete-report-btn')) {
            // Hapus Laporan Keseluruhan
            if (confirm('Anda yakin ingin menghapus laporan ini?')) {
                allSavedReports = allSavedReports.filter(report => report.id !== reportId);
                localStorage.setItem('dailyUnitReports', JSON.stringify(allSavedReports));
                displaySavedReports();
                // Jika laporan yang dihapus sedang diedit, batalkan mode edit
                if (editingReportIdInput.value === reportId) {
                    cancelEditReportBtn.click();
                }
            }
        } else if (e.target.classList.contains('whatsapp-report-btn')) {
            // Kirim ke WhatsApp
            sendToWhatsApp(reportToAct);
        }
    });

    // --- Fungsi Reset Form ---
    function resetFormAndCurrentItems() {
        // Set tanggal ke hari ini
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        reportDateInput.value = `${yyyy}-${mm}-${dd}`;

        reportShiftSelect.value = 'A';
        unitNameInput.value = '';
        itemDescriptionInput.value = '';
        itemStatusSelect.value = 'OK';
        currentReportItems = [];
        displayCurrentReportItems(); // Kosongkan tampilan item yang sedang dibuat
        editingItemId = null;
        addItemBtn.textContent = 'Tambah Item';
        editingReportIdInput.value = '';
        saveReportBtn.textContent = 'Simpan Laporan Lengkap';
        cancelEditReportBtn.style.display = 'none';
    }

    // --- Fungsi Kirim ke WhatsApp ---
    function sendToWhatsApp(report) {
        // Menggunakan formatDate lengkap untuk mendapatkan "Senin, 9 Juni 2025"
        const fullFormattedDate = formatDate(report.date);

        // Memisahkan "Senin" dari "9 Juni 2025"
        const parts = fullFormattedDate.split(', ');
        const dayOfWeek = parts[0]; // "Senin"
        const dateOnly = parts[1];   // "9 Juni 2025"

        const shift = report.shift;

        // Sesuaikan baris pertama agar sesuai format gambar: "Data unit RM 0, Senin 9 Juni 2025, shift B"
        let whatsappText = `Data unit RM 0, ${dayOfWeek} ${dateOnly}, shift ${shift}\n\n`;

        if (report.items && report.items.length > 0) {
            report.items.forEach((item, index) => {
                const statusEmoji = item.status === 'OK' ? '✅' : '❌';
                whatsappText += `${index + 1}. ${item.unit} ${item.description} ${statusEmoji}\n`;
            });
        } else {
            whatsappText += "Tidak ada item laporan.\n";
        }
        whatsappText += "\nSekian, Terima kasih";

        // Encode untuk URL WhatsApp
        const encodedText = encodeURIComponent(whatsappText);
        const whatsappUrl = `https://wa.me/?text=${encodedText}`;

        window.open(whatsappUrl, '_blank');
    }

    // --- Inisialisasi Aplikasi ---
    resetFormAndCurrentItems(); // Set tanggal default dan kosongkan item saat pertama kali dimuat
    displaySavedReports(); // Tampilkan laporan yang sudah tersimpan
});

    // ... (kode sebelumnya) ...



    // ... (kode sebelumnya) ...

    // Fungsi Kirim ke WhatsApp


    // ... (kode setelahnya) ...
