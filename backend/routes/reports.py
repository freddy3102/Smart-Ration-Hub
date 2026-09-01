from flask import Blueprint, jsonify, request
from db import get_connection


reports_bp = Blueprint(
    "reports",
    __name__
)


# ==================================================
# Helpers
# ==================================================

def get_quarter(month):

    if month in (1, 2, 3):
        return 1

    if month in (4, 5, 6):
        return 2

    if month in (7, 8, 9):
        return 3

    return 4


def get_quarter_start(month):

    quarter = get_quarter(month)

    return ((quarter - 1) * 3) + 1


def get_quarter_end(month):

    return get_quarter_start(month) + 2


def is_quarter_end(month):

    return month in (3, 6, 9, 12)


# ==================================================
# MONTHLY / QUARTERLY VERIFICATION REPORT
# ==================================================

@reports_bp.route(
    "/monthly-verification-report",
    methods=["GET"]
)
def monthly_verification_report():

    conn = None
    cursor = None

    try:

        # ==================================================
        # INPUT
        # ==================================================

        month = request.args.get(
            "month",
            type=int
        )

        year = request.args.get(
            "year",
            type=int
        )

        if month is None or year is None:

            return jsonify({
                "message":
                    "Month and Year are required."
            }), 400

        if month < 1 or month > 12:

            return jsonify({
                "message":
                    "Invalid month."
            }), 400

        # ==================================================
        # QUARTER INFORMATION
        # ==================================================

        quarter = get_quarter(month)

        quarter_start = get_quarter_start(month)

        quarter_end = get_quarter_end(month)

        quarter_ended = is_quarter_end(month)

        # ==================================================
        # DATABASE
        # ==================================================

        conn = get_connection()

        cursor = conn.cursor(
            dictionary=True
        )

        # ==================================================
        # SELECTED MONTH CLOSURE
        #
        # Used for Rice / Wheat.
        # ==================================================

        cursor.execute("""
            SELECT
                closure_id,
                verified,
                verified_by,
                verified_at
            FROM monthly_closure
            WHERE month = %s
            AND year = %s
        """, (
            month,
            year
        ))

        monthly_closure = cursor.fetchone()

        # ==================================================
        # QUARTER-END CLOSURE
        #
        # Used for Sugar / Kerosene.
        #
        # Example:
        #
        # January / February / March
        #                    ↓
        #                  March
        #
        # April / May / June
        #              ↓
        #             June
        #
        # July / August / September
        #                   ↓
        #                September
        #
        # October / November / December
        #                    ↓
        #                 December
        # ==================================================

        cursor.execute("""
            SELECT
                closure_id,
                verified,
                verified_by,
                verified_at
            FROM monthly_closure
            WHERE month = %s
            AND year = %s
        """, (
            quarter_end,
            year
        ))

        quarter_closure = cursor.fetchone()

        # ==================================================
        # LOAD ENTITLEMENT RULES
        #
        # IMPORTANT:
        #
        # Entitlement is calculated CARD-WISE.
        #
        # PERSON:
        #     base quantity × family members
        #
        # HOUSEHOLD:
        #     base quantity
        #
        # Rice / Wheat:
        #     MONTHLY
        #
        # Sugar / Kerosene:
        #     QUARTERLY
        # ==================================================

        cursor.execute("""
            SELECT

                b.beneficiary_id,
                b.family_members,

                r.item_id,
                r.monthly_quantity,
                r.entitlement_type,
                r.entitlement_period,

                ri.item_name,
                ri.unit

            FROM beneficiaries b

            JOIN entitlement_rules r
                ON b.category_id =
                   r.category_id

            JOIN ration_items ri
                ON r.item_id =
                   ri.item_id

            WHERE LOWER(ri.item_name) IN (
                'rice',
                'wheat',
                'sugar',
                'kerosene'
            )

            ORDER BY
                ri.item_name,
                b.beneficiary_id

        """)

        entitlement_rows = cursor.fetchall()

        # ==================================================
        # REPORT ITEM STORAGE
        # ==================================================

        report_items = {}

        # ==================================================
        # PROCESS EACH CARD + ITEM
        # ==================================================

        for row in entitlement_rows:

            item_id = row["item_id"]

            item_name = (
                row["item_name"] or ""
            ).strip()

            item_key = item_name.lower()

            unit = (
                row["unit"] or "kg"
            )

            entitlement_period = (
                row["entitlement_period"]
                or "MONTHLY"
            ).upper()

            entitlement_type = (
                row["entitlement_type"]
                or "HOUSEHOLD"
            ).upper()

            base_quantity = float(
                row["monthly_quantity"] or 0
            )

            family_members = int(
                row["family_members"] or 1
            )

            # ==================================================
            # CARD-WISE ENTITLEMENT
            # ==================================================

            if entitlement_type == "PERSON":

                card_entitlement = (
                    base_quantity *
                    family_members
                )

            else:

                # HOUSEHOLD

                card_entitlement = (
                    base_quantity
                )

            # ==================================================
            # CREATE ITEM RECORD
            # ==================================================

            if item_key not in report_items:

                report_items[item_key] = {

                    "item_id":
                        item_id,

                    "item_name":
                        item_name,

                    "unit":
                        unit,

                    "period":
                        entitlement_period,

                    "total_entitled":
                        0.0,

                    "total_claimed":
                        0.0,

                    "total_unclaimed":
                        0.0,

                    "total_returned":
                        0.0,

                    "status":
                        "NOT VERIFIED"

                }

            # ==================================================
            # ADD CARD ENTITLEMENT
            # ==================================================

            report_items[
                item_key
            ]["total_entitled"] += (
                card_entitlement
            )

            # ==================================================
            # CLAIMED QUANTITY
            # ==================================================

            if entitlement_period == "QUARTERLY":

                # --------------------------------------------------
                # Sugar / Kerosene
                #
                # Claims from the ENTIRE quarter.
                # --------------------------------------------------

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

                    row["beneficiary_id"],

                    item_id,

                    year,

                    quarter_start,

                    quarter_end

                ))

            else:

                # --------------------------------------------------
                # Rice / Wheat
                #
                # Claims from selected month only.
                # --------------------------------------------------

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

                    row["beneficiary_id"],

                    item_id,

                    month,

                    year

                ))

            claimed_result = cursor.fetchone()

            claimed = float(
                claimed_result["claimed"] or 0
            )

            # ==================================================
            # UNCLAIMED
            # ==================================================

            unclaimed = (
                card_entitlement -
                claimed
            )

            if unclaimed < 0:

                unclaimed = 0.0

            # ==================================================
            # RETURNED
            # ==================================================

            returned = 0.0

            if entitlement_period == "QUARTERLY":

                # --------------------------------------------------
                # Sugar / Kerosene
                #
                # Returned ONLY from quarter-end audit.
                #
                # Example:
                # Q4 → December audit
                # --------------------------------------------------

                cursor.execute("""
                    SELECT
                        IFNULL(
                            SUM(
                                warehouse_returned_quantity
                            ),
                            0
                        ) AS returned

                    FROM unclaimed_audit

                    WHERE beneficiary_id = %s

                    AND item_id = %s

                    AND month = %s

                    AND year = %s

                    AND returned_to_warehouse = TRUE

                    AND audit_status = 'Returned'

                """, (

                    row["beneficiary_id"],

                    item_id,

                    quarter_end,

                    year

                ))

            else:

                # --------------------------------------------------
                # Rice / Wheat
                #
                # Returned from selected monthly audit.
                # --------------------------------------------------

                cursor.execute("""
                    SELECT
                        IFNULL(
                            SUM(
                                warehouse_returned_quantity
                            ),
                            0
                        ) AS returned

                    FROM unclaimed_audit

                    WHERE beneficiary_id = %s

                    AND item_id = %s

                    AND month = %s

                    AND year = %s

                    AND returned_to_warehouse = TRUE

                    AND audit_status = 'Returned'

                """, (

                    row["beneficiary_id"],

                    item_id,

                    month,

                    year

                ))

            returned_result = cursor.fetchone()

            returned = float(
                returned_result["returned"] or 0
            )

            # ==================================================
            # ADD CLAIMED / UNCLAIMED / RETURNED
            # ==================================================

            report_items[
                item_key
            ]["total_claimed"] += (
                claimed
            )

            report_items[
                item_key
            ]["total_unclaimed"] += (
                unclaimed
            )

            report_items[
                item_key
            ]["total_returned"] += (
                returned
            )

        # ==================================================
        # DETERMINE ITEM STATUS
        # ==================================================

        for item_key, item in report_items.items():

            period = (
                item["period"] or "MONTHLY"
            ).upper()

            total_unclaimed = float(
                item["total_unclaimed"]
            )

            total_returned = float(
                item["total_returned"]
            )

            # ==================================================
            # MONTHLY ITEMS
            #
            # Rice / Wheat
            # ==================================================

            if period == "MONTHLY":

                # --------------------------------------------------
                # Month verified
                # --------------------------------------------------

                if (
                    monthly_closure
                    and monthly_closure["verified"]
                ):

                    item["status"] = (
                        "VERIFIED"
                    )

                # --------------------------------------------------
                # Nothing to return
                # --------------------------------------------------

                elif total_unclaimed <= 0:

                    item["status"] = (
                        "NO RETURN REQUIRED"
                    )

                # --------------------------------------------------
                # All unclaimed stock returned
                # --------------------------------------------------

                elif abs(
                    total_unclaimed -
                    total_returned
                ) < 0.0001:

                    item["status"] = (
                        "READY FOR VERIFICATION"
                    )

                # --------------------------------------------------
                # Return still pending
                # --------------------------------------------------

                else:

                    item["status"] = (
                        "PENDING"
                    )

            # ==================================================
            # QUARTERLY ITEMS
            #
            # Sugar / Kerosene
            # ==================================================

            else:

                # --------------------------------------------------
                # Quarter has NOT ended.
                #
                # No warehouse return is expected yet.
                # --------------------------------------------------

                if not quarter_ended:

                    item["status"] = (
                        "QUARTER OPEN"
                    )

                # --------------------------------------------------
                # Quarter ended and verified.
                # --------------------------------------------------

                elif (
                    quarter_closure
                    and quarter_closure["verified"]
                ):

                    item["status"] = (
                        "VERIFIED"
                    )

                # --------------------------------------------------
                # No unclaimed stock.
                # --------------------------------------------------

                elif total_unclaimed <= 0:

                    item["status"] = (
                        "NO RETURN REQUIRED"
                    )

                # --------------------------------------------------
                # All unclaimed stock returned.
                # --------------------------------------------------

                elif abs(
                    total_unclaimed -
                    total_returned
                ) < 0.0001:

                    item["status"] = (
                        "READY FOR VERIFICATION"
                    )

                # --------------------------------------------------
                # Return still pending.
                # --------------------------------------------------

                else:

                    item["status"] = (
                        "PENDING"
                    )

        # ==================================================
        # ORDER ITEMS
        #
        # Rice
        # Wheat
        # Sugar
        # Kerosene
        # ==================================================

        order = [
            "rice",
            "wheat",
            "sugar",
            "kerosene"
        ]

        ordered_items = []

        for item_name in order:

            if item_name in report_items:

                ordered_items.append(
                    report_items[item_name]
                )

        # ==================================================
        # UNIT HELPERS
        # ==================================================

        def is_litre_unit(unit):

            if not unit:
                return False

            return str(unit).strip().lower() in (
                "l",
                "litre",
                "liter",
                "litres",
                "liters"
            )

        # ==================================================
        # TOTALS
        #
        # IMPORTANT:
        #
        # kg and litres must NOT be combined.
        #
        # Therefore these totals contain only
        # kilogram-based items.
        # ==================================================

        total_entitled = 0.0
        total_claimed = 0.0
        total_unclaimed = 0.0
        total_returned = 0.0

        for item in ordered_items:

            if not is_litre_unit(
                item["unit"]
            ):

                total_entitled += float(
                    item["total_entitled"]
                )

                total_claimed += float(
                    item["total_claimed"]
                )

                total_unclaimed += float(
                    item["total_unclaimed"]
                )

                total_returned += float(
                    item["total_returned"]
                )

        # ==================================================
        # LITRE TOTALS
        #
        # Separate totals for kerosene if its
        # unit is litre.
        # ==================================================

        total_entitled_litres = 0.0
        total_claimed_litres = 0.0
        total_unclaimed_litres = 0.0
        total_returned_litres = 0.0

        for item in ordered_items:

            if is_litre_unit(
                item["unit"]
            ):

                total_entitled_litres += float(
                    item["total_entitled"]
                )

                total_claimed_litres += float(
                    item["total_claimed"]
                )

                total_unclaimed_litres += float(
                    item["total_unclaimed"]
                )

                total_returned_litres += float(
                    item["total_returned"]
                )

        # ==================================================
        # OVERALL VERIFICATION STATUS
        # ==================================================

        monthly_items = [

            item

            for item in ordered_items

            if item["period"].upper()
            == "MONTHLY"

        ]

        quarterly_items = [

            item

            for item in ordered_items

            if item["period"].upper()
            == "QUARTERLY"

        ]

        # ==================================================
        # MONTHLY VERIFICATION
        # ==================================================

        monthly_verified = True

        if monthly_items:

            for item in monthly_items:

                if item["status"] not in (
                    "VERIFIED",
                    "NO RETURN REQUIRED"
                ):

                    monthly_verified = False

        # ==================================================
        # QUARTERLY VERIFICATION
        # ==================================================

        quarterly_verified = True

        if quarterly_items:

            if quarter_ended:

                for item in quarterly_items:

                    if item["status"] not in (
                        "VERIFIED",
                        "NO RETURN REQUIRED"
                    ):

                        quarterly_verified = False

            else:

                quarterly_verified = False

        # ==================================================
        # FINAL VERIFICATION STATUS
        # ==================================================

        if (
            monthly_verified
            and quarterly_verified
            and ordered_items
        ):

            verification_status = (
                "VERIFIED"
            )

        elif (
            quarterly_items
            and not quarter_ended
        ):

            verification_status = (
                "QUARTER OPEN"
            )

        else:

            verification_status = (
                "NOT VERIFIED"
            )

        # ==================================================
        # RESPONSE
        # ==================================================

        return jsonify({

            "month":
                month,

            "year":
                year,

            "quarter":
                f"Q{quarter}",

            "quarter_start_month":
                quarter_start,

            "quarter_end_month":
                quarter_end,

            "is_quarter_end":
                quarter_ended,

            "verification_status":
                verification_status,

            # --------------------------------------------------
            # KG totals
            # --------------------------------------------------

            "total_entitled":
                total_entitled,

            "total_claimed":
                total_claimed,

            "total_unclaimed":
                total_unclaimed,

            "total_returned":
                total_returned,

            # --------------------------------------------------
            # Litre totals
            # --------------------------------------------------

            "total_entitled_litres":
                total_entitled_litres,

            "total_claimed_litres":
                total_claimed_litres,

            "total_unclaimed_litres":
                total_unclaimed_litres,

            "total_returned_litres":
                total_returned_litres,

            # --------------------------------------------------
            # Item-wise data
            # --------------------------------------------------

            "items":
                ordered_items

        }), 200

    except Exception as e:

        print(
            "MONTHLY VERIFICATION REPORT ERROR:"
        )

        print(e)

        return jsonify({

            "message":
                "Unable to generate monthly "
                "verification report.",

            "error":
                str(e)

        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()