from flask import Blueprint, jsonify
from db import get_connection


warehouse_bp = Blueprint(
    "warehouse",
    __name__
)


# ==================================================
# Helper: Check Quarter End
# ==================================================

def is_quarter_end(month):

    return month in (3, 6, 9, 12)


# ==================================================
# Warehouse Return
#
# IMPORTANT:
#
# This endpoint ONLY records that the stock has been
# returned by the ration shop.
#
# Inventory is NOT increased here.
#
# Inventory is increased only after the warehouse
# manager verifies the returned stock.
# ==================================================

@warehouse_bp.route(
    "/warehouse-return/<int:audit_id>",
    methods=["PUT"]
)
def warehouse_return(audit_id):

    data = request.get_json() or {}

    returned_qty = data.get("returned_quantity")
    processed_by = data.get("processed_by")

    # ==================================================
    # VALIDATE INPUT
    # ==================================================

    if returned_qty is None:

        return jsonify({
            "message":
                "Returned quantity is required."
        }), 400

    if processed_by is None:

        return jsonify({
            "message":
                "Processed By is required."
        }), 400

    try:

        returned_qty = float(
            returned_qty
        )

    except (TypeError, ValueError):

        return jsonify({
            "message":
                "Returned quantity must be a valid number."
        }), 400

    if returned_qty <= 0:

        return jsonify({
            "message":
                "Returned quantity must be greater than zero."
        }), 400

    conn = None
    cursor = None

    try:

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # GET AUDIT RECORD
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

            WHERE ua.audit_id = %s

            FOR UPDATE

        """, (
            audit_id,
        ))

        audit = cursor.fetchone()

        # ==================================================
        # AUDIT NOT FOUND
        # ==================================================

        if audit is None:

            return jsonify({
                "message":
                    "Audit record not found."
            }), 404

        audit_month = int(
            audit["month"]
        )

        audit_year = int(
            audit["year"]
        )

        item_name = (
            audit["item_name"] or ""
        ).strip()

        item_name_lower = (
            item_name.lower()
        )

        # ==================================================
        # CHECK MONTHLY CLOSURE
        #
        # Return is allowed only after the month has
        # been closed.
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
            audit_month,
            audit_year
        ))

        closure = cursor.fetchone()

        if closure is None:

            return jsonify({

                "message":
                    "Distribution cycle has not been "
                    "closed yet. Warehouse return is "
                    "allowed only after month-end closure."

            }), 400

        # ==================================================
        # ALREADY VERIFIED
        # ==================================================

        if closure["verified"]:

            return jsonify({

                "message":
                    "This month has already been verified. "
                    "Warehouse return is no longer allowed."

            }), 400

        # ==================================================
        # QUARTERLY ITEM CHECK
        #
        # Sugar and Kerosene can only be returned at:
        #
        # March
        # June
        # September
        # December
        # ==================================================

        is_quarterly_item = (
            item_name_lower in (
                "sugar",
                "kerosene"
            )
        )

        if is_quarterly_item:

            if not is_quarter_end(
                audit_month
            ):

                return jsonify({

                    "message":
                        f"{item_name} is a quarterly item. "
                        "Warehouse return is allowed only "
                        "at the end of the quarter "
                        "(March, June, September or December).",

                    "item":
                        item_name,

                    "month":
                        audit_month,

                    "year":
                        audit_year

                }), 400

        # ==================================================
        # ALREADY RETURNED
        # ==================================================

        if audit["audit_status"] == "Returned":

            return jsonify({

                "message":
                    "Stock for this audit record has "
                    "already been returned."

            }), 400

        if audit["returned_to_warehouse"]:

            return jsonify({

                "message":
                    "Stock for this audit record has "
                    "already been returned."

            }), 400

        # ==================================================
        # GET UNCLAIMED QUANTITY
        # ==================================================

        unclaimed_quantity = float(
            audit["unclaimed_quantity"] or 0
        )

        # ==================================================
        # NOTHING TO RETURN
        # ==================================================

        if unclaimed_quantity <= 0:

            return jsonify({

                "message":
                    "There is no unclaimed stock "
                    "available for return."

            }), 400

        # ==================================================
        # COMPLETE RETURN REQUIRED
        #
        # We do not allow partial return.
        # ==================================================

        tolerance = 0.0001

        if abs(
            returned_qty -
            unclaimed_quantity
        ) > tolerance:

            return jsonify({

                "message":
                    "The complete unclaimed quantity "
                    "must be returned.",

                "unclaimed_quantity":
                    unclaimed_quantity,

                "returned_quantity":
                    returned_qty

            }), 400

        # ==================================================
        # IMPORTANT
        #
        # DO NOT UPDATE INVENTORY HERE.
        #
        # The stock is physically being returned to the
        # warehouse, but the system inventory is updated
        # only after the warehouse manager verifies it.
        # ==================================================

        # ==================================================
        # UPDATE AUDIT
        # ==================================================

        cursor.execute("""
            UPDATE unclaimed_audit

            SET

                warehouse_returned_quantity = %s,

                returned_to_warehouse = TRUE,

                processed_by = %s,

                processed_on = NOW(),

                audit_status = 'Returned'

            WHERE audit_id = %s

        """, (

            returned_qty,

            processed_by,

            audit_id

        ))

        # ==================================================
        # COMMIT
        #
        # Only the audit record changes.
        # Inventory remains unchanged.
        # ==================================================

        conn.commit()

        # ==================================================
        # RESPONSE
        # ==================================================

        return jsonify({

            "message":
                "Stock return recorded successfully. "
                "The returned stock is awaiting "
                "warehouse manager verification.",

            "audit_id":
                audit_id,

            "beneficiary_id":
                audit["beneficiary_id"],

            "item_id":
                audit["item_id"],

            "item_name":
                item_name,

            "unit":
                audit["unit"],

            "month":
                audit_month,

            "year":
                audit_year,

            "quarterly_item":
                is_quarterly_item,

            "unclaimed_quantity":
                unclaimed_quantity,

            "returned_quantity":
                returned_qty,

            "inventory_updated":
                False,

            "verification_required":
                True,

            "audit_status":
                "Returned"

        }), 200

    except Exception as e:

        if conn:
            conn.rollback()

        print(
            "WAREHOUSE RETURN ERROR:"
        )

        print(e)

        return jsonify({

            "message":
                "Warehouse return failed.",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()