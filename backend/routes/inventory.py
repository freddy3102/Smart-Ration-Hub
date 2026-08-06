from flask import Blueprint, request, jsonify
from db import get_connection

inventory_bp = Blueprint("inventory", __name__)

# -----------------------------
# Add Inventory
# -----------------------------
@inventory_bp.route("/inventory", methods=["POST"])
def add_inventory():

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Check whether inventory already exists for this item
    cursor.execute(
        "SELECT inventory_id FROM inventory WHERE item_id=%s",
        (data["item_id"],)
    )

    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"message": "Inventory already exists for this item"}), 400

    query = """
    INSERT INTO inventory
    (
        item_id,
        available_quantity,
        minimum_stock
    )
    VALUES (%s,%s,%s)
    """

    values = (
        data["item_id"],
        data["available_quantity"],
        data["minimum_stock"]
    )

    cursor.execute(query, values)
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Inventory added successfully"
    }), 201


# -----------------------------
# View Inventory
# -----------------------------
@inventory_bp.route("/inventory", methods=["GET"])
def get_inventory():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
    SELECT
        i.inventory_id,
        i.item_id,
        r.item_name,
        r.unit,
        r.subsidy_price,
        i.available_quantity,
        i.minimum_stock,

        CASE

            WHEN i.available_quantity = 0
                THEN 'Out of Stock'

            WHEN i.available_quantity <= i.minimum_stock
                THEN 'Low Stock'

            ELSE 'Available'

        END AS stock_status

    FROM inventory i

    JOIN ration_items r
        ON i.item_id = r.item_id

    ORDER BY r.item_name
    """

    cursor.execute(query)

    inventory = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(inventory)


# -----------------------------
# Update Inventory
# -----------------------------
@inventory_bp.route("/inventory/<int:id>", methods=["PUT"])
def update_inventory(id):

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor()

    query = """
    UPDATE inventory
    SET
        available_quantity=%s,
        minimum_stock=%s
    WHERE inventory_id=%s
    """

    values = (
        data["available_quantity"],
        data["minimum_stock"],
        id
    )

    cursor.execute(query, values)

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Inventory updated successfully"
    })


# -----------------------------
# Delete Inventory
# -----------------------------
@inventory_bp.route("/inventory/<int:id>", methods=["DELETE"])
def delete_inventory(id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM inventory WHERE inventory_id=%s",
        (id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Inventory deleted successfully"
    })

# -----------------------------
# Get All Ration Items
# -----------------------------
@inventory_bp.route("/ration-items", methods=["GET"])
def get_ration_items():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            item_id,
            item_name,
            unit,
            subsidy_price
        FROM ration_items
        ORDER BY item_name
    """)

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(items)