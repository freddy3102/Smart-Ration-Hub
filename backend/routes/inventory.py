from flask import Blueprint, request, jsonify
from db import get_connection


inventory_bp = Blueprint(
    "inventory",
    __name__
)


# ==================================================
# Add Inventory
# ==================================================

@inventory_bp.route("/inventory", methods=["POST"])
def add_inventory():

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # Check whether inventory already exists
        # for this item

        cursor.execute(
            """
            SELECT inventory_id
            FROM inventory
            WHERE item_id = %s
            """,
            (data["item_id"],)
        )

        if cursor.fetchone():

            return jsonify({
                "message":
                    "Inventory already exists for this item"
            }), 400

        query = """
            INSERT INTO inventory
            (
                item_id,
                available_quantity,
                minimum_stock
            )
            VALUES (%s, %s, %s)
        """

        values = (
            data["item_id"],
            data["available_quantity"],
            data["minimum_stock"]
        )

        cursor.execute(
            query,
            values
        )

        conn.commit()

        return jsonify({
            "message":
                "Inventory added successfully"
        }), 201

    except Exception as e:

        conn.rollback()

        return jsonify({
            "message":
                "Unable to add inventory.",
            "error":
                str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ==================================================
# View Inventory
# ==================================================

@inventory_bp.route("/inventory", methods=["GET"])
def get_inventory():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:

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

        return jsonify(inventory)

    except Exception as e:

        return jsonify({
            "message":
                "Unable to load inventory.",
            "error":
                str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ==================================================
# Add Stock
#
# Used by Warehouse Manager
#
# This increases the existing available quantity.
# It does NOT change minimum_stock.
# ==================================================

@inventory_bp.route(
    "/inventory/add-stock",
    methods=["PUT"]
)
def add_stock():

    data = request.get_json()

    item_id = data.get("item_id")
    quantity = data.get("quantity")

    # ---------------------------------
    # Validate item ID
    # ---------------------------------

    if not item_id:

        return jsonify({
            "message":
                "Item ID is required."
        }), 400

    # ---------------------------------
    # Validate quantity
    # ---------------------------------

    try:

        quantity = float(quantity)

    except (TypeError, ValueError):

        return jsonify({
            "message":
                "Invalid stock quantity."
        }), 400

    if quantity <= 0:

        return jsonify({
            "message":
                "Stock quantity must be greater than zero."
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ---------------------------------
        # Check inventory record
        # ---------------------------------

        cursor.execute(
            """
            SELECT
                inventory_id,
                item_id,
                available_quantity,
                minimum_stock
            FROM inventory
            WHERE item_id = %s
            """,
            (item_id,)
        )

        inventory = cursor.fetchone()

        if not inventory:

            return jsonify({
                "message":
                    "Inventory record not found for this item."
            }), 404

        current_quantity = float(
            inventory["available_quantity"] or 0
        )

        new_quantity = (
            current_quantity +
            quantity
        )

        # ---------------------------------
        # Update ONLY available quantity
        # ---------------------------------

        cursor.execute(
            """
            UPDATE inventory
            SET available_quantity = %s
            WHERE inventory_id = %s
            """,
            (
                new_quantity,
                inventory["inventory_id"]
            )
        )

        conn.commit()

        # ---------------------------------
        # Determine new status
        # ---------------------------------

        minimum_stock = float(
            inventory["minimum_stock"] or 0
        )

        if new_quantity == 0:

            stock_status = "Out of Stock"

        elif new_quantity <= minimum_stock:

            stock_status = "Low Stock"

        else:

            stock_status = "Available"

        return jsonify({

            "message":
                "Stock added successfully.",

            "item_id":
                inventory["item_id"],

            "previous_quantity":
                current_quantity,

            "added_quantity":
                quantity,

            "new_quantity":
                new_quantity,

            "minimum_stock":
                minimum_stock,

            "stock_status":
                stock_status

        }), 200

    except Exception as e:

        conn.rollback()

        return jsonify({
            "message":
                "Unable to add stock.",
            "error":
                str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ==================================================
# Update Inventory
# ==================================================

@inventory_bp.route(
    "/inventory/<int:id>",
    methods=["PUT"]
)
def update_inventory(id):

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor()

    try:

        query = """
            UPDATE inventory
            SET
                available_quantity = %s,
                minimum_stock = %s
            WHERE inventory_id = %s
        """

        values = (
            data["available_quantity"],
            data["minimum_stock"],
            id
        )

        cursor.execute(
            query,
            values
        )

        conn.commit()

        return jsonify({
            "message":
                "Inventory updated successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "message":
                "Unable to update inventory.",
            "error":
                str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ==================================================
# Delete Inventory
# ==================================================

@inventory_bp.route(
    "/inventory/<int:id>",
    methods=["DELETE"]
)
def delete_inventory(id):

    conn = get_connection()
    cursor = conn.cursor()

    try:

        cursor.execute(
            """
            DELETE FROM inventory
            WHERE inventory_id = %s
            """,
            (id,)
        )

        conn.commit()

        return jsonify({
            "message":
                "Inventory deleted successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "message":
                "Unable to delete inventory.",
            "error":
                str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ==================================================
# Get All Ration Items
# ==================================================

@inventory_bp.route(
    "/ration-items",
    methods=["GET"]
)
def get_ration_items():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:

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

        return jsonify(items)

    except Exception as e:

        return jsonify({
            "message":
                "Unable to load ration items.",
            "error":
                str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()