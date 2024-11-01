// Copyright (c) 2024, Wahyu Triono and contributors
// For license information, please see license.txt

let total_bd_menit = 0;
let total_stb_act_menit = 0;
let total_ritase = 0;
let material_sampling_vesel_unit = null;

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
    data_ritase: function (frm) {
        
    },
    unit: function (frm) {
        if(frm.doc.unit){
            frappe.call({
                method: "minning_production.minning_production.doctype.shift.shift.get_sampling_vesel_volume",
                args: {
                    unit_name: frm.doc.unit,
                },
                callback: function (r) {
                    if (r.message) {
                        const materialVeselData = r.message;
                        material_sampling_vesel_unit = materialVeselData
                    } else {
                        console.warn("Tidak ada data di Shift Activity Type atau response kosong.");
                    }
                },
            });
        }
    },

    onload(frm) {
        // aktifitas_produktif = frm.doc.aktifitas_produktif;
        aktifitas_delay = frm.doc.aktifitas_delay;
        aktifitas_idle = frm.doc.aktifitas_idle;
        aktifitas_maintenance = frm.doc.aktifitas_maintenance;
        data_ritase = frm.doc.data_ritase;
        report_muatan = frm.doc.report_muatan;

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

function updateMenit(frm, row, totalVarName) {
    // Pastikan `totalVarName` memiliki nilai awal sebagai angka
    frm[totalVarName] = frm[totalVarName] || 0;

    if (row.waktu_mulai && row.waktu_selesai) {
        let waktu_mulai = moment(row.waktu_mulai, "HH:mm:ss");
        let waktu_selesai = moment(row.waktu_selesai, "HH:mm:ss");

        if (waktu_mulai.isValid() && waktu_selesai.isValid()) {
            let selisih_menit = waktu_selesai.diff(waktu_mulai, 'minutes');

            // Periksa jika row.menit terdefinisi; jika tidak, anggap nilainya 0
            row.menit = row.menit || 0;

            // Update nilai total menit
            frm[totalVarName] = (frm[totalVarName] - row.menit) + selisih_menit; // Perbaharui total dengan selisih baru
            row.menit = selisih_menit;

            console.log(row.menit);
            console.log(frm[totalVarName]);

            frm.set_value(totalVarName, frm[totalVarName]);
            frm.refresh_field(row.parentfield);
        } else {
            console.error("Format waktu tidak valid.");
        }
    } else {
        row.menit = 0;
    }
}

// Fungsi umum untuk reset waktu dan menit
function resetMenit(frm, row, totalVarName) {
    frm[totalVarName] -= row.menit || 0;
    row.waktu_mulai = "";
    row.waktu_selesai = "";
    row.menit = 0;

    frm.set_value(totalVarName, frm[totalVarName]);
    frm.refresh_field(row.parentfield);
}

frappe.ui.form.on('Delay Time Shift Activity Table', {
    waktu_mulai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        updateMenit(frm, row, 'total_stb_act_menit');
    },
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        updateMenit(frm, row, 'total_stb_act_menit');
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        resetMenit(frm, row, 'total_stb_act_menit');
    }
});

frappe.ui.form.on('Idle Time Shift Activity Table', {
    waktu_mulai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        updateMenit(frm, row, 'total_stb_act_menit');
    },
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        updateMenit(frm, row, 'total_stb_act_menit');
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        resetMenit(frm, row, 'total_stb_act_menit');
    }
});

frappe.ui.form.on('Maintenance Time Shift Activity Table', {
    waktu_mulai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        updateMenit(frm, row, 'total_bd_menit');
    },
    waktu_selesai: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        updateMenit(frm, row, 'total_bd_menit');
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        resetMenit(frm, row, 'total_bd_menit');
    }
});

frappe.ui.form.on('Ritase Table', {
    material: function(frm, cdt, cdn){
        let row = locals[cdt][cdn];
        if (!frm.doc.unit) {
            frappe.msgprint(__('Silahkan pilih Unit terlebih dahulu sebelum mengisi data Ritase.'));
            frappe.validated = false;

            row.material = "";
            row.lokasi_front = "";
            row.lokasi_disposal = "";
            row.jarak_buang = 0;
            row.ritase = 0;

            return;
        }

        if(row.material){
            let material = material_sampling_vesel_unit.find(material => material.material === row.material);
            row.sampling_vesel = material ? material.sampling_vesel_volume : 0;

            if(row.ritase && row.sampling_vesel){
                row.muatan = row.ritase * row.sampling_vesel;
            }

            frm.refresh_field('data_ritase');
        }
    },
    ritase: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

        if (!frm.doc.unit) {
            frappe.msgprint(__('Silahkan pilih Unit terlebih dahulu sebelum mengisi data Ritase.'));
            frappe.validated = false;

            row.material = "";
            row.lokasi_front = "";
            row.lokasi_disposal = "";
            row.jarak_buang = 0;
            row.ritase = 0;

            return;
        }

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

        if(row.material && row.sampling_vesel){
            row.muatan = row.ritase * row.sampling_vesel;
        }

        frm.refresh_field('data_ritase');
        frm.set_value('total_ritase', total_ritase);
    },
    reset: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];

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