// Copyright (c) 2024, Wahyu Triono and contributors
// For license information, please see license.txt

frappe.ui.form.on("Shift", {
    refresh(frm) {
        // get_total_standby(frm);
    },

    jam_produksi_start: function (frm) {
        calculate_total_jam_produksi(frm);
    },
    jam_produksi_stop: function (frm) {
        calculate_total_jam_produksi(frm);
    },
    hour_meter_start: function (frm) {
        calculate_total_hm(frm);
    },
    hour_meter_stop: function (frm) {
        calculate_total_hm(frm);
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
                limit_page_length: 0
            },
            callback: function (response) {
                const activities = response.message;

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
});

function calculate_total_hm(frm) {
    const hm_mulai = frm.doc.hour_meter_start;
    const hm_selesai = frm.doc.hour_meter_stop;

    if (hm_mulai && hm_selesai) {
        frappe.call({
            method: 'minning_production.minning_production.doctype.shift.shift.calculate_total_hm',
            args: {
                hm_mulai: hm_mulai,
                hm_selesai: hm_selesai
            },
            callback: function (response) {
                const total_hm = response.message;
                frm.set_value('total_hm', total_hm);
            }
        });
    }
}

function calculate_total_jam_produksi(frm) {
    let jam_produksi_mulai = frm.doc.jam_produksi_start;
    let jam_produksi_selesai = frm.doc.jam_produksi_stop;

    if (jam_produksi_mulai && jam_produksi_selesai) {
        frappe.call({
            method: 'minning_production.minning_production.doctype.shift.shift.calculate_total_jam_produksi',
            args: {
                jam_produksi_mulai: jam_produksi_mulai,
                jam_produksi_selesai: jam_produksi_selesai
            },
            callback: function (response) {
                const total_jam_produksi = response.message;
                frm.set_value('total_jam_produksi', total_jam_produksi);
            }
        });
    }
}

// function get_total_standby(frm) {
//     const name = frm.doc.name;

//     frappe.call({
//         method: 'minning_production.minning_production.doctype.shift_activity.shift_activity.get_total_standby',
//         args: {
//             name: name
//         },
//         callback: function (response) {
//             console.log(response);
//             const total_standby = response.message;
//             frm.set_value('total_stb_act_menit', total_standby);
//         }
//     });
// }