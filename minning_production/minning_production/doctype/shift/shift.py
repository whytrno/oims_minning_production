# Copyright (c) 2024, Wahyu Triono and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from datetime import datetime, timedelta


class Shift(Document):
    def before_save(self):
        total_hm = calculate_total_hm(self.hour_meter_start, self.hour_meter_stop)
        # total_bd_menit = get_total_breakdown(self.name)
        
        self.total_hm = total_hm
        # print(f'self: {self.hour_meter_start} - {self.hour_meter_stop}, {self.jam_produksi_start} - {self.jam_produksi_stop}')
        self.total_jam_produksi = calculate_total_jam_produksi(self.jam_produksi_start, self.jam_produksi_stop)
        # self.total_stb_act_menit = get_total_standby(self.name)
        # self.total_bd_menit = get_total_breakdown(self.name)
        total_bd_menit = int(self.total_bd_menit)
        
        self.pa = calculate_pa(total_bd_menit)
        self.bd = calculate_bd(total_bd_menit)
        self.ua = calculate_ua(self.total_hm, total_bd_menit)
        pass

def calculate_total_hm(hm_mulai, hm_selesai):
    if hm_mulai and hm_selesai:
        total_hm = float(hm_selesai) - float(hm_mulai)
        return round(total_hm, 2)
    
def calculate_total_jam_produksi(jam_produksi_mulai, jam_produksi_selesai):
    # Cek apakah format waktu mengandung desimal
    def is_valid_time_format(time_str):
        if not time_str:
            return False
        # Memastikan format waktu tidak mengandung desimal setelah detik
        return len(time_str.split('.')) == 1 and time_str.count(':') == 2
    
    if is_valid_time_format(jam_produksi_mulai) and is_valid_time_format(jam_produksi_selesai):
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

            return round(total_jam_produksi, 2)
        else:
            raise ValueError("jam_produksi_mulai dan jam_produksi_selesai harus berupa string waktu.")
    else:
        return 0  #

# def get_total_standby(name):
#     total_standby = 0

#     delay_times = frappe.get_all('Delay Time Shift Activity Table', filters={'parent': name}, fields=['menit'])
#     idle_times = frappe.get_all('Idle Time Shift Activity Table', filters={'parent': name}, fields=['menit'])

#     for delay in delay_times:
#         total_standby += int(delay.get("menit") or 0)

#     for idle in idle_times:
#         total_standby += int(idle.get("menit") or 0)
        
#     print(f'Total Standby: {total_standby}')

#     return total_standby

# def get_total_breakdown(name):
#     breakdown_times = frappe.get_list('Maintenance Time Shift Activity Table', filters={'parent': name}, fields=['menit'])
#     print('Breakdown Times:', breakdown_times)
#     total_breakdown = 0

#     for breakdown in breakdown_times:
#         total_breakdown += int(breakdown.get("menit") or 0)

#     print(f'Total Breakdown: {total_breakdown}')
    
#     return total_breakdown

@frappe.whitelist()
def calculate_pa(total_bd_menit):
    pa = ((720 - total_bd_menit) / 720) * 100
    print(f'PA: {pa}')

    if (pa < 0):
        pa = 0

    return round(pa, 2)

@frappe.whitelist()
def calculate_bd(total_bd_menit):
    total_bd = (total_bd_menit / 720) * 100

    if (total_bd < 0):
        total_bd = 0

    return round(total_bd, 2)

@frappe.whitelist()
def calculate_ua(total_hm, total_bd_menit):
    if total_hm and total_bd_menit:
        ua = ((total_hm * 60) / (720 - total_bd_menit)) * 100

        if (ua < 0):
            ua = 0

        return round(ua, 2)

@frappe.whitelist()
def get_sampling_vesel_volume(unit_name):
    # Step 1: Dapatkan Kelas dari Unit
    unit_doc = frappe.get_doc("Unit", unit_name)
    kelas_name = unit_doc.kelas  # Asumsi field 'kelas' adalah link ke Doctype 'Unit Class'

    if not kelas_name:
        frappe.throw("Unit tidak memiliki kelas yang terkait")

    # Step 2: Dapatkan Material Vesel yang terkait dengan Kelas dari Doctype Unit Class
    kelas_doc = frappe.get_doc("Unit Class", kelas_name)
    material_vesel_data = []

    if kelas_doc.get('material_vesel'):  # Asumsi 'material_vesel' adalah nama field child table di Unit Class
        for item in kelas_doc.material_vesel:
            material_vesel_data.append({
                'material': item.material,  # Sesuaikan nama field jika berbeda
                'sampling_vesel_volume': item.sampling_vesel_volume,
                'satuan': item.satuan  # Field lain yang Anda butuhkan
            })

    return material_vesel_data
