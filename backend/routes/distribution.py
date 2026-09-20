from flask import Blueprint, request, jsonify
from db import get_connection
from business_date import get_business_date


distribution_bp = Blueprint("distribution", __name__)


@distribution_bp.route("/distribution", methods=["POST"])
def distribute():

    data = request.get_json() or {}

    # ==================================================
    # GET REQUEST DATA
    # ==================================================

    beneficiary_id = data.get("beneficiary_id")
    item_id = data.get("item_id")
    quantity_value = data.get("quantity_given")
    distributed_by = data.get("distributed_by")

    # ==================================================
    # BASIC VALIDATION
    # ==================================================

    if not beneficiary_id:
        return jsonify({
            "message": "Beneficiary ID is required."
        }), 400

    if not item_id:
        return jsonify({
            "message": "Item ID is required."
        }), 400

    if quantity_value is None:
        return jsonify({
            "message": "Quantity is required."
        }), 400

    try:
        quantity = float(quantity_value)

    except (TypeError, ValueError):

        return jsonify({
            "message": "Invalid quantity."
        }), 400

    if quantity <= 0:

        return jsonify({
            "message":
                "Quantity must be greater than zero."
        }), 400

    if not distributed_by:

        return jsonify({
            "message":
                "Distributor information is required."
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    try:

        # ==================================================
        # BUSINESS DATE
        # ==================================================

        today = get_business_date()

        current_month = today.month
        current_year = today.year

        # ==================================================
        # CHECK 1
        # MONTH CLOSED?
        # ==================================================

        cursor.execute("""
            SELECT closure_id
            FROM monthly_closure
            WHERE month = %s
            AND year = %s
        """, (
            current_month,
            current_year
        ))

        month_closed = cursor.fetchone()

        if month_closed:

            return jsonify({
                "message":
                    "Distribution for this month has "
                    "already been closed."
            }), 400

        # ==================================================
        # CHECK 2
        # BENEFICIARY
        # ==================================================

        cursor.execute("""
            SELECT
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

        if beneficiary is None:

            return jsonify({
                "message":
                    "Beneficiary not found."
            }), 404

        category_id = beneficiary["category_id"]
        category_name = beneficiary["category_name"]

        family_members = int(
            beneficiary["family_members"] or 0
        )

        # ==================================================
        # VALIDATE FAMILY MEMBERS
        # ==================================================

        if family_members <= 0:

            return jsonify({
                "message":
                    "Invalid family member count."
            }), 400

        # ==================================================
        # GET RATION ITEM
        # ==================================================

        cursor.execute("""
            SELECT
                item_id,
                item_name,
                unit,
                subsidy_price
            FROM ration_items
            WHERE item_id = %s
        """, (
            item_id,
        ))

        item = cursor.fetchone()

        if item is None:

            return jsonify({
                "message":
                    "Ration item not found."
            }), 404

        item_name = item["item_name"]
        unit = item["unit"]

        # ==================================================
        # GET ENTITLEMENT RULE
        #
        # entitlement_rules is the source of truth for:
        #
        # - Item eligibility
        # - Quantity
        # - Entitlement type
        # - Entitlement period
        # - Category-specific price
        # ==================================================

        cursor.execute("""
            SELECT
                monthly_quantity,
                entitlement_type,
                entitlement_period,
                unit_price
            FROM entitlement_rules
            WHERE category_id = %s
            AND item_id = %s
            ORDER BY entitlement_id DESC
            LIMIT 1
        """, (
            category_id,
            item_id
        ))

        entitlement = cursor.fetchone()

        # ==================================================
        # ENTITLEMENT RULE MUST EXIST
        #
        # No rule means the item is not allowed for
        # this card category.
        # ==================================================

        if entitlement is None:

            return jsonify({
                "message":
                    f"{item_name} is not entitled for "
                    f"{category_name} card.",
                "category":
                    category_name,
                "item":
                    item_name
            }), 400

        # ==================================================
        # READ ENTITLEMENT CONFIGURATION
        # ==================================================

        base_quantity = float(
            entitlement["monthly_quantity"] or 0
        )

        entitlement_type = (
            entitlement["entitlement_type"] or
            "HOUSEHOLD"
        )

        entitlement_period = (
            entitlement["entitlement_period"] or
            "MONTHLY"
        )

        entitlement_type = entitlement_type.upper()
        entitlement_period = entitlement_period.upper()

        # ==================================================
        # CATEGORY-SPECIFIC UNIT PRICE
        #
        # Existing AAY/PHH/NPS rules were configured as
        # 0.00, while White Card rules have their own
        # configured prices.
        # ==================================================

        unit_price = float(
            entitlement["unit_price"] or 0
        )

        # ==================================================
        # CALCULATE BASE ENTITLEMENT
        #
        # PERSON:
        # quantity × number of family members
        #
        # HOUSEHOLD:
        # fixed quantity per household
        # ==================================================

        if entitlement_type == "PERSON":

            base_entitlement = (
                base_quantity *
                family_members
            )

        elif entitlement_type == "HOUSEHOLD":

            base_entitlement = base_quantity

        else:

            return jsonify({
                "message":
                    "Invalid entitlement type configured "
                    "for this category and item."
            }), 400

        # ==================================================
        # DETERMINE ALLOWED PERIOD
        # ==================================================

        if entitlement_period == "QUARTERLY":

            allowed_quantity = base_entitlement

        elif entitlement_period == "MONTHLY":

            allowed_quantity = base_entitlement

        else:

            return jsonify({
                "message":
                    "Invalid entitlement period configured "
                    "for this category and item."
            }), 400

        # ==================================================
        # CALCULATE CLAIMED QUANTITY
        #
        # MONTHLY:
        # Current month only.
        #
        # QUARTERLY:
        # Entire current quarter.
        # ==================================================

        if entitlement_period == "QUARTERLY":

            # ---------------------------------------------
            # Calculate current quarter
            #
            # Q1 = Jan-Mar
            # Q2 = Apr-Jun
            # Q3 = Jul-Sep
            # Q4 = Oct-Dec
            # ---------------------------------------------

            current_quarter = (
                (current_month - 1) // 3
            ) + 1

            quarter_start_month = (
                (current_quarter - 1) * 3
            ) + 1

            quarter_end_month = (
                quarter_start_month + 2
            )

            cursor.execute("""
                SELECT
                    IFNULL(
                        SUM(quantity_given),
                        0
                    ) AS claimed
                FROM distributions
                WHERE beneficiary_id = %s
                AND item_id = %s
                AND YEAR(distribution_date) = %s
                AND MONTH(distribution_date)
                    BETWEEN %s AND %s
            """, (
                beneficiary_id,
                item_id,
                current_year,
                quarter_start_month,
                quarter_end_month
            ))

            claimed_result = cursor.fetchone()

            claimed = float(
                claimed_result["claimed"] or 0
            )

        else:

            # ==================================================
            # MONTHLY CLAIMED
            # ==================================================

            cursor.execute("""
                SELECT
                    IFNULL(
                        SUM(quantity_given),
                        0
                    ) AS claimed
                FROM distributions
                WHERE beneficiary_id = %s
                AND item_id = %s
                AND MONTH(distribution_date) = %s
                AND YEAR(distribution_date) = %s
            """, (
                beneficiary_id,
                item_id,
                current_month,
                current_year
            ))

            claimed_result = cursor.fetchone()

            claimed = float(
                claimed_result["claimed"] or 0
            )

        # ==================================================
        # CALCULATE REMAINING ENTITLEMENT
        # ==================================================

        remaining = (
            allowed_quantity -
            claimed
        )

        if remaining < 0:

            remaining = 0.0

        # ==================================================
        # PREVENT OVER CLAIM
        # ==================================================

        if quantity > remaining:

            if entitlement_period == "QUARTERLY":

                period_message = "quarter"

            else:

                period_message = "month"

            return jsonify({

                "message":
                    f"Only {remaining:.2f} "
                    f"{unit.lower()} remains for "
                    f"this {period_message}.",

                "category":
                    category_name,

                "item":
                    item_name,

                "entitlement_period":
                    entitlement_period,

                "entitlement_type":
                    entitlement_type,

                "entitlement":
                    allowed_quantity,

                "already_claimed":
                    claimed,

                "remaining":
                    remaining

            }), 400

        # ==================================================
        # INVENTORY CHECK
        # ==================================================

        cursor.execute("""
            SELECT
                inventory_id,
                available_quantity
            FROM inventory
            WHERE item_id = %s
            FOR UPDATE
        """, (
            item_id,
        ))

        inventory = cursor.fetchone()

        if inventory is None:

            return jsonify({
                "message":
                    "Inventory not found for this item."
            }), 404

        available_quantity = float(
            inventory["available_quantity"] or 0
        )

        # ==================================================
        # PREVENT NEGATIVE STOCK
        # ==================================================

        if available_quantity < quantity:

            return jsonify({

                "message":
                    "Insufficient inventory.",

                "item":
                    item_name,

                "available_quantity":
                    available_quantity,

                "requested_quantity":
                    quantity

            }), 400

        # ==================================================
        # CALCULATE TOTAL CHARGE
        #
        # Example:
        #
        # White Card Wheat:
        # 2 kg × ₹12 = ₹24
        #
        # AAY/PHH/NPS:
        # configured price = ₹0
        # ==================================================

        total_charge = round(
            quantity * unit_price,
            2
        )

        # ==================================================
        # REDUCE INVENTORY
        # ==================================================

        cursor.execute("""
            UPDATE inventory
            SET available_quantity =
                available_quantity - %s
            WHERE inventory_id = %s
        """, (
            quantity,
            inventory["inventory_id"]
        ))

        # ==================================================
        # SAVE DISTRIBUTION
        # ==================================================

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

        # ==================================================
        # UPDATE AUDIT RECORD
        #
        # The audit remains MONTHLY.
        #
        # For quarterly items, the entitlement check
        # remains quarterly.
        # ==================================================

        new_claimed = claimed + quantity

        if entitlement_period == "QUARTERLY":

            # ---------------------------------------------
            # Quarterly entitlement
            # ---------------------------------------------

            audit_entitled = allowed_quantity

            new_unclaimed = (
                allowed_quantity -
                new_claimed
            )

            if new_unclaimed < 0:

                new_unclaimed = 0.0

        else:

            # ---------------------------------------------
            # Monthly entitlement
            # ---------------------------------------------

            audit_entitled = allowed_quantity

            new_unclaimed = (
                allowed_quantity -
                new_claimed
            )

            if new_unclaimed < 0:

                new_unclaimed = 0.0

        # ==================================================
        # CHECK EXISTING MONTHLY AUDIT RECORD
        # ==================================================

        cursor.execute("""
            SELECT
                audit_id
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
            current_month,
            current_year
        ))

        audit_record = cursor.fetchone()

        # ==================================================
        # UPDATE EXISTING AUDIT
        # ==================================================

        if audit_record:

            cursor.execute("""
                UPDATE unclaimed_audit
                SET
                    entitled_quantity = %s,
                    claimed_quantity = %s,
                    unclaimed_quantity = %s
                WHERE audit_id = %s
            """, (
                audit_entitled,
                new_claimed,
                new_unclaimed,
                audit_record["audit_id"]
            ))

        # ==================================================
        # CREATE MONTHLY AUDIT
        # ==================================================

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
                audit_entitled,
                new_claimed,
                new_unclaimed
            ))

        # ==================================================
        # COMMIT EVERYTHING
        # ==================================================

        conn.commit()

        # ==================================================
        # CALCULATE REMAINING AFTER DISTRIBUTION
        # ==================================================

        remaining_after_distribution = (
            allowed_quantity -
            new_claimed
        )

        if remaining_after_distribution < 0:

            remaining_after_distribution = 0.0

        # ==================================================
        # SUCCESS RESPONSE
        # ==================================================

        return jsonify({

            "message":
                "Distribution successful.",

            "beneficiary_id":
                beneficiary_id,

            "category":
                category_name,

            "item_id":
                item_id,

            "item_name":
                item_name,

            "unit":
                unit,

            "family_members":
                family_members,

            "entitlement_type":
                entitlement_type,

            "entitlement_period":
                entitlement_period,

            "base_entitlement":
                base_quantity,

            "allowed_entitlement":
                allowed_quantity,

            "already_claimed":
                claimed,

            "quantity_given":
                quantity,

            "unit_price":
                unit_price,

            "total_charge":
                total_charge,

            "remaining_after_distribution":
                remaining_after_distribution

        }), 201

    except Exception as e:

        # ==================================================
        # ROLLBACK
        # ==================================================

        conn.rollback()

        return jsonify({

            "message":
                "Distribution failed.",

            "error":
                str(e)

        }), 500

    finally:

        cursor.close()
        conn.close()