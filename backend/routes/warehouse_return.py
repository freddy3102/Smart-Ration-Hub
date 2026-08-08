from flask import Blueprint, jsonify, request
from db import get_connection


warehouse_bp = Blueprint(
    "warehouse",
    __name__
)


# ==================================================
# Warehouse Return
# ==================================================

@warehouse_bp.route(
    "/warehouse-return/<int:audit_id>",
    methods=["PUT"]
)
def warehouse_return(audit_id):

    data = request.get_json()

    if not data:
        return jsonify({
            "message": "Request body is required."
        }), 400

    returned_qty = data.get("returned_quantity")
    processed_by = data.get("processed_by")

    # ---------------------------------
    # Validate Input
    # ---------------------------------

    if returned_qty is None or processed_by is None:

        return jsonify({
            "message":
            "Returned quantity and Processed By are required."
        }), 400

    try:

        returned_qty = float(returned_qty)

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
        cursor = conn.cursor(dictionary=True)

        # ---------------------------------
        # Get Audit Record
        # ---------------------------------

        cursor.execute("""
            SELECT
                audit_id,
                beneficiary_id,
                item_id,
                month,
                year,
                unclaimed_quantity,
                warehouse_returned_quantity,
                returned_to_warehouse,
                audit_status
            FROM unclaimed_audit
            WHERE audit_id=%s
            FOR UPDATE
        """, (
            audit_id,
        ))

        audit = cursor.fetchone()

        if audit is None:

            return jsonify({
                "message":
                "Audit record not found."
            }), 404

        # ---------------------------------
        # Audit Month & Year
        # ---------------------------------

        audit_month = audit["month"]
        audit_year = audit["year"]

        # ---------------------------------
        # Check Monthly Closure
        # ---------------------------------

        cursor.execute("""
            SELECT
                closure_id,
                verified
            FROM monthly_closure
            WHERE month=%s
            AND year=%s
        """, (
            audit_month,
            audit_year
        ))

        closure = cursor.fetchone()

        if closure is None:

            return jsonify({
                "message":
                "Distribution cycle has not been closed yet. "
                "Warehouse return is allowed only after month-end closure."
            }), 400

        # ---------------------------------
        # Already Verified?
        # ---------------------------------

        if closure["verified"]:

            return jsonify({
                "message":
                "This month has already been verified. "
                "Warehouse return is no longer allowed."
            }), 400

        # ---------------------------------
        # Already Returned?
        # ---------------------------------

        if audit["audit_status"] == "Returned":

            return jsonify({
                "message":
                "Stock for this audit record has already been marked as returned."
            }), 400

        if audit["returned_to_warehouse"]:

            return jsonify({
                "message":
                "Stock for this audit record has already been returned."
            }), 400

        # ---------------------------------
        # Unclaimed Quantity
        # ---------------------------------

        unclaimed_quantity = float(
            audit["unclaimed_quantity"]
        )

        # ---------------------------------
        # Nothing To Return
        # ---------------------------------

        if unclaimed_quantity <= 0:

            return jsonify({
                "message":
                "There is no unclaimed stock available for return."
            }), 400

        # ---------------------------------
        # Returned Quantity Validation
        # ---------------------------------

        if returned_qty > unclaimed_quantity:

            return jsonify({

                "message":
                "Returned quantity cannot exceed unclaimed quantity.",

                "unclaimed_quantity":
                unclaimed_quantity,

                "returned_quantity":
                returned_qty

            }), 400

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
            audit["item_id"],
        ))

        inventory = cursor.fetchone()

        if inventory is None:

            return jsonify({
                "message":
                "Inventory record not found for this item."
            }), 404

        available_quantity = float(
            inventory["available_quantity"]
        )

        # ---------------------------------
        # Prevent Negative Inventory
        # ---------------------------------

        if available_quantity < returned_qty:

            return jsonify({

                "message":
                "Insufficient inventory to record this return.",

                "available_quantity":
                available_quantity,

                "returned_quantity":
                returned_qty

            }), 400

        # ---------------------------------
        # Deduct From Inventory
        #
        # Stock leaves the ration shop
        # and is now awaiting verification
        # at the warehouse.
        # ---------------------------------

        cursor.execute("""
            UPDATE inventory
            SET
                available_quantity =
                    available_quantity - %s
            WHERE item_id=%s
        """, (
            returned_qty,
            audit["item_id"]
        ))

        # ---------------------------------
        # Update Audit Record
        # ---------------------------------

        cursor.execute("""
            UPDATE unclaimed_audit
            SET
                warehouse_returned_quantity=%s,
                returned_to_warehouse=TRUE,
                processed_by=%s,
                processed_on=NOW(),
                audit_status='Returned'
            WHERE audit_id=%s
        """, (
            returned_qty,
            processed_by,
            audit_id
        ))

        # ---------------------------------
        # Commit Both Changes Together
        # ---------------------------------

        conn.commit()

        # ---------------------------------
        # New Inventory Quantity
        # ---------------------------------

        new_inventory_quantity = (
            available_quantity -
            returned_qty
        )

        # ---------------------------------
        # Response
        # ---------------------------------

        return jsonify({

            "message":
            "Stock returned successfully. "
            "Returned quantity has been deducted from inventory "
            "and is awaiting warehouse verification.",

            "audit_id":
            audit_id,

            "beneficiary_id":
            audit["beneficiary_id"],

            "item_id":
            audit["item_id"],

            "month":
            audit_month,

            "year":
            audit_year,

            "unclaimed_quantity":
            unclaimed_quantity,

            "returned_quantity":
            returned_qty,

            "inventory_before_return":
            available_quantity,

            "inventory_after_return":
            new_inventory_quantity,

            "audit_status":
            "Returned",

            "inventory_updated":
            True

        }), 200

    except Exception as e:

        if conn:
            conn.rollback()

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