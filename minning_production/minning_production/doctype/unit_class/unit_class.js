// Copyright (c) 2024, Wahyu Triono and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Unit Class", {
// 	refresh(frm) {

// 	},
// });

frappe.ui.form.on("Unit Material Vesel Table", {
    material: function(frm, cdt, cdn) {
        let row = locals[cdt][cdn];
        
        row.satuan = row.material === "CC" ? "TON" : "BCM";

        let duplicate = false;
        frm.doc.material_vesel.forEach(function(item) {
            if (item.material === row.material && item.name !== row.name) {
                duplicate = true;
            }
        });

        if (duplicate) {
            frappe.msgprint("Tidak bisa menambahkan material yang sudah ada!");
            frm.get_field("material_vesel").grid.grid_rows[(row.idx - 1)].remove();
        }

        frm.refresh_field("material_vesel");
    },
});