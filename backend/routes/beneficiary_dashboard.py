from flask import Blueprint, request, jsonify
from db import get_connection
from business_date import get_business_date


beneficiary_dashboard_bp = Blueprint(
    "beneficiary_dashboard",
    __name__
)


# ==================================================
# Helper:
# Calculate Correct Entitlement
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
            "entitlement_period": "MONTHLY",
            "base_quantity": None
        }

    # ---------------------------------
    # Get rule for this exact category
    # and exact item
    # ---------------------------------

    cursor.execute("""
        SELECT
            monthly_quantity,
            entitlement_type,
            entitlement_period
        FROM entitlement_rules
        WHERE category_id = %s
        AND item_id = %s
        ORDER BY entitlement_id DESC
        LIMIT 1
    """, (
        category_id,
        item_id
    ))

    rule = cursor.fetchone()

    # ---------------------------------
    # No rule found
    # ---------------------------------

    if not rule:

        return {
            "monthly_quantity": 0.0,
            "entitlement_type": "NONE",
            "entitlement_period": "MONTHLY",
            "base_quantity": 0.0
        }

    base_quantity = float(
        rule["monthly_quantity"] or 0
    )

    entitlement_type = (
        rule["entitlement_type"] or ""
    ).upper()

    entitlement_period = (
        rule["entitlement_period"] or
        "MONTHLY"
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
        "monthly_quantity":
            monthly_quantity,

        "entitlement_type":
            entitlement_type,

        "entitlement_period":
            entitlement_period,

        "base_quantity":
            base_quantity
    }


# ==================================================
# Helper:
# Get Ration Items
#
# Includes:
# Rice
# Wheat
# Sugar
# Kerosene
# ==================================================

def get_ration_items(cursor):

    cursor.execute("""
        SELECT
            item_id,
            item_name,
            unit
        FROM ration_items

        WHERE LOWER(TRIM(item_name)) IN (
            'rice',
            'wheat',
            'sugar',
            'kerosene'
        )

        ORDER BY
            CASE

                WHEN LOWER(TRIM(item_name)) = 'rice'
                    THEN 1

                WHEN LOWER(TRIM(item_name)) = 'wheat'
                    THEN 2

                WHEN LOWER(TRIM(item_name)) = 'sugar'
                    THEN 3

                WHEN LOWER(TRIM(item_name)) = 'kerosene'
                    THEN 4

                ELSE 5

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
        # Includes all four supported items:
        #
        # 1. Rice
        # 2. Wheat
        # 3. Sugar
        # 4. Kerosene
        #
        # LEFT JOIN is used so that an item still appears
        # even if an inventory record has not been created.
        # In that case it is treated as 0 / Out of Stock.
        # ==================================================

        cursor.execute("""
            SELECT
                ri.item_id,
                ri.item_name,
                ri.unit,

                COALESCE(
                    i.available_quantity,
                    0
                ) AS available_quantity,

                COALESCE(
                    i.minimum_stock,
                    0
                ) AS minimum_stock,

                CASE

                    WHEN COALESCE(
                        i.available_quantity,
                        0
                    ) = 0

                        THEN 'Out of Stock'

                    WHEN COALESCE(
                        i.available_quantity,
                        0
                    ) <= COALESCE(
                        i.minimum_stock,
                        0
                    )

                        THEN 'Low Stock'

                    ELSE 'Available'

                END AS stock_status

            FROM ration_items ri

            LEFT JOIN inventory i
                ON i.item_id = ri.item_id

            WHERE LOWER(TRIM(ri.item_name))
                IN (
                    'rice',
                    'wheat',
                    'sugar',
                    'kerosene'
                )

            ORDER BY
                CASE

                    WHEN LOWER(TRIM(ri.item_name)) = 'rice'
                        THEN 1

                    WHEN LOWER(TRIM(ri.item_name)) = 'wheat'
                        THEN 2

                    WHEN LOWER(TRIM(ri.item_name)) = 'sugar'
                        THEN 3

                    WHEN LOWER(TRIM(ri.item_name)) = 'kerosene'
                        THEN 4

                    ELSE 5

                END
        """)

        stock = cursor.fetchall()

        # ==================================================
        # Get All Supported Ration Items
        #
        # Rice
        # Wheat
        # Sugar
        # Kerosene
        # ==================================================

        ration_items = get_ration_items(cursor)

        monthly_history = []

        # ==================================================
        # PROCESS EACH ITEM
        # ==================================================

        for item in ration_items:

            item_id = item["item_id"]

            item_name = item["item_name"]

            item_unit = (
                item["unit"] or "kg"
            )

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
                entitlement[
                    "monthly_quantity"
                ]
            )

            entitlement_type = (
                entitlement[
                    "entitlement_type"
                ]
            )

            entitlement_period = (
                entitlement[
                    "entitlement_period"
                ]
            )

            base_quantity = (
                entitlement[
                    "base_quantity"
                ]
            )

            # ==================================================
            # Actual Claimed Quantity
            #
            # Use distributions instead of old audit
            # claimed values.
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
                claimed_result[
                    "claimed_quantity"
                ] or 0
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

                entitled = 0.0

                unclaimed = 0.0

            else:

                entitled = float(
                    monthly_quantity or 0
                )

                unclaimed = (
                    entitled -
                    claimed
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

                "unit":
                    item_unit,

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

                "entitlement_period":
                    entitlement_period,

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
    #
    # Defaults to current business month/year.
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
        # Get All Supported Ration Items
        #
        # Rice
        # Wheat
        # Sugar
        # Kerosene
        # ==================================================

        ration_items = get_ration_items(cursor)

        history = []

        # ==================================================
        # PROCESS ALL ITEMS SEPARATELY
        # ==================================================

        for item in ration_items:

            item_id = item["item_id"]

            item_name = item["item_name"]

            item_unit = (
                item["unit"] or "kg"
            )

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
                entitlement[
                    "monthly_quantity"
                ]
            )

            entitlement_type = (
                entitlement[
                    "entitlement_type"
                ]
            )

            entitlement_period = (
                entitlement[
                    "entitlement_period"
                ]
            )

            base_quantity = (
                entitlement[
                    "base_quantity"
                ]
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
                claimed_result[
                    "claimed_quantity"
                ] or 0
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
                    entitled -
                    claimed
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

                "unit":
                    item_unit,

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

                "entitlement_period":
                    entitlement_period,

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