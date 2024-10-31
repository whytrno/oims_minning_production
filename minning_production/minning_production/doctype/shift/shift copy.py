// Copyright (c) 2024, Wahyu Triono and contributors
// For license information, please see license.txt

let default_delay_data = [];
let default_idle_data = [];
let default_maintenance_data = [];
let total_bd_menit = 0;
let total_ritase = 0;
let total_stb_act_menit = 0;

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
    total_bd_menit: function (frm) {
        calculate_pa(frm);
        calculate_bd(frm);

        if(frm.doc.total_hm){
            calculate_ua(frm);
        }
    },
    total_hm: function (frm) {
        if(frm.doc.total_bd_menit){
            calculate_ua(frm);
        }
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
        }else{
            frm.doc.aktifitas_delay.forEach(row => {
                total_stb_act_menit += parseInt(row.menit);
            });
            frm.set_value('total_stb_act_menit', total_stb_act_menit);
        }

        if (!aktifitas_idle) {
            frm.clear_table('aktifitas_idle');
        }else{
            frm.doc.aktifitas_idle.forEach(row => {
                total_stb_act_menit += parseInt(row.menit);
            });
            frm.set_value('total_stb_act_menit', total_stb_act_menit);
        }

        if (!aktifitas_maintenance) {
            frm.clear_table('aktifitas_maintenance');
        }else{
            frm.doc.aktifitas_maintenance.forEach(row => {
                total_bd_menit += parseInt(row.menit);
            });
            frm.set_value('total_bd_menit', total_bd_menit);
        }

        if (!data_ritase) {
            frm.clear_table('data_ritase');

            let start_hour = frm.doc.tipe_shift == "Day (S1)" ? 6 : 18;
            let end_hour = frm.doc.tipe_shift == "Day (S1)" ? 18 : 6;
            for(let hour_start = start_hour; hour_start <= end_hour; hour_start++){
                let new_row = frm.add_child('data_ritase');
                new_row.jam = hour_start + ":00";
                
                frm.refresh_field('data_ritase');
            }
        }else{
            frm.doc.data_ritase.forEach(row => {
                total_ritase += parseInt(row.ritase);
            });
            frm.set_value('total_ritase', total_ritase);
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

function calculate_pa(frm) {
    const total_bd_menit = frm.doc.total_bd_menit;
    const pa = ((720 - total_bd_menit) / 720) * 100;

    if (pa < 0) {
        pa = 0;
    }

    frm.set_value('pa', pa);
}

function calculate_bd(frm) {
    const total_bd_menit = frm.doc.total_bd_menit;
    const bd = (total_bd_menit / 720) * 100;

    if (bd < 0) {
        bd = 0;
    }

    frm.set_value('bd', bd);
}

function calculate_ua(frm) {
    if(frm.doc.total_hm && frm.doc.total_bd_menit){
        const total_hm = frm.doc.total_hm;
        const total_bd_menit = frm.doc.total_bd_menit;
        const ua = ((total_hm * 60) / (720 - total_bd_menit)) * 100;

        if (ua < 0) {
            ua = 0;
        }

        frm.set_value('ua', ua);
    }else{
        frm.set_value('ua', 0);
    }
}

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
                total_stb_act_menit -= row.menit
                row.menit = selisih_menit;
                total_stb_act_menit += selisih_menit;

                frm.refresh_field('aktifitas_delay');
            } else {
                console.error("Format waktu tidak valid.");
            }
        } else {
            row.menit = 0;
        }

        frm.set_value('total_stb_act_menit', total_stb_act_menit);
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
                total_stb_act_menit -= row.menit
                row.menit = selisih_menit;
                total_stb_act_menit += selisih_menit;

                frm.refresh_field('aktifitas_delay');
            } else {
                console.error("Format waktu tidak valid.");
            }
        } else {
            row.menit = 0;
        }

        frm.set_value('total_stb_act_menit', total_stb_act_menit);
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.waktu_mulai = "";
        row.waktu_selesai = "";
        row.menit = 0;

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
                total_stb_act_menit -= row.menit
                row.menit = selisih_menit;
                total_stb_act_menit += selisih_menit;

                frm.refresh_field('aktifitas_idle');
            } else {
                console.error("Format waktu tidak valid.");
            }
        } else {
            row.menit = 0;
        }

        frm.set_value('total_stb_act_menit', total_stb_act_menit);
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
                total_stb_act_menit -= row.menit
                row.menit = selisih_menit;
                total_stb_act_menit += selisih_menit;

                frm.refresh_field('aktifitas_idle');
            } else {
                console.error("Format waktu tidak valid.");
            }
        } else {
            row.menit = 0;
        }

        frm.set_value('total_stb_act_menit', total_stb_act_menit);
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.waktu_mulai = "";
        row.waktu_selesai = "";
        row.menit = 0;

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

                // Set nilai field Menit
                total_bd_menit -= row.menit
                row.menit = selisih_menit;
                total_bd_menit += selisih_menit;

                frm.refresh_field('aktifitas_maintenance');
            } else {
                console.error("Format waktu tidak valid.");
            }
        }

        frm.set_value('total_bd_menit', total_bd_menit);
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
                total_bd_menit -= row.menit
                row.menit = selisih_menit;
                total_bd_menit += selisih_menit;

                frm.refresh_field('aktifitas_maintenance');
            } else {
                console.error("Format waktu tidak valid.");
            }
        }

        frm.set_value('total_bd_menit', total_bd_menit);
    },
    reset: function(frm, cdt, cdn) {
        console.log(total_bd_menit);
        let row = locals[cdt][cdn];
        row.waktu_mulai = null;
        row.waktu_selesai = null;
        
        total_bd_menit -= row.menit;
        console.log(total_bd_menit);
        row.menit = 0;
        frm.set_value('total_bd_menit', total_bd_menit);

        frm.refresh_field('aktifitas_maintenance');
    }
});

// function set_menit(waktu_mulai, waktu_akhir) {
//     if (waktu_mulai && waktu_akhir) {
//         // Konversi waktu mulai dan akhir menggunakan moment.js
//         let waktu_mulai = moment(waktu_mulai, "HH:mm:ss"); // Sesuaikan formatnya dengan field waktu
//         let waktu_akhir = moment(waktu_akhir, "HH:mm:ss");

//         if (waktu_mulai.isValid() && waktu_akhir.isValid()) {
//             // Hitung selisih dalam menit
//             let selisih_menit = waktu_akhir.diff(waktu_mulai, 'minutes');

//             return selisih_menit;
//         } else {
//             console.error("Format waktu tidak valid.");
//         }
//     }
// }

frappe.ui.form.on('Ritase Table', {
    ritase: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        if (row.ritase) {
            total_ritase += row.ritase;
        }

        frm.set_value('total_ritase', total_ritase);
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        row.material = "";
        row.lokasi_front = "";
        row.lokasi_disposal = "";
        row.jarak_buang = "";
        row.ritase = 0;
        row.excavator = "";

        total_ritase -= row.ritase;

        frm.refresh_field('total_ritase');
    }
});