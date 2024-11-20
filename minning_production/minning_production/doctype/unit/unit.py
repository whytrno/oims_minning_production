# Copyright (c) 2024, Wahyu Triono and contributors
# For license information, please see license.txt

import frappe
import qrcode
from frappe.model.document import Document
from io import BytesIO
from frappe.utils.file_manager import save_file, remove_file

class Unit(Document):
    def after_insert(self):
        # Generate QR Code after inserting the document
        self.generate_qr_code()

    def after_rename(self, old_name, new_name, merge=False):
        """
        Called after the document is renamed.
        Deletes the old QR Code and generates a new one with the updated name.
        """
        if self.qr_code:
            self.delete_existing_qr_code()
        self.generate_qr_code()

    def generate_qr_code(self):
        """
        Generate a new QR Code and save it in the specified folder.
        """
        # Generate QR Code text (e.g., use document name or a unique field)
        qr_text = self.name  # You can change this to another field if needed

        # Create QR Code image
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

        # Save the QR Code image file in the specified folder
        saved_file = save_file(file_name, qr_code_bytes, self.doctype, self.name, folder=folder_structure, is_private=1)

        # Set the field `qr_code` with the URL of the saved file
        self.db_set('qr_code', saved_file.file_url)
        frappe.logger().info(f"QR Code generated and saved for Unit: {self.name}")

    def delete_existing_qr_code(self):
        """
        Delete the existing QR Code file associated with this document.
        """
        if self.qr_code:
            try:
                # Remove the file from the file system and database
                remove_file(self.qr_code, doctype=self.doctype, name=self.name)
                frappe.logger().info(f"Old QR Code removed for Unit: {self.name}")
            except Exception as e:
                frappe.log_error(message=str(e), title="Error Removing QR Code")
                frappe.logger().error(f"Error removing QR Code for Unit: {self.name} - {str(e)}")

    def create_folders_if_not_exist(self, folder_path):
        """
        Create the folder structure if it does not exist.
        """
        # Split the folder path into components
        folders = folder_path.split('/')
        base_folder = folders[0]
        current_folder_path = base_folder

        # Loop to create each sub-folder if it does not exist
        for folder in folders[1:]:
            current_folder_path = f"{current_folder_path}/{folder}"

            # Check if the folder exists, if not, create it
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
