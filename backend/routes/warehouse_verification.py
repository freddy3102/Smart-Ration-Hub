from flask import Blueprint, jsonify, request
from db import get_connection


warehouse_verification_bp = Blueprint(
    "warehouse_verification",
    __name__
)


# ==================================================
# Helpers
# ==================================================

def get_quarter(month):

    if month in (1, 2, 3):
        return 1

    if month in (4, 5, 6):
        return 2

    if month in (7, 8, 9):
        return 3

    return 4


def get_quarter_start(month):

    quarter = get_quarter(month)

    return ((quarter - 1) * 3) + 1


def get_quarter_end(month):

    return get_quarter_start(month) + 2


def is_quarter_end(month):

    return month in (3, 6, 9, 12)


# ==================================================
# Warehouse Verification Summary
#
# Rules:
#
# Rice / Wheat
#     -> Monthly verification
#
# Sugar / Kerosene
#     -> Quarterly verification
#     -> March / June / September / December
#
# IMPORTANT:
#
# This endpoint reports ONLY the stock that is actually
# eligible for verification for the selected period.
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
        # QUARTER
        # ==================================================

        quarter = get_quarter(month)

        quarter_start = get_quarter_start(month)

        quarter_end = get_quarter_end(month)

        quarter_is_closed = is_quarter_end(month)

        # ==================================================
        # DATABASE
        # ==================================================

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # MONTHLY CLOSURE
        # ==================================================

        cursor.execute("""
            SELECT

                closure_id,
                verified,
                verified_by,
                verified_at

            FROM monthly_closure

            WHERE month = %s
            AND year = %s

        """, (
            month,
            year
        ))

        closure = cursor.fetchone()

        # ==================================================
        # DETERMINE WHICH AUDIT PERIODS ARE ELIGIBLE
        #
        # Rice / Wheat:
        #     selected month
        #
        # Sugar / Kerosene:
        #     only quarter-end month
        # ==================================================

        # ==================================================
        # TOTALS
        # ==================================================

        total_unclaimed = 0.0
        total_returned = 0.0

        # ==================================================
        # GET ELIGIBLE AUDIT RECORDS
        #
        # We determine item type from ration_items.
        # ==================================================

        cursor.execute("""
            SELECT

                ua.audit_id,
                ua.item_id,
                ua.month,
                ua.year,

                ua.unclaimed_quantity,
                ua.warehouse_returned_quantity,

                ua.returned_to_warehouse,
                ua.audit_status,

                ri.item_name

            FROM unclaimed_audit ua

            JOIN ration_items ri
                ON ua.item_id = ri.item_id

            WHERE ua.year = %s

            AND (
                (
                    LOWER(ri.item_name)
                    IN ('rice', 'wheat')

                    AND ua.month = %s
                )

                OR

                (
                    LOWER(ri.item_name)
                    IN ('sugar', 'kerosene')

                    AND ua.month = %s

                    AND %s = TRUE
                )
            )

            FOR UPDATE

        """, (
            year,
            month,
            quarter_end,
            quarter_is_closed
        ))

        audit_rows = cursor.fetchall()

        # ==================================================
        # CALCULATE ELIGIBLE TOTALS
        # ==================================================

        for row in audit_rows:

            unclaimed = float(
                row["unclaimed_quantity"] or 0
            )

            returned = float(
                row["warehouse_returned_quantity"] or 0
            )

            total_unclaimed += unclaimed

            total_returned += returned

        # ==================================================
        # DIFFERENCE
        # ==================================================

        difference = (
            total_unclaimed -
            total_returned
        )

        # ==================================================
        # DETERMINE STATUS
        # ==================================================

        if not closure:

            status = "MONTH NOT CLOSED"

        elif closure["verified"]:

            status = "VERIFIED"

        elif total_unclaimed <= 0:

            status = "NO UNCLAIMED STOCK"

        elif abs(difference) > 0.0001:

            status = "MISMATCH"

        else:

            status = "READY FOR VERIFICATION"

        # ==================================================
        # RETURN RESPONSE
        # ==================================================

        return jsonify({

            "month":
                month,

            "year":
                year,

            "quarter":
                f"Q{quarter}",

            "quarter_start_month":
                quarter_start,

            "quarter_end_month":
                quarter_end,

            "is_quarter_end":
                quarter_is_closed,

            "total_unclaimed":
                total_unclaimed,

            "total_returned":
                total_returned,

            "difference":
                difference,

            "status":
                status,

            "eligible_records":
                len(audit_rows)

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
# IMPORTANT:
#
# Inventory is updated ONLY here.
#
# Warehouse Return:
#     Does NOT update inventory.
#
# Warehouse Verification:
#     Adds verified returned quantity back to inventory.
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
        # QUARTER
        # ==================================================

        quarter = get_quarter(month)

        quarter_start = get_quarter_start(month)

        quarter_end = get_quarter_end(month)

        quarter_is_closed = is_quarter_end(month)

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
                    "This period has already been verified."

            }), 400

        # ==================================================
        # GET ELIGIBLE RETURNED RECORDS
        #
        # Rice / Wheat:
        #     selected month
        #
        # Sugar / Kerosene:
        #     quarter-end only
        #
        # IMPORTANT:
        #
        # Only records that have actually been returned
        # by the ration shop are selected.
        # ==================================================

        cursor.execute("""
            SELECT

                ua.audit_id,
                ua.beneficiary_id,
                ua.item_id,

                ua.month,
                ua.year,

                ua.unclaimed_quantity,
                ua.warehouse_returned_quantity,

                ua.returned_to_warehouse,
                ua.audit_status,

                ri.item_name,
                ri.unit

            FROM unclaimed_audit ua

            JOIN ration_items ri
                ON ua.item_id = ri.item_id

            WHERE ua.year = %s

            AND (
                (
                    LOWER(ri.item_name)
                    IN ('rice', 'wheat')

                    AND ua.month = %s
                )

                OR

                (
                    LOWER(ri.item_name)
                    IN ('sugar', 'kerosene')

                    AND ua.month = %s

                    AND %s = TRUE
                )
            )

            AND ua.returned_to_warehouse = TRUE

            AND ua.audit_status = 'Returned'

            AND ua.warehouse_returned_quantity > 0

            FOR UPDATE

        """, (
            year,
            month,
            quarter_end,
            quarter_is_closed
        ))

        returned_items = cursor.fetchall()

        # ==================================================
        # CHECK FOR RETURNED STOCK
        # ==================================================

        if not returned_items:

            return jsonify({

                "message":
                    "No returned stock is available "
                    "for verification for this period."

            }), 400

        # ==================================================
        # CALCULATE ELIGIBLE UNCLAIMED / RETURNED TOTALS
        #
        # This is done using the SAME records that will
        # actually be verified.
        # ==================================================

        total_unclaimed = 0.0
        total_returned = 0.0

        # ==================================================
        # FIRST GET ALL ELIGIBLE AUDIT RECORDS
        #
        # We need this because an eligible period may have
        # some pending records and some returned records.
        # ==================================================

        cursor.execute("""
            SELECT

                ua.audit_id,
                ua.item_id,

                ua.unclaimed_quantity,
                ua.warehouse_returned_quantity,

                ua.returned_to_warehouse,
                ua.audit_status,

                ri.item_name

            FROM unclaimed_audit ua

            JOIN ration_items ri
                ON ua.item_id = ri.item_id

            WHERE ua.year = %s

            AND (
                (
                    LOWER(ri.item_name)
                    IN ('rice', 'wheat')

                    AND ua.month = %s
                )

                OR

                (
                    LOWER(ri.item_name)
                    IN ('sugar', 'kerosene')

                    AND ua.month = %s

                    AND %s = TRUE
                )
            )

            FOR UPDATE

        """, (
            year,
            month,
            quarter_end,
            quarter_is_closed
        ))

        eligible_items = cursor.fetchall()

        # ==================================================
        # VERIFY THAT ALL ELIGIBLE UNCLAIMED STOCK
        # HAS BEEN RETURNED
        # ==================================================

        for row in eligible_items:

            unclaimed = float(
                row["unclaimed_quantity"] or 0
            )

            returned = float(
                row["warehouse_returned_quantity"] or 0
            )

            total_unclaimed += unclaimed

            total_returned += returned

        # ==================================================
        # NO UNCLAIMED STOCK
        # ==================================================

        if total_unclaimed <= 0:

            return jsonify({

                "message":
                    "No unclaimed stock is available "
                    "for verification."

            }), 400

        # ==================================================
        # CHECK RETURN TOTAL
        # ==================================================

        difference = (
            total_unclaimed -
            total_returned
        )

        if abs(difference) > 0.0001:

            return jsonify({

                "message":
                    "Verification cannot be completed. "
                    "All eligible unclaimed stock must be "
                    "returned before warehouse verification.",

                "total_unclaimed":
                    total_unclaimed,

                "total_returned":
                    total_returned,

                "difference":
                    difference

            }), 400

        # ==================================================
        # SAFETY CHECK
        #
        # All eligible records must actually be marked
        # Returned.
        # ==================================================

        for row in eligible_items:

            unclaimed = float(
                row["unclaimed_quantity"] or 0
            )

            returned = float(
                row["warehouse_returned_quantity"] or 0
            )

            if unclaimed > 0:

                if (
                    not row["returned_to_warehouse"]
                    or row["audit_status"] != "Returned"
                    or abs(
                        returned -
                        unclaimed
                    ) > 0.0001
                ):

                    return jsonify({

                        "message":
                            "Verification cannot be completed. "
                            "Some eligible unclaimed stock has "
                            "not been returned yet.",

                        "audit_id":
                            row["audit_id"],

                        "unclaimed_quantity":
                            unclaimed,

                        "returned_quantity":
                            returned

                    }), 400

        # ==================================================
        # ADD RETURNED STOCK TO INVENTORY
        #
        # THIS IS THE ONLY PLACE WHERE INVENTORY
        # IS UPDATED FOR WAREHOUSE RETURNS.
        # ==================================================

        inventory_added = {}

        processed_count = 0

        for row in returned_items:

            item_id = row["item_id"]

            returned_quantity = float(
                row[
                    "warehouse_returned_quantity"
                ] or 0
            )

            if returned_quantity <= 0:

                continue

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
            # Track item-wise inventory addition
            # ---------------------------------------------

            if item_id not in inventory_added:

                inventory_added[item_id] = 0.0

            inventory_added[item_id] += (
                returned_quantity
            )

            processed_count += 1

        # ==================================================
        # UPDATE MONTHLY CLOSURE
        #
        # The selected period is now verified.
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
        # COMMIT
        #
        # Inventory update and verification status happen
        # together.
        #
        # If anything fails:
        #     inventory changes are rolled back.
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

            "quarter":
                f"Q{quarter}",

            "quarter_end":
                quarter_end,

            "total_unclaimed":
                total_unclaimed,

            "total_returned":
                total_returned,

            "difference":
                difference,

            "inventory_updated":
                True,

            "items_processed":
                processed_count,

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