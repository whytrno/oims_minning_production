# Copyright (c) 2024, Wahyu Triono and contributors
# For license information, please see license.txt

import frappe
import qrcode
from frappe.model.document import Document
from io import BytesIO
from frappe import _
from frappe.utils.file_manager import save_file

class Unit(Document):
	def after_insert(self):
		# Generate QR Code with the name or any unique field of the document
		qr_text = self.name  # Anda bisa mengubah ini menjadi data lain seperti kode unit atau ID unik

		# Create QR code image
		qr = qrcode.make(qr_text)
		buffer = BytesIO()
		qr.save(buffer, format="PNG")
		buffer.seek(0)

		# Convert BytesIO to bytes
		qr_code_bytes = buffer.getvalue()

		# Define file name and folder structure
		file_name = f"QR_Code_{self.name}.png"
		folder_structure = "Home/Unit/QrCode"

		# Create the folder structure if it does not exist
		self.create_folders_if_not_exist(folder_structure)

		# Save the QR code image file in the specified folder
		saved_file = save_file(file_name, qr_code_bytes, self.doctype, self.name, folder=folder_structure, is_private=1)

		# Set field qr_code dengan URL file yang disimpan dan simpan ke database
		self.db_set('qr_code', saved_file.file_url)

	def create_folders_if_not_exist(self, folder_path):
		# Pisahkan path menjadi komponen folder
		folders = folder_path.split('/')
		base_folder = folders[0]
		current_folder_path = base_folder

		# Loop untuk membuat setiap sub-folder jika belum ada
		for folder in folders[1:]:
			current_folder_path = f"{current_folder_path}/{folder}"

			# Jika folder belum ada, buat folder baru
			if not frappe.db.exists('File', {'file_name': folder, 'folder': current_folder_path.rsplit('/', 1)[0]}):
				folder_doc = frappe.get_doc({
					"doctype": "File",
					"file_name": folder,
					"folder": current_folder_path.rsplit('/', 1)[0],
					"is_folder": 1,
					"is_private": 1
				})
				folder_doc.insert(ignore_permissions=True)
				frappe.logger().info(f"Folder '{folder}' created in '{current_folder_path}'")
