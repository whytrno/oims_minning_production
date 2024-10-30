// Copyright (c) 2024, Wahyu Triono and contributors
// For license information, please see license.txt

let default_delay_data = [];
let default_idle_data = [];
let default_maintenance_data = [];

frappe.ui.form.on("Shift", {
	refresh(frm) {
        frm.fields_dict['aktifitas_delay'].grid.wrapper.find('.grid-add-row').hide();
        frm.fields_dict['aktifitas_idle'].grid.wrapper.find('.grid-add-row').hide();
        frm.fields_dict['aktifitas_maintenance'].grid.wrapper.find('.grid-add-row').hide();
        frm.fields_dict['data_ritase'].grid.wrapper.find('.grid-add-row').hide();
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
        // aktifitas_produktif = frm.doc.aktifitas_produktif;
        aktifitas_delay = frm.doc.aktifitas_delay;
        aktifitas_idle = frm.doc.aktifitas_idle;
        aktifitas_maintenance = frm.doc.aktifitas_maintenance;
        data_ritase = frm.doc.data_ritase;

        // Bersihkan tabel aktifitas jika memang sudah ada data di table ketika di load
        if (!aktifitas_delay) {
            frm.clear_table('aktifitas_delay');
        }
        if (!aktifitas_idle) {
            frm.clear_table('aktifitas_idle');
        }
        if (!aktifitas_maintenance) {
            frm.clear_table('aktifitas_maintenance');
        }
        if (!data_ritase) {
            frm.clear_table('data_ritase');
        }

        if(data_ritase.length === 0){
            for(let hour_start = 0; hour_start < 24; hour_start++){
                let new_row = frm.add_child('data_ritase');
                new_row.jam = hour_start + ":00";
                frm.refresh_field('data_ritase');
            }
        }

        if(aktifitas_delay.length === 0 && aktifitas_idle.length === 0 && aktifitas_maintenance.length === 0) {
            // Ambil semua data dari Shift Activity Type
            frappe.call({
                method: 'frappe.client.get_list',
                args: {
                    doctype: 'Shift Activity Type',
                    fields: ['name', 'type', 'nama'],
                    limit_page_length: 0
                },
                callback: function(response) {
                    const activities = response.message;

                    // Jika ada aktivitas, tambahkan ke child table yang sesuai
                    if (activities && activities.length > 0) {
                        activities.forEach(activity => {
                            let target_table;

                            // Tentukan tabel berdasarkan type aktivitas
                            if (activity.type === "Delay") {
                                default_delay_data.push(activity.name)
                                target_table = 'aktifitas_delay';
                            } else if (activity.type === "Idle") {
                                default_idle_data.push(activity.name)
                                target_table = 'aktifitas_idle';
                            } else if (activity.type === "Maintenance") {
                                default_maintenance_data.push(activity.name);
                                target_table = 'aktifitas_maintenance';
                            }

                            if (target_table) {
                                let new_row = frm.add_child(target_table);
                                new_row.aktifitas = activity.name;
                                new_row.detail = activity.nama;
                                new_row.waktu_mulai = "";
                                new_row.waktu_akhir = "";
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

frappe.ui.form.on('Delay Time Shift Activity Table', {
    // aktifitas: function(frm, cdt, cdn) {
    //     frappe.timeout(0).then(() => {
    //         frm.doc.aktifitas_delay.forEach((item, idx) => {
    //             item.aktifitas = default_delay_data[idx];
    //         });
    //         frm.refresh_field("aktifitas_delay");
    //     });
    // },
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

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
    // aktifitas: function(frm, cdt, cdn) {
    //     frappe.timeout(0).then(() => {
    //         frm.doc.aktifitas_idle.forEach((item, idx) => {
    //             item.aktifitas = default_idle_data[idx];
    //         });
    //         frm.refresh_field("aktifitas_idle");
    //     });
    // },
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

// frappe.ui.form.on('Productive Time Shift Activity Table', {
//     aktifitas: function(frm, cdt, cdn) {
//         frappe.timeout(0).then(() => {
//             frm.doc.aktifitas_produktif.forEach((item, idx) => {
//                 item.aktifitas = default_produk_data[idx];
//             });
//             frm.refresh_field("aktifitas_produktif");
//         });
//     },
//     waktu_selesai: function(frm, cdt, cdn) {
//         let row = locals[cdt][cdn];
        
//         if (row.waktu_mulai && row.waktu_selesai) {
//             // Konversi waktu mulai dan akhir menggunakan moment.js
//             let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
//             let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

//             // Log untuk memastikan format waktu benar
//             console.log(waktu_mulai.toDate(), waktu_selesai.toDate());

//             if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
//                 // Hitung selisih dalam menit
//                 let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

//                 // Set nilai field Menit
//                 row.menit = selisih_menit;
//                 frm.refresh_field('aktifitas_produktif');
//             } else {
//                 console.error("Format waktu tidak valid.");
//             }
//         }
//     }
// });

frappe.ui.form.on('Maintenance Time Shift Activity Table', {
    // aktifitas: function(frm, cdt, cdn) {
    //     frappe.timeout(0).then(() => {
    //         frm.doc.aktifitas_maintenance.forEach((item, idx) => {
    //             item.aktifitas = default_maintenance_data[idx];
    //         });
    //         frm.refresh_field("aktifitas_maintenance");
    //     });
    // },
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

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

frappe.ui.form.on("Ritase Table", {
    jam: function(frm, cdt, cdn) {
        frappe.timeout(0).then(() => {
            frm.doc.data_ritase.forEach((item, idx) => {
                item.jam = `${idx}:00`;
            });
            frm.refresh_field("data_ritase");
        });
    }
});
