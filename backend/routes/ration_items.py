from flask import Blueprint, request, jsonify
from db import get_connection

ration_items_bp = Blueprint("ration_items", __name__)

# -----------------------------
# Add Ration Item
# -----------------------------
@ration_items_bp.route("/ration-items", methods=["POST"])
def add_ration_item():

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT item_id FROM ration_items WHERE item_name=%s",
        (data["item_name"],)
    )

    if cursor.fetchone():
        cursor.close()
        conn.close()
        return jsonify({"message": "Item already exists"}), 400

    cursor.execute(
        """
        INSERT INTO ration_items
        (item_name, unit, subsidy_price)
        VALUES (%s,%s,%s)
        """,
        (
            data["item_name"],
            data["unit"],
            data["subsidy_price"]
        )
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message":"Item added successfully"
    })


# -----------------------------
# View All Items
# -----------------------------
@ration_items_bp.route("/ration-items", methods=["GET"])
def get_ration_items():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT *
        FROM ration_items
        ORDER BY item_name
    """)

    items = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(items)


# -----------------------------
# Update Item
# -----------------------------
@ration_items_bp.route("/ration-items/<int:id>", methods=["PUT"])
def update_item(id):

    data=request.get_json()

    conn=get_connection()
    cursor=conn.cursor()

    cursor.execute("""
        UPDATE ration_items
        SET
            item_name=%s,
            unit=%s,
            subsidy_price=%s
        WHERE item_id=%s
    """,(
        data["item_name"],
        data["unit"],
        data["subsidy_price"],
        id
    ))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message":"Item updated successfully"
    })


# -----------------------------
# Delete Item
# -----------------------------
@ration_items_bp.route("/ration-items/<int:id>", methods=["DELETE"])
def delete_item(id):

    conn=get_connection()
    cursor=conn.cursor()

    cursor.execute(
        "DELETE FROM ration_items WHERE item_id=%s",
        (id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message":"Item deleted successfully"
    })