from flask import Blueprint, request, jsonify
from db import get_connection

distribution_bp = Blueprint("distribution", __name__)

@distribution_bp.route("/distribution", methods=["POST"])
def distribute():

    data = request.get_json()

    beneficiary_id = data["beneficiary_id"]
    item_id = data["item_id"]
    quantity = data["quantity_given"]
    distributed_by = data["distributed_by"]

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Check inventory
    cursor.execute(
        "SELECT available_quantity FROM inventory WHERE item_id=%s",
        (item_id,)
    )

    inventory = cursor.fetchone()

    if inventory is None:
        cursor.close()
        conn.close()
        return jsonify({"message": "Item not found in inventory"}), 404

    if inventory["available_quantity"] < quantity:
        cursor.close()
        conn.close()
        return jsonify({"message": "Insufficient stock"}), 400

    # Reduce inventory
    cursor.execute(
        """
        UPDATE inventory
        SET available_quantity = available_quantity - %s
        WHERE item_id=%s
        """,
        (quantity, item_id)
    )

    # Record distribution
    cursor.execute(
        """
        INSERT INTO distributions
        (beneficiary_id, item_id, quantity_given, distributed_by)
        VALUES (%s,%s,%s,%s)
        """,
        (
            beneficiary_id,
            item_id,
            quantity,
            distributed_by
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Distribution completed successfully"
    }), 201

# View Distribution History
@distribution_bp.route("/distribution", methods=["GET"])
def get_distribution():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT
        d.distribution_id,
        b.full_name,
        r.item_name,
        d.quantity_given,
        d.distribution_date,
        d.distributed_by
    FROM distributions d
    JOIN beneficiaries b
        ON d.beneficiary_id = b.beneficiary_id
    JOIN ration_items r
        ON d.item_id = r.item_id
    ORDER BY d.distribution_date DESC
    """

    cursor.execute(query)

    history = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(history)