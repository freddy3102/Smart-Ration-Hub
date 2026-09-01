from flask import Blueprint, jsonify, request
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
# When stock is returned by the ration shop,
# the returned quantity is temporarily removed
# from active warehouse inventory.
#
# Inventory is added back only when the warehouse
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

        # ==================================================
        # BASIC INFORMATION
        # ==================================================

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
        # DETERMINE ITEM TYPE
        # ==================================================

        is_quarterly_item = (
            item_name_lower in (
                "sugar",
                "kerosene"
            )
        )

        is_monthly_item = (
            item_name_lower in (
                "rice",
                "wheat"
            )
        )

        # ==================================================
        # UNKNOWN ITEM
        # ==================================================

        if not (
            is_monthly_item
            or is_quarterly_item
        ):

            return jsonify({

                "message":
                    "This item is not supported "
                    "for warehouse return.",

                "item":
                    item_name

            }), 400

        # ==================================================
        # CHECK MONTHLY CLOSURE
        #
        # The distribution cycle must be CLOSED.
        #
        # CLOSED != VERIFIED
        #
        # Closing allows warehouse return.
        # Verification happens later.
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

        # ==================================================
        # MONTH NOT CLOSED
        # ==================================================

        if closure is None:

            return jsonify({

                "message":
                    "Distribution cycle has not been "
                    "closed yet. Warehouse return is "
                    "allowed only after the cycle is closed."

            }), 400

        # ==================================================
        # ALREADY VERIFIED
        #
        # Once warehouse verification is complete,
        # no more returns are accepted for that period.
        # ==================================================

        if closure["verified"]:

            return jsonify({

                "message":
                    "This period has already been verified. "
                    "Warehouse return is no longer allowed."

            }), 400

        # ==================================================
        # QUARTERLY RETURN RULE
        #
        # Sugar / Kerosene:
        #
        # March
        # June
        # September
        # December
        #
        # ONLY these months.
        # ==================================================

        if is_quarterly_item:

            if not is_quarter_end(
                audit_month
            ):

                return jsonify({

                    "message":
                        f"{item_name} is a quarterly item. "
                        "Warehouse return is allowed only "
                        "at quarter end: March, June, "
                        "September or December.",

                    "item":
                        item_name,

                    "month":
                        audit_month,

                    "year":
                        audit_year

                }), 400

        # ==================================================
        # ALREADY RETURNED
        #
        # Returned means:
        #     Shop has handed stock back
        #     Warehouse manager still needs to verify
        # ==================================================

        if audit["returned_to_warehouse"]:

            return jsonify({

                "message":
                    "Stock for this audit record has "
                    "already been returned and is awaiting "
                    "warehouse verification."

            }), 400

        if audit["audit_status"] == "Returned":

            return jsonify({

                "message":
                    "Stock for this audit record has "
                    "already been returned and is awaiting "
                    "warehouse verification."

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
        # Partial returns are not allowed.
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
        # GET INVENTORY
        #
        # IMPORTANT:
        #
        # The returned quantity is temporarily removed
        # from active warehouse inventory.
        #
        # Example:
        #
        # Inventory = 70 kg
        # Returned  = 10 kg
        #
        # Inventory becomes 60 kg.
        #
        # After warehouse manager verification,
        # warehouse_verification.py adds the 10 kg back.
        # ==================================================

        cursor.execute("""
            SELECT

                inventory_id,
                available_quantity

            FROM inventory

            WHERE item_id = %s

            FOR UPDATE

        """, (
            audit["item_id"],
        ))

        inventory = cursor.fetchone()

        # ==================================================
        # INVENTORY NOT FOUND
        # ==================================================

        if inventory is None:

            return jsonify({

                "message":
                    "Inventory record not found "
                    "for this item."

            }), 404

        # ==================================================
        # CURRENT INVENTORY
        # ==================================================

        available_quantity = float(
            inventory["available_quantity"] or 0
        )

        # ==================================================
        # CHECK INVENTORY
        #
        # Prevent inventory from becoming negative.
        # ==================================================

        if available_quantity < returned_qty:

            return jsonify({

                "message":
                    "Insufficient inventory available "
                    "to process this warehouse return.",

                "available_quantity":
                    available_quantity,

                "returned_quantity":
                    returned_qty

            }), 400

        # ==================================================
        # DEDUCT RETURNED STOCK FROM INVENTORY
        #
        # Inventory is reduced when the shop records
        # the physical return.
        #
        # The warehouse manager will add it back
        # after successful verification.
        # ==================================================

        new_inventory_quantity = (
            available_quantity -
            returned_qty
        )

        cursor.execute("""
            UPDATE inventory

            SET

                available_quantity = %s

            WHERE inventory_id = %s

        """, (

            new_inventory_quantity,

            inventory["inventory_id"]

        ))

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
        # Both operations happen together:
        #
        # 1. Inventory is reduced by returned quantity.
        # 2. Audit is marked as Returned.
        #
        # If either fails, both are rolled back.
        # ==================================================

        conn.commit()

        # ==================================================
        # RESPONSE
        # ==================================================

        return jsonify({

            "message":
                "Stock return recorded successfully. "
                "Returned stock has been deducted from "
                "active inventory and is now awaiting "
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

            "return_type":
                "QUARTERLY"
                if is_quarterly_item
                else "MONTHLY",

            "quarterly_item":
                is_quarterly_item,

            "unclaimed_quantity":
                unclaimed_quantity,

            "returned_quantity":
                returned_qty,

            "inventory_before_return":
                available_quantity,

            "inventory_after_return":
                new_inventory_quantity,

            "inventory_updated":
                True,

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