# Copyright (c) 2024, Wahyu Triono and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class ShiftActivity(Document):
    def before_save(self):
        shift = frappe.get_doc('Shift', self.shift)
        shift.total_stb_act_menit = get_total_standby(self.name)
        total_bd_menit = get_total_breakdown(self.name)
        shift.total_bd_menit = total_bd_menit
        shift.total_hm = int(shift.total_hm) if isinstance(shift.total_hm, (int, str)) and shift.total_hm.isdigit() else 0

        shift.pa = calculate_pa(total_bd_menit)
        shift.bd = calculate_bd(total_bd_menit)
        shift.ua = calculate_ua(shift.total_hm, total_bd_menit)
        shift.save()

@frappe.whitelist()
def get_total_standby(name):
    total_standby = 0

    delay_times = frappe.get_all('Delay Time Shift Activity Table', filters={'parent': name}, fields=['menit'])
    idle_times = frappe.get_all('Idle Time Shift Activity Table', filters={'parent': name}, fields=['menit'])

    for delay in delay_times:
        total_standby += int(delay.menit) or 0

    for idle in idle_times:
        total_standby += int(idle.menit) or 0
        
    print(f'Total Standby: {total_standby}')

    return total_standby

@frappe.whitelist()
def get_total_breakdown(name):
	breakdown_times = frappe.get_all('Maintenance Time Shift Activity Table', filters={'parent': name}, fields=['menit'])
	total_breakdown = 0

	for breakdown in breakdown_times:
		total_breakdown += int(breakdown.menit) or 0

	return total_breakdown

@frappe.whitelist()
def calculate_pa(total_bd_menit):
    pa = ((720 - total_bd_menit) / 720) * 100

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
    ua = ((total_hm * 60) / (720 - total_bd_menit)) * 100

    if (ua < 0):
        ua = 0

    return round(ua, 2)