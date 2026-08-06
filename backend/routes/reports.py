from flask import Blueprint, jsonify, request
from db import get_connection
from business_date import get_business_date

reports_bp = Blueprint("reports", __name__)


# ==================================================
# Dashboard
# ==================================================

@reports_bp.route("/dashboard", methods=["GET"])
def dashboard():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Total Beneficiaries
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM beneficiaries
    """)
    beneficiaries = cursor.fetchone()["total"]

    # Total Inventory Items
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM inventory
    """)
    inventory_items = cursor.fetchone()["total"]

    # Low Stock Items
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM inventory
        WHERE available_quantity < minimum_stock
    """)
    low_stock = cursor.fetchone()["total"]

    # Total Distributions
    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM distributions
    """)
    distributions = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    return jsonify({
        "total_beneficiaries": beneficiaries,
        "total_inventory_items": inventory_items,
        "low_stock_items": low_stock,
        "total_distributions": distributions
    })


# ==================================================
# Daily Distribution Report
# ==================================================

@reports_bp.route("/daily-report", methods=["GET"])
def daily_report():

    business_date = get_business_date()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Item-wise Distribution
    cursor.execute("""

        SELECT
            ri.item_name,
            IFNULL(SUM(d.quantity_given),0) AS quantity

        FROM distributions d

        JOIN ration_items ri
            ON d.item_id = ri.item_id

        WHERE DATE(d.distribution_date)=%s

        GROUP BY ri.item_name

        ORDER BY ri.item_name

    """, (business_date,))

    items = cursor.fetchall()

    # Beneficiaries Served
    cursor.execute("""

        SELECT
            COUNT(DISTINCT beneficiary_id) AS beneficiaries

        FROM distributions

        WHERE DATE(distribution_date)=%s

    """, (business_date,))

    beneficiaries = cursor.fetchone()["beneficiaries"]

    # Total Quantity
    cursor.execute("""

        SELECT
            IFNULL(SUM(quantity_given),0) AS total_quantity

        FROM distributions

        WHERE DATE(distribution_date)=%s

    """, (business_date,))

    total_quantity = cursor.fetchone()["total_quantity"]

    cursor.close()
    conn.close()

    return jsonify({

        "business_date": business_date.strftime("%Y-%m-%d"),

        "beneficiaries_served": beneficiaries,

        "total_quantity": float(total_quantity),

        "items": items

    })

# ==================================================
# Monthly Distribution Report
# ==================================================

@reports_bp.route("/monthly-report", methods=["GET"])
def monthly_report():

    business_date = get_business_date()

    # Get month/year from URL parameters
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    # If not supplied, use current business month/year
    if month is None:
        month = business_date.month

    if year is None:
        year = business_date.year

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ----------------------------
    # Item-wise Monthly Distribution
    # ----------------------------

    cursor.execute("""

        SELECT

            ri.item_name,

            IFNULL(
                SUM(d.quantity_given),
                0
            ) AS quantity

        FROM distributions d

        JOIN ration_items ri

            ON d.item_id = ri.item_id

        WHERE MONTH(d.distribution_date)=%s
        AND YEAR(d.distribution_date)=%s

        GROUP BY ri.item_name

        ORDER BY ri.item_name

    """, (

        month,
        year

    ))

    items = cursor.fetchall()

    # ----------------------------
    # Beneficiaries Served
    # ----------------------------

    cursor.execute("""

        SELECT

            COUNT(DISTINCT beneficiary_id)
            AS beneficiaries

        FROM distributions

        WHERE MONTH(distribution_date)=%s
        AND YEAR(distribution_date)=%s

    """, (

        month,
        year

    ))

    beneficiaries = cursor.fetchone()["beneficiaries"]

    # ----------------------------
    # Total Quantity
    # ----------------------------

    cursor.execute("""

        SELECT

            IFNULL(
                SUM(quantity_given),
                0
            ) AS total_quantity

        FROM distributions

        WHERE MONTH(distribution_date)=%s
        AND YEAR(distribution_date)=%s

    """, (

        month,
        year

    ))

    total_quantity = cursor.fetchone()["total_quantity"]

    cursor.close()
    conn.close()

    return jsonify({

        "month": month,

        "year": year,

        "beneficiaries_served": beneficiaries,

        "total_quantity": float(total_quantity),

        "items": items

    })

# ==================================================
# Inventory Summary Report
# ==================================================

@reports_bp.route("/inventory-report", methods=["GET"])
def inventory_report():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT

            ri.item_name,

            i.available_quantity,

            i.minimum_stock,

            CASE

                WHEN i.available_quantity < i.minimum_stock

                THEN 'Low Stock'

                ELSE 'Normal'

            END AS status

        FROM inventory i

        JOIN ration_items ri

            ON i.item_id = ri.item_id

        ORDER BY ri.item_name

    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)