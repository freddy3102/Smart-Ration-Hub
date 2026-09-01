import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "../styles/Reports.css";


function Reports() {

    const today = new Date();

    const [month, setMonth] =
        useState(today.getMonth() + 1);

    const [year, setYear] =
        useState(today.getFullYear());


    const [verificationReport, setVerificationReport] =
        useState({
            month: today.getMonth() + 1,
            year: today.getFullYear(),

            quarter: "",
            quarter_start_month: null,
            quarter_end_month: null,
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


    // =========================================
    // LOAD REPORT
    // =========================================

    useEffect(() => {

        loadVerificationReport();

    }, [month, year]);


    const loadVerificationReport = async () => {

        try {

            const response = await axios.get(
                "http://127.0.0.1:5000/monthly-verification-report",
                {
                    params: {
                        month,
                        year
                    }
                }
            );


            setVerificationReport(
                response.data
            );

        }

        catch (err) {

            console.log(
                "Verification report error:",
                err
            );

            setVerificationReport({

                month,
                year,

                quarter: "",
                quarter_start_month: null,
                quarter_end_month: null,
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

    };


    // =========================================
    // GET ITEM
    // =========================================

    const getItem = (name) => {

        return verificationReport.items.find(
            (item) =>
                String(item.item_name || "")
                    .trim()
                    .toLowerCase() ===
                name.toLowerCase()
        );

    };


    const rice = getItem("rice");
    const wheat = getItem("wheat");
    const sugar = getItem("sugar");
    const kerosene = getItem("kerosene");


    // =========================================
    // FORMAT QUANTITY
    // =========================================

    const formatQuantity = (
        item,
        field = "total_entitled"
    ) => {

        if (!item) {
            return "0.00";
        }

        return Number(
            item[field] || 0
        ).toFixed(2);

    };


    // =========================================
    // FORMAT UNIT
    // =========================================

    const getUnit = (item) => {

        if (!item) {
            return "kg";
        }

        const unit =
            String(item.unit || "kg")
                .trim()
                .toLowerCase();


        if (
            unit === "l" ||
            unit === "litre" ||
            unit === "liter" ||
            unit === "litres" ||
            unit === "liters"
        ) {

            return "Litre";

        }


        return "Kg";

    };


    // =========================================
    // QUARTER MESSAGE
    // =========================================

    const quarterMessage =
        verificationReport.is_quarter_end

            ?

            "Quarter has ended. Sugar and Kerosene are now eligible for warehouse return and verification."

            :

            "Quarter is still open. Sugar and Kerosene can be collected during the quarter and are audited for return only at quarter end.";


    // =========================================
    // VERIFICATION STATUS CLASS
    // =========================================

    const verificationStatusClass =
        verificationReport.verification_status ===
        "VERIFIED"

            ?

            "verified"

            :

            "not-verified";


    return (

        <Layout>

            <div className="reports-container">


                {/* =================================
                    PAGE HEADER
                ================================= */}

                <div className="reports-header">

                    <h1>
                        Reports Dashboard
                    </h1>

                    <p className="reports-subtitle">

                        View entitlement verification
                        reports.

                    </p>

                </div>



                {/* =================================
                    ENTITLEMENT VERIFICATION
                ================================= */}

                <div
                    className="report-section"
                    id="verification-report"
                >


                    {/* =================================
                        SECTION HEADER
                    ================================= */}

                    <div className="section-header">

                        <div>

                            <h2>
                                Entitlement Verification
                            </h2>

                            <p>

                                Monthly verification for
                                Rice and Wheat, and quarterly
                                verification for Sugar and
                                Kerosene.

                            </p>

                        </div>

                    </div>



                    {/* =================================
                        MONTH / YEAR FILTER
                    ================================= */}

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
                                        (
                                            monthName,
                                            index
                                        ) => (

                                            <option
                                                key={index}
                                                value={index + 1}
                                            >

                                                {monthName}

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



                    {/* =================================
                        VERIFICATION HEADER
                    ================================= */}

                    <div className="verification-header">


                        <div className="verification-period">

                            <span>
                                Report Period
                            </span>

                            <strong>

                                {
                                    monthNames[
                                        (
                                            verificationReport.month ||
                                            month
                                        ) - 1
                                    ]
                                }{" "}

                                {
                                    verificationReport.year ||
                                    year
                                }

                            </strong>

                        </div>



                        <div className="verification-quarter">

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



                        <div className="verification-quarter-status">

                            <span>
                                Quarter Status
                            </span>

                            <strong>

                                {
                                    verificationReport.is_quarter_end
                                        ? "QUARTER END"
                                        : "QUARTER OPEN"
                                }

                            </strong>

                        </div>



                        <div className="verification-status">

                            <span>
                                Verification Status
                            </span>

                            <strong
                                className={
                                    verificationStatusClass
                                }
                            >

                                {
                                    verificationReport.verification_status ===
                                    "VERIFIED"

                                        ?

                                        "✓ VERIFIED"

                                        :

                                        "⚠ " +
                                        (
                                            verificationReport.verification_status ||
                                            "NOT VERIFIED"
                                        )
                                }

                            </strong>

                        </div>

                    </div>



                    {/* =================================
                        QUARTERLY INFORMATION
                    ================================= */}

                    <div className="quarter-message">

                        <strong>
                            Sugar & Kerosene:
                        </strong>{" "}

                        {quarterMessage}

                    </div>



                    {/* =================================
                        ENTITLEMENT SUMMARY CARDS
                    ================================= */}

                    <div className="entitlement-summary">


                        {/* Rice */}

                        <div className="entitlement-card">

                            <h3>

                                {formatQuantity(
                                    rice
                                )}{" "}

                                {getUnit(rice)}

                            </h3>

                            <p>
                                Rice Entitled
                            </p>

                        </div>



                        {/* Wheat */}

                        <div className="entitlement-card">

                            <h3>

                                {formatQuantity(
                                    wheat
                                )}{" "}

                                {getUnit(wheat)}

                            </h3>

                            <p>
                                Wheat Entitled
                            </p>

                        </div>



                        {/* Sugar */}

                        <div className="entitlement-card">

                            <h3>

                                {formatQuantity(
                                    sugar
                                )}{" "}

                                {getUnit(sugar)}

                            </h3>

                            <p>
                                Sugar Qtr. Entitlement
                            </p>

                        </div>



                        {/* Kerosene */}

                        <div className="entitlement-card">

                            <h3>

                                {formatQuantity(
                                    kerosene
                                )}{" "}

                                {getUnit(kerosene)}

                            </h3>

                            <p>
                                Kerosene Qtr. Entitlement
                            </p>

                        </div>

                    </div>



                    {/* =================================
                        VERIFICATION TABLE
                    ================================= */}

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
                                    verificationReport.items.length > 0

                                        ?

                                        verificationReport.items.map(
                                            (
                                                item,
                                                index
                                            ) => (

                                                <tr
                                                    key={index}
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
                                                            item.period
                                                        }

                                                    </td>



                                                    <td>

                                                        {
                                                            Number(
                                                                item.total_entitled ||
                                                                0
                                                            ).toFixed(2)
                                                        }{" "}

                                                        {
                                                            getUnit(item)
                                                        }

                                                    </td>



                                                    <td>

                                                        {
                                                            Number(
                                                                item.total_claimed ||
                                                                0
                                                            ).toFixed(2)
                                                        }{" "}

                                                        {
                                                            getUnit(item)
                                                        }

                                                    </td>



                                                    <td>

                                                        {
                                                            Number(
                                                                item.total_unclaimed ||
                                                                0
                                                            ).toFixed(2)
                                                        }{" "}

                                                        {
                                                            getUnit(item)
                                                        }

                                                    </td>



                                                    <td>

                                                        {
                                                            Number(
                                                                item.total_returned ||
                                                                0
                                                            ).toFixed(2)
                                                        }{" "}

                                                        {
                                                            getUnit(item)
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

                                                No entitlement
                                                records were found
                                                for this month.

                                            </td>

                                        </tr>

                                }

                            </tbody>

                        </table>

                    </div>



                    {/* =================================
                        INFORMATION FOOTER
                    ================================= */}

                    <div className="report-information">

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
                                Audited and returned only
                                at quarter end.
                            </span>

                        </div>

                    </div>

                </div>



                {/* =================================
                    FOOTER
                ================================= */}

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