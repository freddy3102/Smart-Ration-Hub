from flask import Blueprint, jsonify, request
from db import get_connection
from business_date import get_business_date


reports_bp = Blueprint(
    "reports",
    __name__
)


# ==================================================
# Dashboard
# ==================================================

@reports_bp.route(
    "/dashboard",
    methods=["GET"]
)
def dashboard():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ---------------------------------
    # Total Beneficiaries
    # ---------------------------------

    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM beneficiaries
    """)

    beneficiaries = cursor.fetchone()["total"]

    # ---------------------------------
    # Total Inventory Items
    # ---------------------------------

    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM inventory
    """)

    inventory_items = cursor.fetchone()["total"]

    # ---------------------------------
    # Low Stock Items
    # ---------------------------------

    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM inventory
        WHERE available_quantity < minimum_stock
    """)

    low_stock = cursor.fetchone()["total"]

    # ---------------------------------
    # Total Distributions
    # ---------------------------------

    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM distributions
    """)

    distributions = cursor.fetchone()["total"]

    # ---------------------------------
    # Pending Warehouse Returns
    # ---------------------------------

    cursor.execute("""
        SELECT COUNT(*) AS total
        FROM unclaimed_audit
        WHERE unclaimed_quantity > 0
        AND audit_status = 'Pending'
    """)

    pending_returns = cursor.fetchone()["total"]

    cursor.close()
    conn.close()

    return jsonify({

        "total_beneficiaries":
        beneficiaries,

        "total_inventory_items":
        inventory_items,

        "low_stock_items":
        low_stock,

        "total_distributions":
        distributions,

        "pending_warehouse_returns":
        pending_returns

    })


# ==================================================
# Daily Distribution Report
# ==================================================

@reports_bp.route(
    "/daily-report",
    methods=["GET"]
)
def daily_report():

    business_date = get_business_date()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ---------------------------------
    # Item-wise Distribution
    # ---------------------------------

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

        WHERE DATE(d.distribution_date)=%s

        GROUP BY ri.item_name

        ORDER BY ri.item_name

    """, (
        business_date,
    ))

    items = cursor.fetchall()

    # ---------------------------------
    # Beneficiaries Served
    # ---------------------------------

    cursor.execute("""

        SELECT
            COUNT(DISTINCT beneficiary_id)
            AS beneficiaries

        FROM distributions

        WHERE DATE(distribution_date)=%s

    """, (
        business_date,
    ))

    beneficiaries = cursor.fetchone()["beneficiaries"]

    # ---------------------------------
    # Total Quantity
    # ---------------------------------

    cursor.execute("""

        SELECT
            IFNULL(
                SUM(quantity_given),
                0
            ) AS total_quantity

        FROM distributions

        WHERE DATE(distribution_date)=%s

    """, (
        business_date,
    ))

    total_quantity = cursor.fetchone()["total_quantity"]

    cursor.close()
    conn.close()

    return jsonify({

        "business_date":
        business_date.strftime("%Y-%m-%d"),

        "beneficiaries_served":
        beneficiaries,

        "total_quantity":
        float(total_quantity),

        "items":
        items

    })


# ==================================================
# Monthly Distribution Report
# ==================================================

@reports_bp.route(
    "/monthly-report",
    methods=["GET"]
)
def monthly_report():

    business_date = get_business_date()

    # ---------------------------------
    # Month / Year
    # ---------------------------------

    month = request.args.get(
        "month",
        type=int
    )

    year = request.args.get(
        "year",
        type=int
    )

    if month is None:
        month = business_date.month

    if year is None:
        year = business_date.year

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ---------------------------------
    # Item-wise Monthly Distribution
    # ---------------------------------

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

    # ---------------------------------
    # Beneficiaries Served
    # ---------------------------------

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

    # ---------------------------------
    # Total Quantity
    # ---------------------------------

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

        "month":
        month,

        "year":
        year,

        "beneficiaries_served":
        beneficiaries,

        "total_quantity":
        float(total_quantity),

        "items":
        items

    })


# ==================================================
# Monthly Entitlement Verification Report
# ==================================================

@reports_bp.route(
    "/monthly-verification-report",
    methods=["GET"]
)
def monthly_verification_report():

    # ---------------------------------
    # Get Month / Year
    # ---------------------------------

    business_date = get_business_date()

    month = request.args.get(
        "month",
        type=int
    )

    year = request.args.get(
        "year",
        type=int
    )

    if month is None:
        month = business_date.month

    if year is None:
        year = business_date.year

    # ---------------------------------
    # Validate Month
    # ---------------------------------

    if month < 1 or month > 12:

        return jsonify({
            "message": "Invalid month."
        }), 400

    conn = None
    cursor = None

    try:

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # ---------------------------------
        # Get Verification Status
        # ---------------------------------

        cursor.execute("""

            SELECT
                verified

            FROM monthly_closure

            WHERE month=%s
            AND year=%s

        """, (
            month,
            year
        ))

        closure = cursor.fetchone()

        # ---------------------------------
        # Determine Status
        # ---------------------------------

        if closure and closure["verified"]:

            verification_status = "VERIFIED"

        else:

            verification_status = "NOT VERIFIED"

        # ---------------------------------
        # Item-wise Entitlement Summary
        #
        # Rice and Wheat are kept separate.
        # ---------------------------------

        cursor.execute("""

            SELECT

                ri.item_name,

                IFNULL(
                    SUM(ua.entitled_quantity),
                    0
                ) AS total_entitled,

                IFNULL(
                    SUM(ua.claimed_quantity),
                    0
                ) AS total_claimed,

                IFNULL(
                    SUM(ua.unclaimed_quantity),
                    0
                ) AS total_unclaimed,

                IFNULL(
                    SUM(
                        ua.warehouse_returned_quantity
                    ),
                    0
                ) AS total_returned

            FROM unclaimed_audit ua

            JOIN ration_items ri
                ON ua.item_id = ri.item_id

            WHERE ua.month=%s
            AND ua.year=%s

            AND LOWER(ri.item_name)
                IN ('rice', 'wheat')

            GROUP BY
                ri.item_id,
                ri.item_name

            ORDER BY
                ri.item_id

        """, (
            month,
            year
        ))

        items = cursor.fetchall()

        # ---------------------------------
        # Convert Decimal values
        # ---------------------------------

        for item in items:

            item["total_entitled"] = float(
                item["total_entitled"]
            )

            item["total_claimed"] = float(
                item["total_claimed"]
            )

            item["total_unclaimed"] = float(
                item["total_unclaimed"]
            )

            item["total_returned"] = float(
                item["total_returned"]
            )

            item["status"] = verification_status

        # ---------------------------------
        # Overall Totals
        # ---------------------------------

        total_entitled = sum(
            item["total_entitled"]
            for item in items
        )

        total_claimed = sum(
            item["total_claimed"]
            for item in items
        )

        total_unclaimed = sum(
            item["total_unclaimed"]
            for item in items
        )

        total_returned = sum(
            item["total_returned"]
            for item in items
        )

        # ---------------------------------
        # Response
        # ---------------------------------

        return jsonify({

            "month":
            month,

            "year":
            year,

            "verification_status":
            verification_status,

            "total_entitled":
            total_entitled,

            "total_claimed":
            total_claimed,

            "total_unclaimed":
            total_unclaimed,

            "total_returned":
            total_returned,

            "items":
            items

        })

    except Exception as e:

        return jsonify({

            "message":
            "Unable to load monthly verification report.",

            "error":
            str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ==================================================
# Inventory Summary Report
# ==================================================

@reports_bp.route(
    "/inventory-report",
    methods=["GET"]
)
def inventory_report():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""

        SELECT

            ri.item_name,

            i.available_quantity,

            i.minimum_stock,

            CASE

                WHEN
                    i.available_quantity <
                    i.minimum_stock

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