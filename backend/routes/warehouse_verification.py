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

        # ==================================================
        # MONTH & YEAR
        # ==================================================

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

        if month < 1 or month > 12:

            return jsonify({
                "message":
                    "Invalid month."
            }), 400

        # ==================================================
        # DATABASE
        # ==================================================

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # TOTAL UNCLAIMED
        #
        # IMPORTANT:
        #
        # We use unclaimed_quantity, which remains unchanged
        # even after the employee records the return.
        #
        # Therefore:
        #
        # Unclaimed = 10
        # Returned  = 10
        #
        # Difference = 0
        #
        # This allows the manager to verify successfully.
        # ==================================================

        cursor.execute("""
            SELECT

                IFNULL(
                    SUM(unclaimed_quantity),
                    0
                ) AS total_unclaimed

            FROM unclaimed_audit

            WHERE month = %s
            AND year = %s

        """, (
            month,
            year
        ))

        total_unclaimed = float(
            cursor.fetchone()[
                "total_unclaimed"
            ] or 0
        )

        # ==================================================
        # TOTAL RETURNED
        # ==================================================

        cursor.execute("""
            SELECT

                IFNULL(
                    SUM(warehouse_returned_quantity),
                    0
                ) AS total_returned

            FROM unclaimed_audit

            WHERE month = %s
            AND year = %s

        """, (
            month,
            year
        ))

        total_returned = float(
            cursor.fetchone()[
                "total_returned"
            ] or 0
        )

        # ==================================================
        # DIFFERENCE
        # ==================================================

        difference = (
            total_unclaimed -
            total_returned
        )

        # ==================================================
        # MONTHLY CLOSURE
        # ==================================================

        cursor.execute("""
            SELECT

                closure_id,
                verified

            FROM monthly_closure

            WHERE month = %s
            AND year = %s

        """, (
            month,
            year
        ))

        closure = cursor.fetchone()

        # ==================================================
        # DETERMINE STATUS
        # ==================================================

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

            "status":
                status

        }), 200

    except Exception as e:

        print(
            "WAREHOUSE VERIFICATION GET ERROR:"
        )

        print(e)

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
#
# THIS is where inventory is updated.
# ==================================================

@warehouse_verification_bp.route(
    "/warehouse-verification",
    methods=["POST"]
)
def verify_warehouse():

    data = request.get_json() or {}

    month = data.get("month")
    year = data.get("year")
    manager_id = data.get("manager_id")

    # ==================================================
    # VALIDATE INPUT
    # ==================================================

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

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # LOCK MONTHLY CLOSURE
        # ==================================================

        cursor.execute("""
            SELECT

                closure_id,
                verified

            FROM monthly_closure

            WHERE month = %s
            AND year = %s

            FOR UPDATE

        """, (
            month,
            year
        ))

        closure = cursor.fetchone()

        # ==================================================
        # CLOSURE NOT FOUND
        # ==================================================

        if not closure:

            return jsonify({

                "message":
                    "Monthly closure not found."

            }), 404

        # ==================================================
        # ALREADY VERIFIED
        # ==================================================

        if closure["verified"]:

            return jsonify({

                "message":
                    "This month has already been verified."

            }), 400

        # ==================================================
        # TOTAL UNCLAIMED
        # ==================================================

        cursor.execute("""
            SELECT

                IFNULL(
                    SUM(unclaimed_quantity),
                    0
                ) AS total_unclaimed

            FROM unclaimed_audit

            WHERE month = %s
            AND year = %s

        """, (
            month,
            year
        ))

        total_unclaimed = float(
            cursor.fetchone()[
                "total_unclaimed"
            ] or 0
        )

        # ==================================================
        # TOTAL RETURNED
        # ==================================================

        cursor.execute("""
            SELECT

                IFNULL(
                    SUM(warehouse_returned_quantity),
                    0
                ) AS total_returned

            FROM unclaimed_audit

            WHERE month = %s
            AND year = %s

        """, (
            month,
            year
        ))

        total_returned = float(
            cursor.fetchone()[
                "total_returned"
            ] or 0
        )

        # ==================================================
        # NO UNCLAIMED STOCK
        # ==================================================

        if total_unclaimed <= 0:

            return jsonify({

                "message":
                    "No unclaimed stock available for verification."

            }), 400

        # ==================================================
        # CHECK TOTALS
        # ==================================================

        difference = (
            total_unclaimed -
            total_returned
        )

        if abs(difference) > 0.000001:

            return jsonify({

                "message":
                    "Verification failed. "
                    "Total returned quantity does not "
                    "match total unclaimed quantity.",

                "total_unclaimed":
                    total_unclaimed,

                "total_returned":
                    total_returned,

                "difference":
                    difference

            }), 400

        # ==================================================
        # GET ALL RETURNED AUDIT RECORDS
        #
        # These are the exact quantities that will now
        # be added back to inventory.
        # ==================================================

        cursor.execute("""
            SELECT

                audit_id,
                beneficiary_id,
                item_id,
                warehouse_returned_quantity

            FROM unclaimed_audit

            WHERE month = %s
            AND year = %s

            AND returned_to_warehouse = TRUE

            AND audit_status = 'Returned'

            AND warehouse_returned_quantity > 0

            FOR UPDATE

        """, (
            month,
            year
        ))

        returned_items = (
            cursor.fetchall()
        )

        # ==================================================
        # NO RETURNED STOCK
        # ==================================================

        if not returned_items:

            return jsonify({

                "message":
                    "No returned stock is available "
                    "for verification."

            }), 400

        # ==================================================
        # ADD RETURNED STOCK TO INVENTORY
        #
        # THIS IS THE ONLY PLACE WHERE INVENTORY
        # IS INCREASED FOR WAREHOUSE RETURNS.
        # ==================================================

        inventory_added = {}

        for row in returned_items:

            item_id = row["item_id"]

            returned_quantity = float(
                row[
                    "warehouse_returned_quantity"
                ] or 0
            )

            # ---------------------------------------------
            # Lock inventory row
            # ---------------------------------------------

            cursor.execute("""
                SELECT

                    inventory_id,
                    available_quantity

                FROM inventory

                WHERE item_id = %s

                FOR UPDATE

            """, (
                item_id,
            ))

            inventory = cursor.fetchone()

            if inventory is None:

                raise Exception(
                    "Inventory record not found "
                    f"for item_id {item_id}."
                )

            current_quantity = float(
                inventory[
                    "available_quantity"
                ] or 0
            )

            new_quantity = (
                current_quantity +
                returned_quantity
            )

            # ---------------------------------------------
            # Update inventory
            # ---------------------------------------------

            cursor.execute("""
                UPDATE inventory

                SET
                    available_quantity = %s

                WHERE inventory_id = %s

            """, (
                new_quantity,
                inventory["inventory_id"]
            ))

            # ---------------------------------------------
            # Track item-wise addition
            # ---------------------------------------------

            if item_id not in inventory_added:

                inventory_added[item_id] = 0.0

            inventory_added[item_id] += (
                returned_quantity
            )

        # ==================================================
        # UPDATE MONTHLY CLOSURE
        # ==================================================

        cursor.execute("""
            UPDATE monthly_closure

            SET

                verified = TRUE,

                verified_by = %s,

                verified_at = NOW()

            WHERE month = %s
            AND year = %s

        """, (
            manager_id,
            month,
            year
        ))

        # ==================================================
        # COMMIT EVERYTHING
        #
        # Inventory updates + verification status are
        # committed together.
        # ==================================================

        conn.commit()

        # ==================================================
        # RESPONSE
        # ==================================================

        return jsonify({

            "message":
                "Warehouse verification completed successfully. "
                "Returned stock has been added back to inventory.",

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
                inventory_added,

            "verified":
                True,

            "verified_by":
                manager_id

        }), 200

    except Exception as e:

        if conn:

            conn.rollback()

        print(
            "WAREHOUSE VERIFICATION ERROR:"
        )

        print(e)

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