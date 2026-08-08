from flask import Blueprint, request, jsonify
from db import get_connection
from business_date import get_business_date


distribution_bp = Blueprint("distribution", __name__)


@distribution_bp.route("/distribution", methods=["POST"])
def distribute():

    data = request.get_json() or {}

    # ---------------------------------
    # Get Request Data
    # ---------------------------------

    beneficiary_id = data.get("beneficiary_id")
    item_id = data.get("item_id")
    quantity_value = data.get("quantity_given")
    distributed_by = data.get("distributed_by")

    # ---------------------------------
    # Basic Validation
    # ---------------------------------

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
            "message": "Quantity must be greater than zero."
        }), 400

    if not distributed_by:

        return jsonify({
            "message": "Distributor information is required."
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
                    "Distribution for this month has already been closed."
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
                "message": "Beneficiary not found."
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
                item_name
            FROM ration_items
            WHERE item_id = %s
        """, (
            item_id,
        ))

        item = cursor.fetchone()

        if item is None:

            return jsonify({
                "message": "Ration item not found."
            }), 404

        item_name = item["item_name"]

        # ==================================================
        # ONLY RICE AND WHEAT
        # ==================================================

        if item_name.lower() not in ("rice", "wheat"):

            return jsonify({
                "message":
                    "Only Rice and Wheat are supported for distribution."
            }), 400

        # ==================================================
        # CHECK 3
        # STOCK ALREADY RETURNED?
        # ==================================================

        cursor.execute("""
            SELECT
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
            current_month,
            current_year
        ))

        audit = cursor.fetchone()

        if audit and audit["audit_status"] == "Returned":

            return jsonify({
                "message":
                    "Distribution not allowed. "
                    "Unclaimed stock has already been returned "
                    "to the warehouse."
            }), 400

        # ==================================================
        # GET ENTITLEMENT RULE
        # ==================================================

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

        entitlement = cursor.fetchone()

        # ==================================================
        # NPNS SPECIAL CASE
        #
        # NPNS is availability based and therefore does
        # not have a fixed monthly entitlement.
        # ==================================================

        if category_name.upper() == "NPNS":

            entitlement_type = "AVAILABILITY"

            base_quantity = 0.0

            monthly_quantity = None

        else:

            if entitlement is None:

                return jsonify({
                    "message":
                        "No entitlement rule found for "
                        "this category and item."
                }), 400

            base_quantity = float(
                entitlement["monthly_quantity"] or 0
            )

            entitlement_type = (
                entitlement["entitlement_type"]
            )

            # ==================================================
            # CALCULATE ACTUAL MONTHLY ENTITLEMENT
            # ==================================================

            if entitlement_type == "PERSON":

                monthly_quantity = (
                    base_quantity *
                    family_members
                )

            elif entitlement_type == "HOUSEHOLD":

                monthly_quantity = base_quantity

            else:

                return jsonify({
                    "message":
                        "Invalid entitlement type configured "
                        "for this category and item."
                }), 400

        # ==================================================
        # ALREADY CLAIMED THIS MONTH
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
        # FIXED ENTITLEMENT CATEGORIES
        #
        # AAY
        # Rice  = 28 kg / household
        # Wheat = 7 kg / household
        #
        # PHH
        # Rice  = 4 kg / person
        # Wheat = 1 kg / person
        #
        # NPS
        # Rice  = 2 kg / person
        # Wheat = 1 kg / person
        # ==================================================

        if entitlement_type != "AVAILABILITY":

            remaining = (
                monthly_quantity - claimed
            )

            if remaining < 0:
                remaining = 0.0

            # ---------------------------------------------
            # Prevent Over Claim
            # ---------------------------------------------

            if quantity > remaining:

                return jsonify({

                    "message":
                        f"Only {remaining:.2f} kg remains "
                        f"for this month.",

                    "category":
                        category_name,

                    "item":
                        item_name,

                    "monthly_entitlement":
                        monthly_quantity,

                    "already_claimed":
                        claimed,

                    "remaining":
                        remaining

                }), 400

        else:

            # ==================================================
            # NPNS
            #
            # No fixed entitlement.
            # Quantity is limited only by available stock.
            # ==================================================

            remaining = None

        # ==================================================
        # INVENTORY CHECK
        # ==================================================

        cursor.execute("""
            SELECT
                available_quantity
            FROM inventory
            WHERE item_id = %s
        """, (
            item_id,
        ))

        inventory = cursor.fetchone()

        if inventory is None:

            return jsonify({
                "message": "Inventory not found."
            }), 404

        available_quantity = float(
            inventory["available_quantity"] or 0
        )

        if available_quantity < quantity:

            return jsonify({

                "message":
                    "Insufficient inventory.",

                "available_quantity":
                    available_quantity,

                "requested_quantity":
                    quantity

            }), 400

        # ==================================================
        # REDUCE INVENTORY
        # ==================================================

        cursor.execute("""
            UPDATE inventory
            SET available_quantity =
                available_quantity - %s
            WHERE item_id = %s
        """, (
            quantity,
            item_id
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
        # UPDATE AUDIT
        # ==================================================

        new_claimed = claimed + quantity

        if entitlement_type == "AVAILABILITY":

            # NPNS has no predetermined entitlement.
            #
            # For audit purposes, the quantity actually
            # claimed is recorded as the entitlement used
            # for that distribution cycle.

            audit_entitled = new_claimed
            new_unclaimed = 0.0

        else:

            audit_entitled = monthly_quantity

            new_unclaimed = (
                monthly_quantity -
                new_claimed
            )

            if new_unclaimed < 0:
                new_unclaimed = 0.0

        # ==================================================
        # CHECK EXISTING AUDIT RECORD
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
        # COMMIT
        # ==================================================

        conn.commit()

        # ==================================================
        # RESPONSE
        # ==================================================

        if entitlement_type == "AVAILABILITY":

            remaining_after_distribution = None

        else:

            remaining_after_distribution = (
                new_unclaimed
            )

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

            "family_members":
                family_members,

            "entitlement_type":
                entitlement_type,

            "base_entitlement":
                base_quantity,

            "monthly_entitlement":
                monthly_quantity,

            "already_claimed":
                claimed,

            "quantity_given":
                quantity,

            "remaining_after_distribution":
                remaining_after_distribution

        }), 201

    except Exception as e:

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