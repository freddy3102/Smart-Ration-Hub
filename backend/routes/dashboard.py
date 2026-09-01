from flask import Blueprint, jsonify
from db import get_connection


dashboard_bp = Blueprint(
    "dashboard",
    __name__
)


# ==================================================
# Admin Dashboard
# ==================================================

@dashboard_bp.route(
    "/dashboard",
    methods=["GET"]
)
def dashboard():

    conn = None
    cursor = None

    try:

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # TOTAL BENEFICIARIES
        # ==================================================

        cursor.execute("""
            SELECT
                COUNT(*) AS total_beneficiaries
            FROM beneficiaries
        """)

        result = cursor.fetchone()

        total_beneficiaries = int(
            result["total_beneficiaries"] or 0
        )

        # ==================================================
        # TOTAL INVENTORY ITEMS
        # ==================================================

        cursor.execute("""
            SELECT
                COUNT(*) AS total_inventory_items
            FROM inventory
        """)

        result = cursor.fetchone()

        total_inventory_items = int(
            result["total_inventory_items"] or 0
        )

        # ==================================================
        # TOTAL DISTRIBUTIONS
        # ==================================================

        cursor.execute("""
            SELECT
                COUNT(*) AS total_distributions
            FROM distributions
        """)

        result = cursor.fetchone()

        total_distributions = int(
            result["total_distributions"] or 0
        )

        # ==================================================
        # LOW STOCK ITEMS
        #
        # Low Stock:
        #
        # available_quantity <= minimum_stock
        #
        # Out of stock is also included because:
        #
        # 0 <= minimum_stock
        # ==================================================

        cursor.execute("""
            SELECT
                COUNT(*) AS low_stock_items
            FROM inventory
            WHERE available_quantity <= minimum_stock
        """)

        result = cursor.fetchone()

        low_stock_items = int(
            result["low_stock_items"] or 0
        )

        # ==================================================
        # RESPONSE
        # ==================================================

        return jsonify({

            "total_beneficiaries":
                total_beneficiaries,

            "total_inventory_items":
                total_inventory_items,

            "total_distributions":
                total_distributions,

            "low_stock_items":
                low_stock_items

        }), 200

    except Exception as e:

        print(
            "DASHBOARD ERROR:"
        )

        print(e)

        return jsonify({

            "message":
                "Unable to load dashboard data.",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()