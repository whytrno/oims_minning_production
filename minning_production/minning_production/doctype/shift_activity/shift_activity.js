// Copyright (c) 2024, Wahyu Triono and contributors
// For license information, please see license.txt

frappe.ui.form.on("Shift Activity", {
	refresh(frm) {
        // Menyembunyikan opsi untuk menambah atau menghapus baris di masing-masing tabel aktifitas
        frm.fields_dict['aktifitas_produktif'].grid.wrapper.find('.grid-add-row').hide();
        // frm.fields_dict['aktifitas_produktif'].grid.wrapper.find('.grid-remove-rows').hide();
        frm.fields_dict['aktifitas_delay'].grid.wrapper.find('.grid-add-row').hide();
        // frm.fields_dict['aktifitas_delay'].grid.wrapper.find('.grid-remove-rows').hide();
        frm.fields_dict['aktifitas_idle'].grid.wrapper.find('.grid-add-row').hide();
        // frm.fields_dict['aktifitas_idle'].grid.wrapper.find('.grid-remove-rows').hide();
        frm.fields_dict['aktifitas_maintenance'].grid.wrapper.find('.grid-add-row').hide();
        // frm.fields_dict['aktifitas_maintenance'].grid.wrapper.find('.grid-remove-rows').hide();
    },

    onload(frm) {
        aktifitas_produktif = frm.doc.aktifitas_produktif;
        aktifitas_delay = frm.doc.aktifitas_delay;
        aktifitas_idle = frm.doc.aktifitas_idle;
        aktifitas_maintenance = frm.doc.aktifitas_maintenance;

        // Bersihkan tabel aktifitas jika memang sudah ada data di table ketika di load
        if (!aktifitas_produktif) {
            frm.clear_table('aktifitas_produktif');
        }
        if (!aktifitas_delay) {
            frm.clear_table('aktifitas_delay');
        }
        if (!aktifitas_idle) {
            frm.clear_table('aktifitas_idle');
        }
        if (!aktifitas_maintenance) {
            frm.clear_table('aktifitas_maintenance');
        }

        if(aktifitas_produktif.length === 0 && aktifitas_delay.length === 0 && aktifitas_idle.length === 0 && aktifitas_maintenance.length === 0) {
            // Ambil semua data dari Shift Activity Type
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Shift Activity Type',
                    fields: ['name', 'type'],
                    limit_page_length: 0
                },
                callback: function(response) {
                    const activities = response.message;
                    console.log(activities)

                    // Jika ada aktivitas, tambahkan ke child table yang sesuai
                    if (activities && activities.length > 0) {
                        activities.forEach(activity => {
                            let target_table;

                            // Tentukan tabel berdasarkan type aktivitas
                            if (activity.type === "Productive") {
                                target_table = 'aktifitas_produktif';
                            } else if (activity.type === "Delay") {
                                target_table = 'aktifitas_delay';
                            } else if (activity.type === "Idle") {
                                target_table = 'aktifitas_idle';
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
                        frm.refresh_field('aktifitas_delay');
                        frm.refresh_field('aktifitas_idle');
                        frm.refresh_field('aktifitas_maintenance');
                    } else {
                        console.warn("Tidak ada data di Shift Activity Type atau response kosong.");
                    }
                }
            });
        }
    }
});

frappe.ui.form.on('Delay Time Shift Activity Table', {
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

            // Log untuk memastikan format waktu benar
            console.log(waktu_mulai.toDate(), waktu_selesai.toDate());

            if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
                // Hitung selisih dalam menit
                let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

                // Set nilai field Menit
                row.menit = selisih_menit;
                frm.refresh_field('aktifitas_delay');
            } else {
                console.error("Format waktu tidak valid.");
            }
        }
    }
});

frappe.ui.form.on('Idle Time Shift Activity Table', {
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

            // Log untuk memastikan format waktu benar
            console.log(waktu_mulai.toDate(), waktu_selesai.toDate());

            if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
                // Hitung selisih dalam menit
                let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

                // Set nilai field Menit
                row.menit = selisih_menit;
                frm.refresh_field('aktifitas_idle');
            } else {
                console.error("Format waktu tidak valid.");
            }
        }
    }
});

frappe.ui.form.on('Productive Time Shift Activity Table', {
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

            // Log untuk memastikan format waktu benar
            console.log(waktu_mulai.toDate(), waktu_selesai.toDate());

            if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
                // Hitung selisih dalam menit
                let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

                // Set nilai field Menit
                row.menit = selisih_menit;
                frm.refresh_field('aktifitas_produktif');
            } else {
                console.error("Format waktu tidak valid.");
            }
        }
    }
});

frappe.ui.form.on('Maintenance Time Shift Activity Table', {
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

            // Log untuk memastikan format waktu benar
            console.log(waktu_mulai.toDate(), waktu_selesai.toDate());

            if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
                // Hitung selisih dalam menit
                let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

                // Set nilai field Menit
                row.menit = selisih_menit;
                frm.refresh_field('aktifitas_maintenance');
            } else {
                console.error("Format waktu tidak valid.");
            }
        }
    }
});
