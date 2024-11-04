# Copyright (c) 2024, Wahyu Triono and contributors
# For license information, please see license.txt

import frappe
from frappe import _
from frappe.query_builder.functions import Count, Extract, Sum
from frappe.utils import cint, cstr, getdate, add_days, date_diff

# Filters = frappe._dict
# def execute(filters=Filters):
    # if not (filters.month and filters.year):
    #     filters.month, filters.year = getdate().month, getdate().year
def execute(filters):        
    chart_data = get_chart_data(filters)
    columns = get_columns()
    data = get_data(filters)
    
    return columns, data, None, chart_data

def get_data(filters):
    data = frappe.get_all(
        "Shift", 
        fields=["name", "tanggal_shift", "unit", "tipe_shift", "operator", "total_hm", "total_jam_produksi", "total_ritasi", "unk_standby_menit", "total_stb_act_menit", "total_bd_menit", "ua", "pa", "bd"], 
    )
    
    return data

def get_columns():
    return [
        {
            "label": _("Shift"),
            "fieldname": "name",
            "fieldtype": "Link",
            "options": "Shift",
            "width": 50
        },
        {
            "label": _("Date"),
            "fieldname": "tanggal_shift",
            "fieldtype": "Data",
            "width": 130
        },
        {
            "label": _("Unit"),
            "fieldname": "unit",
            "fieldtype": "Link",
            "options": "Unit",
            "width": 100
        },
        {
            "label": _("Shift Type"),
            "fieldname": "tipe_shift",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Operator"),
            "fieldname": "operator",
            "fieldtype": "Data",
            "width": 100
        },
        {
            "label": _("Total HM"),
            "fieldname": "total_hm",
            "fieldtype": "data",
            "width": 100
        },
        {
            "label": _("Total Jam Operator"),
            "fieldname": "total_jam_produksi",
            "fieldtype": "data",
            "width": 155
        },
        {
            "label": _("Total Ritasi"),
            "fieldname": "total_ritasi",
            "fieldtype": "data",
            "width": 100
        },
        {
            "label": _("UNK Standby Menit"),
            "fieldname": "unk_standby_menit",
            "fieldtype": "data",
            "width": 155
        },
        {
            "label": _("Total Standby Aktif"),
            "fieldname": "total_stb_act_menit",
            "fieldtype": "data",
            "width": 155
        },
        {
            "label": _("Total Breakdown"),
            "fieldname": "total_bd_menit",
            "fieldtype": "data",
            "width": 155
        },
        {
            "label": _("UA"),
            "fieldname": "ua",
            "fieldtype": "Percent",
            "width": 100
        },
        {
            "label": _("PA"),
            "fieldname": "pa",
            "fieldtype": "Percent",
            "width": 100
        },
        {
            "label": _("BD"),
            "fieldname": "bd",
            "fieldtype": "Percent",
            "width": 100
        }
    ]

def get_chart_data(filters):
    data = frappe.get_all("Shift", fields=["name", "ua", "pa", "bd"], filters=filters)
    chart_data = {
        "data": {
            "labels": [d.name for d in data],
            "datasets": [
                {
                    "name": _("UA"),
                    "values": [d.ua for d in data]
                },
                {
                    "name": _("PA"),
                    "values": [d.pa for d in data]
                },
                {
                    "name": _("BD"),
                    "values": [d.bd for d in data]
                }
            ],
        },
        "type": "bar",
        "colors": ['green', 'blue', 'red', 'purple']
    }
    
    return chart_data

@frappe.whitelist()
def get_shift_years() -> str:
    shift = frappe.qb.DocType("Shift")
    year_list = (
        frappe.qb.from_(shift).select(Extract("year", shift.creation).as_("year")).distinct()
    ).run(as_dict=True)
    
    if year_list:
        year_list.sort(key=lambda d: d.year, reverse=True)
    else:
        year_list = [frappe._dict({"year": getdate().year})]
        
    return "\n".join(cstr(entry.year) for entry in year_list)