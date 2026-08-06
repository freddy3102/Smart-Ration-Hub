from flask import Blueprint, request, jsonify
from db import get_connection
from business_date import get_business_date

distribution_bp = Blueprint("distribution", __name__)


@distribution_bp.route("/distribution", methods=["POST"])
def distribute():

    data = request.get_json()

    beneficiary_id = data["beneficiary_id"]
    item_id = data["item_id"]
    quantity = float(data["quantity_given"])
    distributed_by = data["distributed_by"]

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # ---------------------------------
    # Business Date
    # ---------------------------------

    today = get_business_date()

    current_month = today.month
    current_year = today.year

    # ---------------------------------
    # CHECK 1 : Month Closed?
    # ---------------------------------

    cursor.execute("""

        SELECT closure_id
        FROM monthly_closure
        WHERE month=%s
        AND year=%s

    """, (

        current_month,
        current_year

    ))

    month_closed = cursor.fetchone()

    if month_closed:

        cursor.close()
        conn.close()

        return jsonify({

            "message":
            "Distribution for this month has already been closed."

        }), 400

    # ---------------------------------
    # CHECK 2 : Stock Already Returned?
    # ---------------------------------

    cursor.execute("""

        SELECT audit_status

        FROM unclaimed_audit

        WHERE beneficiary_id=%s
        AND item_id=%s
        AND month=%s
        AND year=%s

    """, (

        beneficiary_id,
        item_id,
        current_month,
        current_year

    ))

    audit = cursor.fetchone()

    if audit and audit["audit_status"] == "Returned":

        cursor.close()
        conn.close()

        return jsonify({

            "message":
            "Distribution not allowed. Unclaimed stock has already been returned to the warehouse."

        }), 400

    # ---------------------------------
    # Beneficiary Category
    # ---------------------------------

    cursor.execute("""

        SELECT category_id

        FROM beneficiaries

        WHERE beneficiary_id=%s

    """, (

        beneficiary_id,

    ))

    beneficiary = cursor.fetchone()

    if beneficiary is None:

        cursor.close()
        conn.close()

        return jsonify({

            "message": "Beneficiary not found."

        }), 404

    category_id = beneficiary["category_id"]

        # ---------------------------------
    # Monthly Entitlement
    # ---------------------------------

    cursor.execute("""

        SELECT monthly_quantity

        FROM entitlement_rules

        WHERE category_id=%s
        AND item_id=%s

    """, (

        category_id,
        item_id

    ))

    entitlement = cursor.fetchone()

    if entitlement is None:

        cursor.close()
        conn.close()

        return jsonify({

            "message": "No entitlement for this item."

        }), 400

    monthly_quantity = float(entitlement["monthly_quantity"])

    # ---------------------------------
    # Already Claimed
    # ---------------------------------

    cursor.execute("""

        SELECT

            IFNULL(
                SUM(quantity_given),
                0
            ) AS claimed

        FROM distributions

        WHERE beneficiary_id=%s
        AND item_id=%s
        AND MONTH(distribution_date)=%s
        AND YEAR(distribution_date)=%s

    """, (

        beneficiary_id,
        item_id,
        current_month,
        current_year

    ))

    claimed = float(cursor.fetchone()["claimed"])

    remaining = monthly_quantity - claimed

    # ---------------------------------
    # Prevent Over Claim
    # ---------------------------------

    if quantity > remaining:

        cursor.close()
        conn.close()

        return jsonify({

            "message":
            f"Only {remaining} remains for this month."

        }), 400

    # ---------------------------------
    # Inventory Check
    # ---------------------------------

    cursor.execute("""

        SELECT available_quantity

        FROM inventory

        WHERE item_id=%s

    """, (

        item_id,

    ))

    inventory = cursor.fetchone()

    if inventory is None:

        cursor.close()
        conn.close()

        return jsonify({

            "message": "Inventory not found."

        }), 404

    if float(inventory["available_quantity"]) < quantity:

        cursor.close()
        conn.close()

        return jsonify({

            "message": "Insufficient inventory."

        }), 400

    # ---------------------------------
    # Reduce Inventory
    # ---------------------------------

    cursor.execute("""

        UPDATE inventory

        SET available_quantity =
            available_quantity - %s

        WHERE item_id=%s

    """, (

        quantity,
        item_id

    ))

    # ---------------------------------
    # Save Distribution
    # ---------------------------------

    cursor.execute("""

        INSERT INTO distributions
        (

            beneficiary_id,
            item_id,
            quantity_given,
            distribution_date,
            distributed_by

        )

        VALUES
        (

            %s,
            %s,
            %s,
            %s,
            %s

        )

    """, (

        beneficiary_id,
        item_id,
        quantity,
        today,
        distributed_by

    ))

        # ---------------------------------
    # Update Audit Table
    # ---------------------------------

    new_claimed = claimed + quantity
    new_unclaimed = monthly_quantity - new_claimed

    cursor.execute("""

        SELECT audit_id

        FROM unclaimed_audit

        WHERE beneficiary_id=%s
        AND item_id=%s
        AND month=%s
        AND year=%s

    """, (

        beneficiary_id,
        item_id,
        current_month,
        current_year

    ))

    audit_record = cursor.fetchone()

    if audit_record:

        cursor.execute("""

            UPDATE unclaimed_audit

            SET

                entitled_quantity=%s,
                claimed_quantity=%s,
                unclaimed_quantity=%s

            WHERE audit_id=%s

        """, (

            monthly_quantity,
            new_claimed,
            new_unclaimed,
            audit_record["audit_id"]

        ))

    else:

        cursor.execute("""

            INSERT INTO unclaimed_audit
            (

                beneficiary_id,
                item_id,
                month,
                year,
                entitled_quantity,
                claimed_quantity,
                unclaimed_quantity,
                audit_status

            )

            VALUES
            (

                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                %s,
                'Pending'

            )

        """, (

            beneficiary_id,
            item_id,
            current_month,
            current_year,
            monthly_quantity,
            new_claimed,
            new_unclaimed

        ))

    # ---------------------------------
    # Save Changes
    # ---------------------------------

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({

        "message": "Distribution successful.",

        "monthly_entitlement": monthly_quantity,

        "already_claimed": claimed,

        "remaining_after_distribution":
            remaining - quantity

    }), 201