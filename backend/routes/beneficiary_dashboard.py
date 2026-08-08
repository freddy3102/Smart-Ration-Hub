from flask import Blueprint, request, jsonify
from db import get_connection
from business_date import get_business_date


beneficiary_dashboard_bp = Blueprint(
    "beneficiary_dashboard",
    __name__
)


# ==================================================
# Helper:
# Calculate Correct Monthly Entitlement
# ==================================================

def calculate_entitlement(
    cursor,
    category_id,
    category_name,
    family_members,
    item_id
):

    # ---------------------------------
    # NPNS
    #
    # No fixed entitlement.
    # Distribution depends on availability.
    # ---------------------------------

    if category_name.upper() == "NPNS":

        return {
            "monthly_quantity": None,
            "entitlement_type": "AVAILABILITY",
            "base_quantity": None
        }

    # ---------------------------------
    # Get rule for this exact category
    # AND exact item
    # ---------------------------------

    cursor.execute("""
        SELECT
            monthly_quantity,
            entitlement_type
        FROM entitlement_rules
        WHERE category_id = %s
        AND item_id = %s
    """, (
        category_id,
        item_id
    ))

    rule = cursor.fetchone()

    if not rule:

        return {
            "monthly_quantity": 0.0,
            "entitlement_type": "NONE",
            "base_quantity": 0.0
        }

    base_quantity = float(
        rule["monthly_quantity"] or 0
    )

    entitlement_type = (
        rule["entitlement_type"] or ""
    ).upper()

    # ---------------------------------
    # PERSON based entitlement
    # ---------------------------------

    if entitlement_type == "PERSON":

        monthly_quantity = (
            base_quantity *
            family_members
        )

    # ---------------------------------
    # HOUSEHOLD based entitlement
    # ---------------------------------

    elif entitlement_type == "HOUSEHOLD":

        monthly_quantity = base_quantity

    else:

        monthly_quantity = base_quantity

    return {
        "monthly_quantity": monthly_quantity,
        "entitlement_type": entitlement_type,
        "base_quantity": base_quantity
    }


# ==================================================
# Helper:
# Get Rice / Wheat Item Information
# ==================================================

def get_ration_items(cursor):

    cursor.execute("""
        SELECT
            item_id,
            item_name
        FROM ration_items
        WHERE LOWER(item_name) IN ('rice', 'wheat')
        ORDER BY
            CASE
                WHEN LOWER(item_name) = 'rice'
                THEN 1
                WHEN LOWER(item_name) = 'wheat'
                THEN 2
                ELSE 3
            END
    """)

    return cursor.fetchall()


# ==================================================
# Beneficiary Dashboard
# ==================================================

@beneficiary_dashboard_bp.route(
    "/beneficiary-dashboard",
    methods=["GET"]
)
def beneficiary_dashboard():

    conn = None
    cursor = None

    try:

        # ==================================================
        # Beneficiary ID
        # ==================================================

        beneficiary_id = request.args.get(
            "beneficiary_id",
            type=int
        )

        if not beneficiary_id:

            return jsonify({
                "message":
                    "Beneficiary ID required."
            }), 400

        # ==================================================
        # Business Date
        # ==================================================

        business_date = get_business_date()

        default_month = business_date.month
        default_year = business_date.year

        # ==================================================
        # Selected Month / Year
        # ==================================================

        month = request.args.get(
            "month",
            default_month,
            type=int
        )

        year = request.args.get(
            "year",
            default_year,
            type=int
        )

        if month < 1 or month > 12:

            return jsonify({
                "message":
                    "Invalid month."
            }), 400

        # ==================================================
        # Database
        # ==================================================

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # Beneficiary Details
        # ==================================================

        cursor.execute("""
            SELECT
                b.beneficiary_id,
                b.full_name,
                b.category_id,
                b.family_members,
                c.category_name
            FROM beneficiaries b
            JOIN card_categories c
                ON b.category_id = c.category_id
            WHERE b.beneficiary_id = %s
        """, (
            beneficiary_id,
        ))

        beneficiary = cursor.fetchone()

        if not beneficiary:

            return jsonify({
                "message":
                    "Beneficiary not found."
            }), 404

        category_id = beneficiary["category_id"]

        category_name = (
            beneficiary["category_name"]
        )

        family_members = int(
            beneficiary["family_members"] or 0
        )

        # ==================================================
        # Distribution Cycle Status
        # ==================================================

        cursor.execute("""
            SELECT
                closure_id,
                verified
            FROM monthly_closure
            WHERE month = %s
            AND year = %s
        """, (
            month,
            year
        ))

        closure = cursor.fetchone()

        if closure:

            cycle_status = "CLOSED"

        else:

            cycle_status = "OPEN"

        # ==================================================
        # LIVE STOCK
        #
        # Rice and Wheat only
        # ==================================================

        cursor.execute("""
            SELECT
                ri.item_id,
                ri.item_name,
                i.available_quantity
            FROM inventory i
            JOIN ration_items ri
                ON i.item_id = ri.item_id
            WHERE LOWER(ri.item_name)
                IN ('rice', 'wheat')
            ORDER BY
                CASE
                    WHEN LOWER(ri.item_name) = 'rice'
                    THEN 1
                    WHEN LOWER(ri.item_name) = 'wheat'
                    THEN 2
                    ELSE 3
                END
        """)

        stock = cursor.fetchall()

        # ==================================================
        # Get Rice & Wheat
        # ==================================================

        ration_items = get_ration_items(cursor)

        monthly_history = []

        # ==================================================
        # PROCESS EACH ITEM SEPARATELY
        # ==================================================

        for item in ration_items:

            item_id = item["item_id"]
            item_name = item["item_name"]

            # ==================================================
            # Correct Entitlement
            # ==================================================

            entitlement = calculate_entitlement(
                cursor,
                category_id,
                category_name,
                family_members,
                item_id
            )

            monthly_quantity = (
                entitlement["monthly_quantity"]
            )

            entitlement_type = (
                entitlement["entitlement_type"]
            )

            base_quantity = (
                entitlement["base_quantity"]
            )

            # ==================================================
            # Actual Claimed Quantity
            #
            # IMPORTANT:
            # Use distributions instead of trusting
            # old audit entitled/claimed values.
            # ==================================================

            cursor.execute("""
                SELECT
                    IFNULL(
                        SUM(quantity_given),
                        0
                    ) AS claimed_quantity
                FROM distributions
                WHERE beneficiary_id = %s
                AND item_id = %s
                AND MONTH(distribution_date) = %s
                AND YEAR(distribution_date) = %s
            """, (
                beneficiary_id,
                item_id,
                month,
                year
            ))

            claimed_result = cursor.fetchone()

            claimed = float(
                claimed_result["claimed_quantity"] or 0
            )

            # ==================================================
            # Audit Record
            # ==================================================

            cursor.execute("""
                SELECT
                    audit_id,
                    warehouse_returned_quantity,
                    returned_to_warehouse,
                    audit_status
                FROM unclaimed_audit
                WHERE beneficiary_id = %s
                AND item_id = %s
                AND month = %s
                AND year = %s
                ORDER BY audit_id DESC
                LIMIT 1
            """, (
                beneficiary_id,
                item_id,
                month,
                year
            ))

            audit = cursor.fetchone()

            if audit:

                audit_id = audit["audit_id"]

                returned = float(
                    audit[
                        "warehouse_returned_quantity"
                    ] or 0
                )

                returned_to_warehouse = bool(
                    audit[
                        "returned_to_warehouse"
                    ]
                )

                stored_audit_status = (
                    audit["audit_status"]
                )

            else:

                audit_id = None
                returned = 0.0
                returned_to_warehouse = False
                stored_audit_status = None

            # ==================================================
            # Calculate Unclaimed
            # ==================================================

            if entitlement_type == "AVAILABILITY":

                # NPNS has no fixed entitlement.

                entitled = 0.0
                unclaimed = 0.0

            else:

                entitled = float(
                    monthly_quantity or 0
                )

                unclaimed = (
                    entitled - claimed
                )

                if unclaimed < 0:

                    unclaimed = 0.0

            # ==================================================
            # Return Status
            # ==================================================

            if unclaimed <= 0:

                return_status = (
                    "No Return Required"
                )

            elif returned_to_warehouse:

                return_status = "Returned"

            else:

                return_status = (
                    "Pending Return"
                )

            # ==================================================
            # Verification
            # ==================================================

            if closure and closure["verified"]:

                verification_status = "VERIFIED"

            else:

                verification_status = (
                    "NOT VERIFIED"
                )

            # ==================================================
            # Audit Status
            # ==================================================

            if stored_audit_status:

                audit_status = (
                    stored_audit_status
                )

            else:

                audit_status = return_status

            # ==================================================
            # Add Item
            # ==================================================

            monthly_history.append({

                "audit_id":
                    audit_id,

                "item_id":
                    item_id,

                "item_name":
                    item_name,

                "month":
                    month,

                "year":
                    year,

                "entitled_quantity":
                    entitled,

                "claimed_quantity":
                    claimed,

                "unclaimed_quantity":
                    unclaimed,

                "returned_quantity":
                    returned,

                "warehouse_returned_quantity":
                    returned,

                "returned_to_warehouse":
                    returned_to_warehouse,

                "return_status":
                    return_status,

                "audit_status":
                    audit_status,

                "verification_status":
                    verification_status,

                "entitlement_type":
                    entitlement_type,

                "base_entitlement":
                    base_quantity

            })

        # ==================================================
        # Close Database
        # ==================================================

        cursor.close()
        conn.close()

        cursor = None
        conn = None

        # ==================================================
        # Response
        # ==================================================

        return jsonify({

            "beneficiary": {

                "beneficiary_id":
                    beneficiary[
                        "beneficiary_id"
                    ],

                "full_name":
                    beneficiary[
                        "full_name"
                    ],

                "category_id":
                    category_id,

                "category_name":
                    category_name,

                "family_members":
                    family_members

            },

            "business_date":
                str(business_date),

            "month":
                month,

            "year":
                year,

            "distribution_cycle":
                cycle_status,

            "live_stock":
                stock,

            "monthly_history":
                monthly_history

        }), 200

    except Exception as e:

        if cursor:

            cursor.close()

        if conn:

            conn.close()

        return jsonify({

            "message":
                "Unable to load beneficiary dashboard.",

            "error":
                str(e)

        }), 500


# ==================================================
# Beneficiary Monthly History
# ==================================================

@beneficiary_dashboard_bp.route(
    "/beneficiary-history",
    methods=["GET"]
)
def beneficiary_history():

    beneficiary_id = request.args.get(
        "beneficiary_id",
        type=int
    )

    if not beneficiary_id:

        return jsonify({
            "message":
                "Beneficiary ID required."
        }), 400

    # ==================================================
    # Selected Month / Year
    # ==================================================

    business_date = get_business_date()

    month = request.args.get(
        "month",
        business_date.month,
        type=int
    )

    year = request.args.get(
        "year",
        business_date.year,
        type=int
    )

    if month < 1 or month > 12:

        return jsonify({
            "message":
                "Invalid month."
        }), 400

    conn = None
    cursor = None

    try:

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # Verify Beneficiary
        # ==================================================

        cursor.execute("""
            SELECT
                b.beneficiary_id,
                b.category_id,
                b.family_members,
                c.category_name
            FROM beneficiaries b
            JOIN card_categories c
                ON b.category_id = c.category_id
            WHERE b.beneficiary_id = %s
        """, (
            beneficiary_id,
        ))

        beneficiary = cursor.fetchone()

        if not beneficiary:

            return jsonify({
                "message":
                    "Beneficiary not found."
            }), 404

        category_id = (
            beneficiary["category_id"]
        )

        category_name = (
            beneficiary["category_name"]
        )

        family_members = int(
            beneficiary["family_members"] or 0
        )

        # ==================================================
        # Monthly Closure
        # ==================================================

        cursor.execute("""
            SELECT
                closure_id,
                verified
            FROM monthly_closure
            WHERE month = %s
            AND year = %s
        """, (
            month,
            year
        ))

        closure = cursor.fetchone()

        if closure and closure["verified"]:

            verification_status = "VERIFIED"

        else:

            verification_status = (
                "NOT VERIFIED"
            )

        # ==================================================
        # Get Rice & Wheat
        # ==================================================

        ration_items = get_ration_items(cursor)

        history = []

        # ==================================================
        # PROCESS RICE AND WHEAT SEPARATELY
        # ==================================================

        for item in ration_items:

            item_id = item["item_id"]
            item_name = item["item_name"]

            # ==================================================
            # Correct Entitlement
            # ==================================================

            entitlement = calculate_entitlement(
                cursor,
                category_id,
                category_name,
                family_members,
                item_id
            )

            monthly_quantity = (
                entitlement["monthly_quantity"]
            )

            entitlement_type = (
                entitlement["entitlement_type"]
            )

            base_quantity = (
                entitlement["base_quantity"]
            )

            # ==================================================
            # Actual Claimed Quantity
            # ==================================================

            cursor.execute("""
                SELECT
                    IFNULL(
                        SUM(quantity_given),
                        0
                    ) AS claimed_quantity
                FROM distributions
                WHERE beneficiary_id = %s
                AND item_id = %s
                AND MONTH(distribution_date) = %s
                AND YEAR(distribution_date) = %s
            """, (
                beneficiary_id,
                item_id,
                month,
                year
            ))

            claimed_result = cursor.fetchone()

            claimed = float(
                claimed_result["claimed_quantity"] or 0
            )

            # ==================================================
            # Audit Record
            # ==================================================

            cursor.execute("""
                SELECT
                    audit_id,
                    warehouse_returned_quantity,
                    returned_to_warehouse,
                    audit_status
                FROM unclaimed_audit
                WHERE beneficiary_id = %s
                AND item_id = %s
                AND month = %s
                AND year = %s
                ORDER BY audit_id DESC
                LIMIT 1
            """, (
                beneficiary_id,
                item_id,
                month,
                year
            ))

            audit = cursor.fetchone()

            if audit:

                audit_id = audit["audit_id"]

                returned = float(
                    audit[
                        "warehouse_returned_quantity"
                    ] or 0
                )

                returned_to_warehouse = bool(
                    audit[
                        "returned_to_warehouse"
                    ]
                )

                stored_audit_status = (
                    audit["audit_status"]
                )

            else:

                audit_id = None
                returned = 0.0
                returned_to_warehouse = False
                stored_audit_status = None

            # ==================================================
            # Calculate Entitled / Unclaimed
            # ==================================================

            if entitlement_type == "AVAILABILITY":

                entitled = 0.0
                unclaimed = 0.0

            else:

                entitled = float(
                    monthly_quantity or 0
                )

                unclaimed = (
                    entitled - claimed
                )

                if unclaimed < 0:

                    unclaimed = 0.0

            # ==================================================
            # Return Status
            # ==================================================

            if unclaimed <= 0:

                return_status = (
                    "No Return Required"
                )

            elif returned_to_warehouse:

                return_status = "Returned"

            else:

                return_status = (
                    "Pending Return"
                )

            # ==================================================
            # Audit Status
            # ==================================================

            if stored_audit_status:

                audit_status = (
                    stored_audit_status
                )

            else:

                audit_status = return_status

            # ==================================================
            # Add History
            # ==================================================

            history.append({

                "audit_id":
                    audit_id,

                "month":
                    month,

                "year":
                    year,

                "item_id":
                    item_id,

                "item_name":
                    item_name,

                "entitled_quantity":
                    entitled,

                "claimed_quantity":
                    claimed,

                "unclaimed_quantity":
                    unclaimed,

                "warehouse_returned_quantity":
                    returned,

                "returned_quantity":
                    returned,

                "returned_to_warehouse":
                    returned_to_warehouse,

                "audit_status":
                    audit_status,

                "verification_status":
                    verification_status,

                "return_status":
                    return_status,

                "entitlement_type":
                    entitlement_type,

                "base_entitlement":
                    base_quantity

            })

        # ==================================================
        # Return
        # ==================================================

        return jsonify(history), 200

    except Exception as e:

        return jsonify({

            "message":
                "Unable to load beneficiary history.",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:

            cursor.close()

        if conn:

            conn.close()