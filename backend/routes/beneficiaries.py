from flask import Blueprint, request, jsonify
from db import get_connection

beneficiaries_bp = Blueprint("beneficiaries", __name__)

@beneficiaries_bp.route("/beneficiaries", methods=["POST"])
def add_beneficiary():

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # Duplicate Aadhaar
    cursor.execute(
        "SELECT beneficiary_id FROM beneficiaries WHERE aadhaar_no=%s",
        (data["aadhaar_no"],)
    )

    if cursor.fetchone():
        return jsonify({"message": "Aadhaar already exists"}), 400

    # Duplicate Ration Card
    cursor.execute(
        "SELECT beneficiary_id FROM beneficiaries WHERE ration_card_no=%s",
        (data["ration_card_no"],)
    )

    if cursor.fetchone():
        return jsonify({"message": "Ration Card already exists"}), 400

    # Duplicate Username
    cursor.execute(
        "SELECT beneficiary_id FROM beneficiaries WHERE username=%s",
        (data["username"],)
    )

    if cursor.fetchone():
        return jsonify({"message": "Username already exists"}), 400

    query = """
    INSERT INTO beneficiaries
    (
        ration_card_no,
        full_name,
        aadhaar_no,
        phone,
        address,
        category_id,
        family_members,
        username,
        password
    )
    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """

    values = (
        data["ration_card_no"],
        data["full_name"],
        data["aadhaar_no"],
        data["phone"],
        data["address"],
        data["category_id"],
        data["family_members"],
        data["username"],
        data["password"]
    )

    cursor.execute(query, values)
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({
        "message": "Beneficiary added successfully"
    }), 201
# View All Beneficiaries
@beneficiaries_bp.route("/beneficiaries", methods=["GET"])
def get_beneficiaries():

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            beneficiary_id,
            ration_card_no,
            full_name,
            aadhaar_no,
            phone,
            address,
            category_id,
            family_members,
            username,
            status,
            created_at
        FROM beneficiaries
        ORDER BY beneficiary_id
    """)

    beneficiaries = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(beneficiaries)
# Update Beneficiary
@beneficiaries_bp.route("/beneficiaries/<int:id>", methods=["PUT"])
def update_beneficiary(id):

    data = request.get_json()

    conn = get_connection()
    cursor = conn.cursor()

    query = """
    UPDATE beneficiaries
    SET
        full_name=%s,
        phone=%s,
        address=%s,
        category_id=%s,
        family_members=%s,
        status=%s
    WHERE beneficiary_id=%s
    """

    values = (
        data["full_name"],
        data["phone"],
        data["address"],
        data["category_id"],
        data["family_members"],
        data["status"],
        id
    )

    cursor.execute(query, values)
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Beneficiary updated successfully"})
# Delete Beneficiary
@beneficiaries_bp.route("/beneficiaries/<int:id>", methods=["DELETE"])
def delete_beneficiary(id):

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        "DELETE FROM beneficiaries WHERE beneficiary_id=%s",
        (id,)
    )

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Beneficiary deleted successfully"})