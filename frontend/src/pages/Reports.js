import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "../styles/Reports.css";

function Reports() {

    const today = new Date();

    const [month, setMonth] = useState(
        today.getMonth() + 1
    );

    const [year, setYear] = useState(
        today.getFullYear()
    );

    const [verificationReport, setVerificationReport] = useState({
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

    // ==================================================
    // FORMAT QUANTITY
    // ==================================================

    const formatQuantity = (value) => {

        const number = Number(value || 0);

        return number.toFixed(2);
    };

    // ==================================================
    // GET ITEM
    // ==================================================

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

    // ==================================================
    // LOAD VERIFICATION REPORT
    // ==================================================

    useEffect(() => {

        loadVerificationReport();

    }, [month, year]);


    const loadVerificationReport = async () => {

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
                "VERIFICATION REPORT:",
                response.data
            );

            setVerificationReport(
                response.data
            );

        } catch (error) {

            console.log(
                "Verification report error:",
                error
            );

            setVerificationReport({
                month,
                year,
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
        }
    };

    // ==================================================
    // ITEMS
    // ==================================================

    const rice = getItem("rice");
    const wheat = getItem("wheat");
    const sugar = getItem("sugar");
    const kerosene = getItem("kerosene");

    // ==================================================
    // VERIFICATION STATUS
    // ==================================================

    const verificationStatus =
        verificationReport.verification_status ||
        "NOT VERIFIED";

    const isVerified =
        verificationStatus === "VERIFIED";

    // ==================================================
    // QUARTER STATUS
    // ==================================================

    const quarterStatus =
        verificationReport.is_quarter_end
            ? "QUARTER END"
            : "QUARTER OPEN";

    // ==================================================
    // RETURN
    // ==================================================

    return (

        <Layout>

            <div className="reports-container">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="reports-header">

                    <h1>
                        Reports Dashboard
                    </h1>

                    <p className="reports-subtitle">

                        View entitlement verification
                        reports.

                    </p>

                </div>


                {/* ==================================================
                    ENTITLEMENT VERIFICATION
                ================================================== */}

                <div
                    className="report-section"
                    id="verification-report"
                >

                    <div className="section-header">

                        <div>

                            <h2>
                                Entitlement Verification
                            </h2>

                            <p>
                                Monthly verification for Rice and Wheat,
                                and quarterly verification for Sugar
                                and Kerosene.
                            </p>

                        </div>

                    </div>


                    {/* ==================================================
                        FILTER
                    ================================================== */}

                    <div className="report-filter">

                        <div className="filter-group">

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


                        <div className="filter-group">

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


                    {/* ==================================================
                        PERIOD / STATUS
                    ================================================== */}

                    <div className="verification-header">

                        <div className="verification-period">

                            <span>
                                Report Period
                            </span>

                            <strong>

                                {
                                    monthNames[
                                        verificationReport.month - 1
                                    ]
                                }{" "}

                                {
                                    verificationReport.year
                                }

                            </strong>

                        </div>


                        <div className="verification-period">

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


                        <div className="verification-period">

                            <span>
                                Quarter Status
                            </span>

                            <strong>

                                {
                                    quarterStatus
                                }

                            </strong>

                        </div>


                        <div className="verification-status">

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


                    {/* ==================================================
                        QUARTERLY INFORMATION
                    ================================================== */}

                    <div className="quarter-info">

                        <strong>
                            Sugar & Kerosene:
                        </strong>{" "}

                        {
                            verificationReport.is_quarter_end

                                ?

                                "Quarter has ended. Sugar and Kerosene are now eligible for warehouse return and verification."

                                :

                                "Quarter is still open. Sugar and Kerosene can be collected during the quarter and are audited for return only at quarter end."

                        }

                    </div>


                    {/* ==================================================
                        SUMMARY CARDS
                    ================================================== */}

                    <div className="verification-summary">

                        <div className="verification-card">

                            <h2>
                                {
                                    formatQuantity(
                                        rice?.total_entitled
                                    )
                                } kg
                            </h2>

                            <p>
                                Rice Entitled
                            </p>

                        </div>


                        <div className="verification-card">

                            <h2>
                                {
                                    formatQuantity(
                                        wheat?.total_entitled
                                    )
                                } kg
                            </h2>

                            <p>
                                Wheat Entitled
                            </p>

                        </div>


                        <div className="verification-card">

                            <h2>
                                {
                                    formatQuantity(
                                        sugar?.total_entitled
                                    )
                                } kg
                            </h2>

                            <p>
                                Sugar Qtr. Entitlement
                            </p>

                        </div>


                        <div className="verification-card">

                            <h2>

                                {
                                    formatQuantity(
                                        kerosene?.total_entitled
                                    )
                                }{" "}

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


                    {/* ==================================================
                        VERIFICATION TABLE
                    ================================================== */}

                    <div className="table-wrapper">

                        <table>

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
                                            (item, index) => (

                                                <tr key={index}>

                                                    <td>

                                                        <strong>
                                                            {
                                                                item.item_name
                                                            }
                                                        </strong>

                                                    </td>


                                                    <td>

                                                        {
                                                            item.period
                                                        }

                                                    </td>


                                                    <td>

                                                        {
                                                            formatQuantity(
                                                                item.total_entitled
                                                            )
                                                        }{" "}

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
                                                        }{" "}

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
                                                        }{" "}

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
                                                        }{" "}

                                                        {
                                                            item.unit ||
                                                            "kg"
                                                        }

                                                    </td>


                                                    <td>

                                                        <span
                                                            className={
                                                                item.status ===
                                                                "VERIFIED"

                                                                    ?

                                                                    "table-status verified"

                                                                    :

                                                                    "table-status not-verified"
                                                            }
                                                        >

                                                            {
                                                                item.status ===
                                                                "VERIFIED"

                                                                    ?

                                                                    "✓ Verified"

                                                                    :

                                                                    item.status
                                                            }

                                                        </span>

                                                    </td>

                                                </tr>

                                            )
                                        )

                                        :

                                        <tr>

                                            <td
                                                colSpan="7"
                                                className="empty-state"
                                            >

                                                No entitlement records
                                                were found for this period.

                                            </td>

                                        </tr>
                                }

                            </tbody>

                        </table>

                    </div>


                    {/* ==================================================
                        INVENTORY RULE
                    ================================================== */}

                    <div className="report-footer-info">

                        <div>

                            <strong>
                                Inventory Update
                            </strong>

                            <span>
                                Returned stock is added back to
                                inventory only after warehouse
                                manager verification.
                            </span>

                        </div>


                        <div>

                            <strong>
                                Rice / Wheat
                            </strong>

                            <span>
                                Audited and returned at the end
                                of every month.
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


                {/* ==================================================
                    FOOTER
                ================================================== */}

                <div className="report-footer">

                    Report generated on{" "}

                    {
                        new Date().toLocaleString()
                    }

                </div>

            </div>

        </Layout>
    );
}

export default Reports;