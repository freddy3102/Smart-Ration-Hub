from flask import Blueprint, jsonify, request
from db import get_connection


warehouse_verification_bp = Blueprint(
    "warehouse_verification",
    __name__
)


# ==================================================
# Warehouse Verification Summary
# ==================================================

@warehouse_verification_bp.route(
    "/warehouse-verification",
    methods=["GET"]
)
def warehouse_verification():

    conn = None
    cursor = None

    try:

        # ---------------------------------
        # Month & Year
        # ---------------------------------

        month = request.args.get(
            "month",
            type=int
        )

        year = request.args.get(
            "year",
            type=int
        )

        if month is None or year is None:

            return jsonify({
                "message":
                "Month and Year are required."
            }), 400

        # ---------------------------------
        # Validate Month
        # ---------------------------------

        if month < 1 or month > 12:

            return jsonify({
                "message":
                "Invalid month."
            }), 400

        # ---------------------------------
        # Database
        # ---------------------------------

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # ---------------------------------
        # Total Unclaimed Quantity
        # ---------------------------------

        cursor.execute("""
            SELECT
                IFNULL(
                    SUM(unclaimed_quantity),
                    0
                ) AS total_unclaimed

            FROM unclaimed_audit

            WHERE month=%s
            AND year=%s
        """, (
            month,
            year
        ))

        total_unclaimed = float(
            cursor.fetchone()["total_unclaimed"]
        )

        # ---------------------------------
        # Total Returned Quantity
        # ---------------------------------

        cursor.execute("""
            SELECT
                IFNULL(
                    SUM(warehouse_returned_quantity),
                    0
                ) AS total_returned

            FROM unclaimed_audit

            WHERE month=%s
            AND year=%s
        """, (
            month,
            year
        ))

        total_returned = float(
            cursor.fetchone()["total_returned"]
        )

        # ---------------------------------
        # Difference
        # ---------------------------------

        difference = (
            total_unclaimed -
            total_returned
        )

        # ---------------------------------
        # Verification Status
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

        if not closure:

            status = "MONTH NOT CLOSED"

        elif closure["verified"]:

            status = "VERIFIED"

        elif total_unclaimed == 0:

            status = "NO UNCLAIMED STOCK"

        elif abs(difference) > 0.000001:

            status = "MISMATCH"

        else:

            status = "READY FOR VERIFICATION"

        return jsonify({

            "month": month,

            "year": year,

            "total_unclaimed":
            total_unclaimed,

            "total_returned":
            total_returned,

            "difference":
            difference,

            "status":
            status

        }), 200

    except Exception as e:

        return jsonify({

            "message":
            "Unable to load warehouse verification data.",

            "error":
            str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ==================================================
# Warehouse Verification
# ==================================================

@warehouse_verification_bp.route(
    "/warehouse-verification",
    methods=["POST"]
)
def verify_warehouse():

    data = request.get_json()

    if not data:

        return jsonify({
            "message":
            "Request body is required."
        }), 400

    month = data.get("month")
    year = data.get("year")
    manager_id = data.get("manager_id")

    # ---------------------------------
    # Validate Input
    # ---------------------------------

    if (
        month is None
        or year is None
        or manager_id is None
    ):

        return jsonify({

            "message":
            "Month, Year and Manager ID are required."

        }), 400

    try:

        month = int(month)
        year = int(year)
        manager_id = int(manager_id)

    except (TypeError, ValueError):

        return jsonify({

            "message":
            "Month, Year and Manager ID must be valid numbers."

        }), 400

    if month < 1 or month > 12:

        return jsonify({

            "message":
            "Invalid month."

        }), 400

    conn = None
    cursor = None

    try:

        conn = get_connection()
        cursor = conn.cursor(dictionary=True)

        # ---------------------------------
        # Monthly Closure Exists?
        # ---------------------------------

        cursor.execute("""
            SELECT
                closure_id,
                verified

            FROM monthly_closure

            WHERE month=%s
            AND year=%s

            FOR UPDATE
        """, (
            month,
            year
        ))

        closure = cursor.fetchone()

        if not closure:

            return jsonify({

                "message":
                "Monthly closure not found."

            }), 404

        # ---------------------------------
        # Already Verified?
        # ---------------------------------

        if closure["verified"]:

            return jsonify({

                "message":
                "This month has already been verified."

            }), 400

        # ---------------------------------
        # Total Unclaimed
        # ---------------------------------

        cursor.execute("""
            SELECT

                IFNULL(
                    SUM(unclaimed_quantity),
                    0
                ) AS total_unclaimed

            FROM unclaimed_audit

            WHERE month=%s
            AND year=%s
        """, (
            month,
            year
        ))

        total_unclaimed = float(
            cursor.fetchone()["total_unclaimed"]
        )

        # ---------------------------------
        # Total Returned
        # ---------------------------------

        cursor.execute("""
            SELECT

                IFNULL(
                    SUM(warehouse_returned_quantity),
                    0
                ) AS total_returned

            FROM unclaimed_audit

            WHERE month=%s
            AND year=%s
        """, (
            month,
            year
        ))

        total_returned = float(
            cursor.fetchone()["total_returned"]
        )

        # ---------------------------------
        # No Unclaimed Stock
        # ---------------------------------

        if total_unclaimed <= 0:

            return jsonify({

                "message":
                "No unclaimed stock available for verification."

            }), 400

        # ---------------------------------
        # Verify Totals
        # ---------------------------------

        difference = (
            total_unclaimed -
            total_returned
        )

        if abs(difference) > 0.000001:

            return jsonify({

                "message":
                "Verification failed. Total returned quantity does not match total unclaimed quantity.",

                "total_unclaimed":
                total_unclaimed,

                "total_returned":
                total_returned,

                "difference":
                difference

            }), 400

        # ---------------------------------
        # Get Returned Stock
        #
        # Only stock that was actually
        # returned is added back.
        # ---------------------------------

        cursor.execute("""
            SELECT
                audit_id,
                item_id,
                warehouse_returned_quantity

            FROM unclaimed_audit

            WHERE month=%s
            AND year=%s
            AND returned_to_warehouse=TRUE
            AND audit_status='Returned'
            AND warehouse_returned_quantity > 0

            FOR UPDATE
        """, (
            month,
            year
        ))

        returned_items = cursor.fetchall()

        if not returned_items:

            return jsonify({

                "message":
                "No returned stock is available for verification."

            }), 400

        # ---------------------------------
        # Add Returned Stock Back To
        # Inventory
        # ---------------------------------

        inventory_added = {}

        for row in returned_items:

            item_id = row["item_id"]

            returned_quantity = float(
                row["warehouse_returned_quantity"]
            )

            # ---------------------------------
            # Get Inventory
            # ---------------------------------

            cursor.execute("""
                SELECT
                    available_quantity

                FROM inventory

                WHERE item_id=%s

                FOR UPDATE
            """, (
                item_id,
            ))

            inventory = cursor.fetchone()

            if inventory is None:

                raise Exception(
                    f"Inventory record not found for item_id {item_id}."
                )

            # ---------------------------------
            # Add Returned Quantity
            # ---------------------------------

            cursor.execute("""
                UPDATE inventory

                SET
                    available_quantity =
                        available_quantity + %s

                WHERE item_id=%s
            """, (
                returned_quantity,
                item_id
            ))

            # ---------------------------------
            # Track Item-wise Addition
            # ---------------------------------

            if item_id not in inventory_added:

                inventory_added[item_id] = 0

            inventory_added[item_id] += (
                returned_quantity
            )

        # ---------------------------------
        # Update Monthly Closure
        # ---------------------------------

        cursor.execute("""
            UPDATE monthly_closure

            SET
                verified = TRUE,
                verified_by = %s,
                verified_at = NOW()

            WHERE month=%s
            AND year=%s
        """, (
            manager_id,
            month,
            year
        ))

        # ---------------------------------
        # Commit Everything Together
        # ---------------------------------

        conn.commit()

        # ---------------------------------
        # Response
        # ---------------------------------

        return jsonify({

            "message":
            "Warehouse verification completed successfully. "
            "Verified returned stock has been added back to inventory.",

            "month":
            month,

            "year":
            year,

            "total_unclaimed":
            total_unclaimed,

            "total_returned":
            total_returned,

            "difference":
            difference,

            "inventory_updated":
            True,

            "items_processed":
            len(returned_items),

            "inventory_added":
            inventory_added

        }), 200

    except Exception as e:

        if conn:
            conn.rollback()

        return jsonify({

            "message":
            "Warehouse verification failed.",

            "error":
            str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()