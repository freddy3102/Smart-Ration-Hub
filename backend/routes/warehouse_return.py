from flask import Blueprint, request, jsonify
from db import get_connection
from business_date import get_business_date

warehouse_bp = Blueprint("warehouse", __name__)


@warehouse_bp.route("/warehouse-return/<int:audit_id>", methods=["PUT"])
def warehouse_return(audit_id):

    data = request.get_json()

    returned_qty = float(data["returned_quantity"])
    processed_by = data["processed_by"]

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ---------------------------------
    # Check Distribution Cycle Closed
    # ---------------------------------

    today = get_business_date()

    cursor.execute("""

        SELECT closure_id

        FROM monthly_closure

        WHERE month=%s
        AND year=%s

    """, (

        today.month,
        today.year

    ))

    month_closed = cursor.fetchone()

    if month_closed is None:

        cursor.close()
        conn.close()

        return jsonify({

            "message":
            "Distribution cycle has not been closed yet. Warehouse return is allowed only after month-end closure."

        }), 400

    # -------------------------
    # Get audit record
    # -------------------------

    cursor.execute("""

        SELECT

            item_id,
            unclaimed_quantity,
            audit_status

        FROM unclaimed_audit

        WHERE audit_id=%s

    """, (audit_id,))

    audit = cursor.fetchone()

    if audit is None:

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Audit record not found."
        }), 404

    if audit["audit_status"] == "Returned":

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Stock already returned."
        }), 400

    if returned_qty > float(audit["unclaimed_quantity"]):

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Returned quantity cannot exceed unclaimed quantity."
        }), 400

    # -------------------------
    # Add stock back to inventory
    # -------------------------

    cursor.execute("""

        UPDATE inventory

        SET available_quantity =
            available_quantity + %s

        WHERE item_id=%s

    """, (

        returned_qty,
        audit["item_id"]

    ))

    # -------------------------
    # Update audit
    # -------------------------

    cursor.execute("""

        UPDATE unclaimed_audit

        SET

            warehouse_returned_quantity=%s,

            returned_to_warehouse=TRUE,

            processed_by=%s,

            audit_status='Returned'

        WHERE audit_id=%s

    """, (

        returned_qty,
        processed_by,
        audit_id

    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({

        "message": "Stock returned to warehouse successfully."

    })