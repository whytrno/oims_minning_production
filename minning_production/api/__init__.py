import frappe
from frappe import _
from frappe.model import get_permitted_fields
from frappe.model.workflow import get_workflow_name
from frappe.query_builder import Order
from frappe.utils import add_days, date_diff, getdate, strip_html
from datetime import datetime

def get_current_employee_info() -> dict:
	current_user = frappe.session.user
	employee = frappe.db.get_value(
		"Karyawan",
		{"user_id": current_user, "status": "Aktif"},
		[
			"name",
			"nrp",
			"nama_lengkap",
			"jabatan",
			"user_id",
		],
		as_dict=True,
	)
	return employee

@frappe.whitelist()
def get_unit_info(unit: str) -> dict:
	data = frappe.db.get_value(
		"Unit", 
		unit, 
		[
			"merk_unit", 
			"kelas", 
			"model", 
			"unit_type", 
			"no_lambung", 
			"foto_unit"
		], as_dict=True)

	if not data.get("foto_unit"):
		if data.get("unit_type") == "EXCAVATOR":
			data["foto_unit"] = "http://localhost:8000/files/excavator.jpg"
		elif data.get("unit_type") == "DUMP TRUCK":
			data["foto_unit"] = "http://localhost:8000/files/dump-truck.jpg"
		else:
			data["foto_unit"] = "http://localhost:8000/files/excavator.jpg"
	
	return data

@frappe.whitelist()
def get_today_fueling_data() -> list:
	karyawan = get_current_employee_info()
	today = datetime.now().date()

	data = frappe.db.get_all(
		"Fueling Table",
		filters={
			"pengisi_bahan_bakar": karyawan.name,
			"modified": ["between", [today, today]]
		},
		fields=["volume_litter", "hm", "parent"],
		order_by="creation desc",
	)

	return data


@frappe.whitelist()
def get_today_fueling_volume() -> float:
    fuel_data = get_today_fueling_data()
    volume = sum([d["volume_litter"] for d in fuel_data])


    return float(volume or 0.0)


@frappe.whitelist()
def get_shift_by_unit_today(unit: str) -> dict:
	today = datetime.now().date()
	shift = frappe.db.get_value(
		"Shift",
		{
			"unit": unit,
			"tanggal_shift": today,
			"jam_produksi_start": ("<=", datetime.now().time()),
			"jam_produksi_stop": (">=", datetime.now().time()),
		},
		[
			"nama_operator", "unit", "tipe_shift", "tanggal_shift", "name"
		],
		as_dict=True
	)

	if shift:
		shift["shift"] = f"{shift.tanggal_shift} | {shift.tipe_shift}"
	
	return shift

@frappe.whitelist()
def check_there_is_shift_unit_today(unit: str) -> bool:
	today = datetime.now().date()
	shift = frappe.db.exists(
		"Shift",
		{
			"unit": unit,
			"tanggal_shift": today,
			"jam_produksi_start": ("<=", datetime.now().time()),
			"jam_produksi_stop": (">=", datetime.now().time())
		}
	)

	return shift

@frappe.whitelist()
def submit_fueling_form(data, shift):
    """
    Fungsi untuk menambahkan satu entry ke child table `refueling_data` di Doctype `Shift`.
    Args:
        data (dict): Data pengisian bahan bakar yang berisi `pengisi_bahan_bakar`, `volume_litter`, dan `hm`.
        shift (str): Nama dari dokumen Shift yang ingin ditambahkan data pengisian bahan bakar.
    """
    try:
        # Dapatkan dokumen Shift berdasarkan `shift`
        shift_doc = frappe.get_doc("Shift", shift)

        # Tambahkan data ke child table `refueling_data`
        shift_doc.append("refueling_data", {
            "pengisi_bahan_bakar": data.get("pengisi_bahan_bakar"),
            "volume_litter": data.get("volume_litter"),
            "hm": data.get("hm")
        })

        # Simpan dokumen Shift
        shift_doc.save()
        frappe.db.commit()

        return {"status": "success", "message": _("Fueling data added successfully.")}

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), "Fueling Form Submission Error")
        return {"status": "error", "message": str(e)}