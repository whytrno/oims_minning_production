// Copyright (c) 2024, Wahyu Triono and contributors
// For license information, please see license.txt

let total_bd_menit = 0;
let total_stb_act_menit = 0;
let total_ritase = 0;

frappe.ui.form.on("Shift", {
	refresh(frm) {
        frm.fields_dict['aktifitas_delay'].grid.wrapper.find('.grid-add-row').hide();
        frm.fields_dict['aktifitas_idle'].grid.wrapper.find('.grid-add-row').hide();
        frm.fields_dict['aktifitas_maintenance'].grid.wrapper.find('.grid-add-row').hide();
        frm.fields_dict['data_ritase'].grid.wrapper.find('.grid-add-row').hide();
    },
    tipe_shift: function (frm) {
        let start_hour = frm.doc.tipe_shift == "Day (S1)" ? 6 : 18;
        let end_hour = frm.doc.tipe_shift == "Day (S1)" ? 18 : 6;
        frm.clear_table('data_ritase');
    
        for (let hour = start_hour; hour !== end_hour; hour = (hour + 1) % 24) {
            let new_row = frm.add_child('data_ritase');
            new_row.jam = hour + ":00";
        }
    
        // Add the final hour (end_hour)
        let final_row = frm.add_child('data_ritase');
        final_row.jam = end_hour + ":00";
    
        frm.refresh_field('data_ritase');
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

        if (data_ritase.length === 0) {
            frm.clear_table('data_ritase');

            let start_hour = frm.doc.tipe_shift == "Day (S1)" ? 6 : 18;
            let end_hour = frm.doc.tipe_shift == "Day (S1)" ? 18 : 6;
            for(let hour_start = start_hour; hour_start <= end_hour; hour_start++){
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
                                target_table = 'aktifitas_delay';
                            } else if (activity.type === "Idle") {
                                target_table = 'aktifitas_idle';
                            } else if (activity.type === "Maintenance") {
                                target_table = 'aktifitas_maintenance';
                            }

                            if (target_table) {
                                let new_row = frm.add_child(target_table);
                                new_row.aktifitas = activity.name;
                                new_row.detail = activity.nama;
                                new_row.waktu_mulai = "";
                                new_row.waktu_selesai = "";
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
    waktu_mulai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

            if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
                // Hitung selisih dalam menit
                let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

                // Set nilai field Menit
                total_stb_act_menit -= row.menit;
                total_stb_act_menit += selisih_menit;
                row.menit = selisih_menit;

                frm.set_value('total_stb_act_menit', total_stb_act_menit);
                frm.refresh_field('aktifitas_delay');
            } else {
                console.error("Format waktu tidak valid.");
            }
        } else {
            row.menit = 0;
        }
    },
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
                total_stb_act_menit -= row.menit;
                total_stb_act_menit += selisih_menit;
                row.menit = selisih_menit;

                frm.set_value('total_stb_act_menit', total_stb_act_menit);
                frm.refresh_field('aktifitas_delay');
            } else {
                console.error("Format waktu tidak valid.");
            }
        } else {
            row.menit = 0;
        }
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.waktu_mulai = "";
        row.waktu_selesai = "";

        total_stb_act_menit -= row.menit;
        row.menit = 0;
        frm.set_value('total_stb_act_menit', total_stb_act_menit);

        frm.refresh_field('aktifitas_delay');
    }
});

frappe.ui.form.on('Idle Time Shift Activity Table', {
    waktu_mulai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

            if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
                // Hitung selisih dalam menit
                let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

                // Set nilai field Menit
                total_stb_act_menit -= row.menit;
                total_stb_act_menit += selisih_menit;
                row.menit = selisih_menit;

                frm.set_value('total_stb_act_menit', total_stb_act_menit);

                frm.refresh_field('aktifitas_idle');
            } else {
                console.error("Format waktu tidak valid.");
            }
        } else {
            row.menit = 0;
        }
    },
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
                total_stb_act_menit -= row.menit;
                total_stb_act_menit += selisih_menit;
                row.menit = selisih_menit;

                frm.set_value('total_stb_act_menit', total_stb_act_menit);
                frm.refresh_field('aktifitas_idle');
            } else {
                console.error("Format waktu tidak valid.");
            }
        } else {
            row.menit = 0;
        }
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.waktu_mulai = "";
        row.waktu_selesai = "";
        
        total_stb_act_menit -= row.menit;
        row.menit = 0;
        frm.set_value('total_stb_act_menit', total_stb_act_menit);

        frm.refresh_field('aktifitas_idle');
    }
});

frappe.ui.form.on('Maintenance Time Shift Activity Table', {
    waktu_mulai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

            if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
                // Hitung selisih dalam menit
                let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

                total_bd_menit -= row.menit;
                total_bd_menit += selisih_menit;
                row.menit = selisih_menit;

                frm.set_value('total_bd_menit', total_bd_menit);
                frm.refresh_field('aktifitas_maintenance');
            } else {
                console.error("Format waktu tidak valid.");
            }
        }
    },
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.waktu_mulai && row.waktu_selesai) {
            // Konversi waktu mulai dan akhir menggunakan moment.js
            let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
            let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

            if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
                // Hitung selisih dalam menit
                let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

                total_bd_menit -= row.menit;
                total_bd_menit += selisih_menit;
                row.menit = selisih_menit;

                frm.set_value('total_bd_menit', total_bd_menit);
                frm.refresh_field('aktifitas_maintenance');
            } else {
                console.error("Format waktu tidak valid.");
            }
        }
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.waktu_mulai = null;
        row.waktu_selesai = null;
        
        // Kurangi total_bd_menit dengan nilai sebelumnya
        total_bd_menit -= row.menit;
        row.menit = 0;
        frm.set_value('total_bd_menit', total_bd_menit);

        frm.refresh_field('aktifitas_maintenance');
    }
});

frappe.ui.form.on('Ritase Table', {
    ritase: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (row.ritase === 0) {
            if (row.__previous_ritase !== undefined) {
                // If the previous ritase is defined, subtract it from total_ritase
                total_ritase -= row.__previous_ritase;
                row.__previous_ritase = 0; // Reset previous ritase
            }
        } else {
            // Handle normal cases when ritase is greater than 0
            if (row.__previous_ritase !== undefined) {
                total_ritase -= row.__previous_ritase; // Subtract the old value
            }

            total_ritase += row.ritase; // Add the new value
            row.__previous_ritase = row.ritase; // Update previous ritase
        }

        frm.set_value('total_ritase', total_ritase);
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        console.log(row);

        // If ritase is not 0, subtract it from total_ritase
        if (row.ritase) {
            total_ritase -= row.ritase;
        }

        // Reset the fields
        row.material = "";
        row.lokasi_front = "";
        row.lokasi_disposal = "";
        row.jarak_buang = 0;
        row.ritase = 0;

        // Reset previous ritase
        row.__previous_ritase = 0;

        frm.set_value('total_ritase', total_ritase);
        frm.refresh_field('data_ritase');
    }
});
