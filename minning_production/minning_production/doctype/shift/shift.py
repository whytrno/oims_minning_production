# Copyright (c) 2024, Wahyu Triono and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime, timedelta


class Shift(Document):
    def before_save(self):
        self.total_hm = calculate_total_hm(self.hour_meter_start, self.hour_meter_stop)
        self.total_jam_produksi = calculate_total_jam_produksi(self.jam_produksi_start, self.jam_produksi_stop)
        self.unk_standby_menit = calculate_unk_standby_menit(self.total_hm, self.total_stb_act_menit, self.total_bd_menit)

@frappe.whitelist()
def calculate_total_hm(hm_mulai, hm_selesai):
    if hm_mulai and hm_selesai:
        total_hm = float(hm_selesai) - float(hm_mulai)
        return total_hm
    
@frappe.whitelist()
def calculate_total_jam_produksi(jam_produksi_mulai, jam_produksi_selesai):
    if jam_produksi_mulai and jam_produksi_selesai:
        format_waktu = "%H:%M:%S"

        # Cek jika jam_produksi_mulai dan jam_produksi_selesai adalah timedelta
        if isinstance(jam_produksi_mulai, timedelta):
            jam_produksi_mulai = str(jam_produksi_mulai)  # Ubah ke string jika perlu
        if isinstance(jam_produksi_selesai, timedelta):
            jam_produksi_selesai = str(jam_produksi_selesai)  # Ubah ke string jika perlu

        # Pastikan jam_produksi_mulai dan jam_produksi_selesai adalah string yang valid
        if isinstance(jam_produksi_mulai, str) and isinstance(jam_produksi_selesai, str):
            # Ubah menjadi objek datetime
            jam_produksi_mulai_jam = datetime.strptime(jam_produksi_mulai, format_waktu)
            jam_produksi_selesai_jam = datetime.strptime(jam_produksi_selesai, format_waktu)

            # Hitung selisih
            selisih = jam_produksi_selesai_jam - jam_produksi_mulai_jam
            total_jam_produksi = selisih.total_seconds() / 3600

            # Pastikan nilai total_jam_produksi selalu positif
            if total_jam_produksi < 0:
                total_jam_produksi += 24

            return total_jam_produksi
        else:
            raise ValueError("jam_produksi_mulai dan jam_produksi_selesai harus berupa string waktu.")
    else:
        return 0  #
    
@frappe.whitelist()
def calculate_unk_standby_menit(total_hm, total_stb_act_menit, total_bd_menit):
    unk_stb_menit = 0
    
    if not isinstance(total_hm, str) and not isinstance(total_stb_act_menit, str) and not isinstance(total_bd_menit, str):
        if ((total_hm * 60) + total_stb_act_menit + total_bd_menit < 720):
            unk_stb_menit = 720 - (total_hm * 60) - total_stb_act_menit - total_bd_menit
        elif ((total_hm * 60) + total_stb_act_menit > 720):
            unk_stb_menit = "Cek Standby"
        else:
            unk_stb_menit = 0
            
        return unk_stb_menit
