// Copyright (c) 2024, Wahyu Triono and contributors
// For license information, please see license.txt

frappe.ui.form.on("Time Sheet", {
    refresh(frm) {
        // Menyembunyikan opsi untuk menambah atau menghapus baris di masing-masing tabel aktifitas
        frm.fields_dict['aktifitas_produktif'].grid.wrapper.find('.grid-add-row').hide();
        frm.fields_dict['aktifitas_produktif'].grid.wrapper.find('.grid-remove-rows').hide();
        frm.fields_dict['aktifitas_tidak_produktif'].grid.wrapper.find('.grid-add-row').hide();
        frm.fields_dict['aktifitas_tidak_produktif'].grid.wrapper.find('.grid-remove-rows').hide();
        frm.fields_dict['aktifitas_maintenance'].grid.wrapper.find('.grid-add-row').hide();
        frm.fields_dict['aktifitas_maintenance'].grid.wrapper.find('.grid-remove-rows').hide();
    },

    onload(frm) {
        if (!frm.is_new()) return;

        // Bersihkan semua tabel aktifitas terlebih dahulu
        frm.clear_table('aktifitas_produktif');
        frm.clear_table('aktifitas_tidak_produktif');
        frm.clear_table('aktifitas_maintenance');

        // Ambil semua data dari Shift Activity Type
        frappe.call({
            method: 'frappe.client.get_list',
            args: {
                doctype: 'Shift Activity Type',
                fields: ['name', 'type'],
            },
            callback: function(response) {
                const activities = response.message;

                // Jika ada aktivitas, tambahkan ke child table yang sesuai
                if (activities && activities.length > 0) {
                    activities.forEach(activity => {
                        let target_table;

                        // Tentukan tabel berdasarkan type aktivitas
                        if (activity.type === "Productive") {
                            target_table = 'aktifitas_produktif';
                        } else if (activity.type === "Unproductive") {
                            target_table = 'aktifitas_tidak_produktif';
                        } else if (activity.type === "Maintenance") {
                            target_table = 'aktifitas_maintenance';
                        }

                        if (target_table) {
                            let new_row = frm.add_child(target_table);
                            new_row.aktifitas = activity.name;
                            new_row.waktu_mulai = ""; // Set waktu mulai jika diperlukan
                            new_row.waktu_akhir = ""; // Set waktu akhir jika diperlukan
                        }
                    });

                    // Refresh semua tabel aktifitas agar data tampil
                    frm.refresh_field('aktifitas_produktif');
                    frm.refresh_field('aktifitas_tidak_produktif');
                    frm.refresh_field('aktifitas_maintenance');
                } else {
                    console.warn("Tidak ada data di Shift Activity Type atau response kosong.");
                }
            }
        });
    }
});
