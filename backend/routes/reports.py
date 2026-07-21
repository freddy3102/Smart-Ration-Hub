from flask import Blueprint, jsonify
from db import get_connection

reports_bp = Blueprint("reports", __name__)


@reports_bp.route("/dashboard", methods=["GET"])
def dashboard():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Total Beneficiaries
    cursor.execute("SELECT COUNT(*) AS total FROM beneficiaries")
    beneficiaries = cursor.fetchone()["total"]

    # Total Inventory Items
    cursor.execute("SELECT COUNT(*) AS total FROM inventory")
    inventory_items = cursor.fetchone()["total"]

    # Low Stock Items (less than 20)
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM inventory
        WHERE available_quantity < minimum_stock
    """)
    low_stock = cursor.fetchone()["total"]

    # Total Distributions
    cursor.execute("SELECT COUNT(*) AS total FROM distributions")
    distributions = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    return jsonify({
        "total_beneficiaries": beneficiaries,
        "total_inventory_items": inventory_items,
        "low_stock_items": low_stock,
        "total_distributions": distributions
    })