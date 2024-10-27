# Copyright (c) 2024, Wahyu Triono and contributors
# For license information, please see license.txt

import frappe
from frappe import _

def execute(filters=None):
    chart_data = get_chart_data(filters)
    return chart_data, []

def get_chart_data(filters):
    data = frappe.get_all("Shift", fields=["ua", "pa", "bd"])
    print(data);
    
    chart_data = {
        "data": {
            "labels": ["UA", "PA", "BD"],
            "datasets": [
                {"name": _("UA"), "values": [d.ua for d in data]},
                {"name": _("PA"), "values": [d.pa for d in data]},
                {"name": _("BD"), "values": [d.bd for d in data]},
            ],
        },
        "type": "bar",
        "colors": ['green', 'blue', 'red', 'purple']
    }
    
    return chart_data