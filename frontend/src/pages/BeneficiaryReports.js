import { useEffect, useState } from "react";
import axios from "axios";
import BeneficiaryLayout from "../components/BeneficiaryLayout";
import "../styles/BeneficiaryReports.css";


function BeneficiaryReports() {

    const today = new Date();

    const [month, setMonth] = useState(
        today.getMonth() + 1
    );

    const [year, setYear] = useState(
        today.getFullYear()
    );

    const [loading, setLoading] = useState(true);

    const [verificationReport, setVerificationReport] =
        useState({
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            quarter: "",
            quarter_start_month: 0,
            quarter_end_month: 0,
            is_quarter_end: false,
            verification_status: "NOT VERIFIED",

            total_entitled: 0,
            total_claimed: 0,
            total_unclaimed: 0,
            total_returned: 0,

            items: []
        });


    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];


    // ==========================================
    // FORMAT QUANTITY
    // ==========================================

    const formatQuantity = (value) => {

        const number = Number(value || 0);

        return number.toFixed(2);
    };


    // ==========================================
    // GET ITEM
    // ==========================================

    const getItem = (name) => {

        return (
            verificationReport.items || []
        ).find(
            item =>
                String(item.item_name || "")
                    .trim()
                    .toLowerCase() === name
        );
    };


    // ==========================================
    // LOAD SHOP-WIDE REPORT
    // ==========================================

    useEffect(() => {

        loadVerificationReport();

    }, [month, year]);


    const loadVerificationReport = async () => {

        setLoading(true);

        try {

            const response = await axios.get(
                "http://127.0.0.1:5000/monthly-verification-report",
                {
                    params: {
                        month: month,
                        year: year
                    }
                }
            );


            console.log(
                "BENEFICIARY SHOP REPORT:",
                response.data
            );


            setVerificationReport(
                response.data
            );

        }

        catch (error) {

            console.log(
                "Beneficiary report error:",
                error
            );


            setVerificationReport({

                month: month,

                year: year,

                quarter: "",

                quarter_start_month: 0,

                quarter_end_month: 0,

                is_quarter_end: false,

                verification_status:
                    "NOT VERIFIED",

                total_entitled: 0,

                total_claimed: 0,

                total_unclaimed: 0,

                total_returned: 0,

                items: []

            });

        }

        finally {

            setLoading(false);

        }
    };


    // ==========================================
    // ITEMS
    // ==========================================

    const rice = getItem("rice");

    const wheat = getItem("wheat");

    const sugar = getItem("sugar");

    const kerosene = getItem("kerosene");


    // ==========================================
    // VERIFICATION STATUS
    // ==========================================

    const verificationStatus =
        verificationReport.verification_status ||
        "NOT VERIFIED";


    const isVerified =
        verificationStatus === "VERIFIED";


    // ==========================================
    // QUARTER STATUS
    // ==========================================

    const quarterStatus =
        verificationReport.is_quarter_end
            ? "QUARTER END"
            : "QUARTER OPEN";


    // ==========================================
    // LOADING
    // ==========================================

    if (loading) {

        return (

            <BeneficiaryLayout>

                <div className="beneficiary-reports-page">

                    <div className="beneficiary-reports-header">

                        <p className="reports-page-label">
                            Beneficiary Portal
                        </p>

                        <h1>
                            Monthly Reports
                        </h1>

                        <p className="reports-page-subtitle">
                            View the ration shop's consolidated
                            entitlement and verification report.
                        </p>

                    </div>


                    <div className="reports-loading">

                        <div className="reports-loading-spinner">
                        </div>

                        <span>
                            Loading monthly report...
                        </span>

                    </div>

                </div>

            </BeneficiaryLayout>

        );

    }


    // ==========================================
    // PAGE
    // ==========================================

    return (

        <BeneficiaryLayout>

            <div className="beneficiary-reports-page">


                {/* ==========================================
                    PAGE HEADER
                ========================================== */}

                <div className="beneficiary-reports-header">

                    <p className="reports-page-label">
                        Beneficiary Portal
                    </p>

                    <h1>
                        Monthly Reports
                    </h1>

                    <p className="reports-page-subtitle">
                        View the ration shop's consolidated
                        entitlement and verification report.
                    </p>

                </div>



                {/* ==========================================
                    MAIN REPORT
                ========================================== */}

                <div className="beneficiary-report-section">


                    {/* ======================================
                        SECTION HEADER
                    ====================================== */}

                    <div className="beneficiary-section-header">

                        <div>

                            <h2>
                                Entitlement Verification
                            </h2>

                            <p>
                                Monthly verification for Rice
                                and Wheat, and quarterly
                                verification for Sugar
                                and Kerosene.
                            </p>

                        </div>

                    </div>



                    {/* ======================================
                        MONTH / YEAR FILTER
                    ====================================== */}

                    <div className="beneficiary-report-filter">


                        <div className="beneficiary-filter-group">

                            <label>
                                Month
                            </label>

                            <select
                                value={month}
                                onChange={(e) =>
                                    setMonth(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                            >

                                {
                                    monthNames.map(
                                        (name, index) => (

                                            <option
                                                key={index}
                                                value={index + 1}
                                            >
                                                {name}
                                            </option>

                                        )
                                    )
                                }

                            </select>

                        </div>



                        <div className="beneficiary-filter-group">

                            <label>
                                Year
                            </label>

                            <input
                                type="number"
                                value={year}
                                onChange={(e) =>
                                    setYear(
                                        Number(
                                            e.target.value
                                        )
                                    )
                                }
                            />

                        </div>

                    </div>



                    {/* ======================================
                        REPORT PERIOD / STATUS
                    ====================================== */}

                    <div className="beneficiary-verification-header">


                        <div className="beneficiary-verification-period">

                            <span>
                                Report Period
                            </span>

                            <strong>

                                {
                                    monthNames[
                                        verificationReport.month - 1
                                    ]
                                }

                                {" "}

                                {
                                    verificationReport.year
                                }

                            </strong>

                        </div>



                        <div className="beneficiary-verification-period">

                            <span>
                                Quarter
                            </span>

                            <strong>
                                {
                                    verificationReport.quarter ||
                                    "-"
                                }
                            </strong>

                        </div>



                        <div className="beneficiary-verification-period">

                            <span>
                                Quarter Status
                            </span>

                            <strong>
                                {
                                    quarterStatus
                                }
                            </strong>

                        </div>



                        <div className="beneficiary-verification-status">

                            <span>
                                Verification Status
                            </span>

                            <strong
                                className={
                                    isVerified
                                        ? "verified"
                                        : "not-verified"
                                }
                            >

                                {
                                    isVerified
                                        ? "✓ VERIFIED"
                                        : `⚠ ${verificationStatus}`
                                }

                            </strong>

                        </div>

                    </div>



                    {/* ======================================
                        QUARTERLY INFORMATION
                    ====================================== */}

                    <div className="beneficiary-quarter-info">

                        <strong>
                            Sugar & Kerosene:
                        </strong>

                        {" "}

                        {
                            verificationReport.is_quarter_end

                                ?

                                "Quarter has ended. Sugar and Kerosene are now eligible for warehouse return and verification."

                                :

                                "Quarter is still open. Sugar and Kerosene can be collected during the quarter and are audited for return only at quarter end."
                        }

                    </div>



                    {/* ======================================
                        SUMMARY CARDS
                    ====================================== */}

                    <div className="beneficiary-verification-summary">


                        {/* RICE */}

                        <div className="beneficiary-verification-card">

                            <h2>

                                {
                                    formatQuantity(
                                        rice?.total_entitled
                                    )
                                }

                                {" kg"}

                            </h2>

                            <p>
                                Rice Entitled
                            </p>

                        </div>



                        {/* WHEAT */}

                        <div className="beneficiary-verification-card">

                            <h2>

                                {
                                    formatQuantity(
                                        wheat?.total_entitled
                                    )
                                }

                                {" kg"}

                            </h2>

                            <p>
                                Wheat Entitled
                            </p>

                        </div>



                        {/* SUGAR */}

                        <div className="beneficiary-verification-card">

                            <h2>

                                {
                                    formatQuantity(
                                        sugar?.total_entitled
                                    )
                                }

                                {" kg"}

                            </h2>

                            <p>
                                Sugar Qtr. Entitlement
                            </p>

                        </div>



                        {/* KEROSENE */}

                        <div className="beneficiary-verification-card">

                            <h2>

                                {
                                    formatQuantity(
                                        kerosene?.total_entitled
                                    )
                                }

                                {" "}

                                {
                                    kerosene?.unit ||
                                    "Litre"
                                }

                            </h2>

                            <p>
                                Kerosene Qtr. Entitlement
                            </p>

                        </div>

                    </div>



                    {/* ======================================
                        TRANSPARENCY TABLE
                    ====================================== */}

                    <div className="beneficiary-report-table-wrapper">

                        <table className="beneficiary-report-table">

                            <thead>

                                <tr>

                                    <th>
                                        Item
                                    </th>

                                    <th>
                                        Period
                                    </th>

                                    <th>
                                        Total Entitled
                                    </th>

                                    <th>
                                        Total Claimed
                                    </th>

                                    <th>
                                        Unclaimed
                                    </th>

                                    <th>
                                        Returned
                                    </th>

                                    <th>
                                        Status
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {
                                    verificationReport.items &&
                                    verificationReport.items.length > 0

                                        ?

                                        verificationReport.items.map(
                                            (item, index) => {

                                                const status =
                                                    item.status ||
                                                    "NOT VERIFIED";


                                                let statusClass =
                                                    "status-pending";


                                                if (
                                                    status ===
                                                    "VERIFIED"
                                                ) {

                                                    statusClass =
                                                        "status-verified";

                                                }

                                                else if (
                                                    status ===
                                                    "NO RETURN REQUIRED"
                                                ) {

                                                    statusClass =
                                                        "status-complete";

                                                }

                                                else if (
                                                    status ===
                                                    "READY FOR VERIFICATION"
                                                ) {

                                                    statusClass =
                                                        "status-ready";

                                                }

                                                else if (
                                                    status ===
                                                    "QUARTER OPEN"
                                                ) {

                                                    statusClass =
                                                        "status-open";

                                                }


                                                return (

                                                    <tr
                                                        key={
                                                            item.item_id ||
                                                            index
                                                        }
                                                    >

                                                        <td>

                                                            <strong>
                                                                {
                                                                    item.item_name
                                                                }
                                                            </strong>

                                                        </td>


                                                        <td>

                                                            {
                                                                item.period ||
                                                                "-"
                                                            }

                                                        </td>


                                                        <td>

                                                            {
                                                                formatQuantity(
                                                                    item.total_entitled
                                                                )
                                                            }

                                                            {" "}

                                                            {
                                                                item.unit ||
                                                                "kg"
                                                            }

                                                        </td>


                                                        <td>

                                                            {
                                                                formatQuantity(
                                                                    item.total_claimed
                                                                )
                                                            }

                                                            {" "}

                                                            {
                                                                item.unit ||
                                                                "kg"
                                                            }

                                                        </td>


                                                        <td>

                                                            {
                                                                formatQuantity(
                                                                    item.total_unclaimed
                                                                )
                                                            }

                                                            {" "}

                                                            {
                                                                item.unit ||
                                                                "kg"
                                                            }

                                                        </td>


                                                        <td>

                                                            {
                                                                formatQuantity(
                                                                    item.total_returned
                                                                )
                                                            }

                                                            {" "}

                                                            {
                                                                item.unit ||
                                                                "kg"
                                                            }

                                                        </td>


                                                        <td>

                                                            <span
                                                                className={
                                                                    `beneficiary-table-status ${statusClass}`
                                                                }
                                                            >

                                                                {
                                                                    status ===
                                                                    "VERIFIED"

                                                                        ?

                                                                        "✓ Verified"

                                                                        :

                                                                        status
                                                                }

                                                            </span>

                                                        </td>

                                                    </tr>

                                                );

                                            }
                                        )

                                        :

                                        <tr>

                                            <td
                                                colSpan="7"
                                                className="beneficiary-empty-state"
                                            >

                                                No entitlement records
                                                were found for this period.

                                            </td>

                                        </tr>
                                }

                            </tbody>

                        </table>

                    </div>



                    {/* ======================================
                        TRANSPARENCY INFORMATION
                    ====================================== */}

                    <div className="beneficiary-report-footer-info">


                        <div>

                            <strong>
                                Inventory Update
                            </strong>

                            <span>
                                Returned stock is added back
                                to inventory only after
                                warehouse manager verification.
                            </span>

                        </div>



                        <div>

                            <strong>
                                Rice / Wheat
                            </strong>

                            <span>
                                Audited and returned at the
                                end of every month.
                            </span>

                        </div>



                        <div>

                            <strong>
                                Sugar / Kerosene
                            </strong>

                            <span>
                                Audited and returned only at
                                quarter end.
                            </span>

                        </div>

                    </div>


                </div>



                {/* ==========================================
                    FOOTER
                ========================================== */}

                <div className="beneficiary-report-generated">

                    Report generated on{" "}

                    {
                        new Date().toLocaleString()
                    }

                </div>


            </div>

        </BeneficiaryLayout>

    );

}


export default BeneficiaryReports;