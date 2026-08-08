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


    const [dailyReport, setDailyReport] =
        useState({
            business_date: "",
            beneficiaries_served: 0,
            total_quantity: 0,
            items: []
        });


    const [monthlyReport, setMonthlyReport] =
        useState({
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            beneficiaries_served: 0,
            total_quantity: 0,
            items: []
        });


    const [verificationReport, setVerificationReport] =
        useState({
            month: today.getMonth() + 1,
            year: today.getFullYear(),
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


    // ---------------------------------
    // Format Date
    // ---------------------------------

    const formatDate = (date) => {

        if (!date) {
            return "-";
        }

        return new Date(date).toLocaleDateString(
            "en-GB",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );

    };


    // ---------------------------------
    // Load Reports
    // ---------------------------------

    useEffect(() => {

        loadReports();

    }, [month, year]);


    const loadReports = async () => {

        try {

            const [
                daily,
                monthly,
                verification
            ] = await Promise.all([

                axios.get(
                    "http://127.0.0.1:5000/daily-report"
                ),

                axios.get(
                    "http://127.0.0.1:5000/monthly-report",
                    {
                        params: {
                            month,
                            year
                        }
                    }
                ),

                axios.get(
                    "http://127.0.0.1:5000/monthly-verification-report",
                    {
                        params: {
                            month,
                            year
                        }
                    }
                )

            ]);


            setDailyReport(
                daily.data
            );


            setMonthlyReport(
                monthly.data
            );


            setVerificationReport(
                verification.data
            );


        } catch (err) {

            console.log(err);

        }

    };


    return (

        <Layout>

            <div className="reports-container">

                <h1>
                    Reports Dashboard
                </h1>


                <p className="reports-subtitle">

                    View daily distribution,
                    monthly distribution and
                    entitlement verification reports.

                </p>


                {/* =================================
                    SUMMARY CARDS
                ================================= */}

                <div className="report-summary">

                    <div className="report-card">

                        <h2>

                            {Number(
                                dailyReport.total_quantity
                            ).toFixed(2)} kg

                        </h2>

                        <p>
                            Today's Quantity Distributed
                        </p>

                    </div>


                    <div className="report-card">

                        <h2>

                            {Number(
                                monthlyReport.total_quantity
                            ).toFixed(2)} kg

                        </h2>

                        <p>
                            This Month's Distribution
                        </p>

                    </div>


                    <div className="report-card">

                        <h2>

                            {Number(
                                verificationReport.total_unclaimed
                            ).toFixed(2)} kg

                        </h2>

                        <p>
                            Monthly Unclaimed Stock
                        </p>

                    </div>

                </div>


                {/* =================================
                    DAILY REPORT
                ================================= */}

                <div
                    className="report-section"
                    id="daily-report"
                >

                    <h2>
                        Daily Distribution Report
                    </h2>


                    <div className="report-info">

                        <span>

                            <strong>
                                Business Date :
                            </strong>{" "}

                            {
                                formatDate(
                                    dailyReport.business_date
                                )
                            }

                        </span>


                        <span>

                            <strong>
                                Beneficiaries Served :
                            </strong>{" "}

                            {
                                dailyReport.beneficiaries_served
                            }

                        </span>


                        <span>

                            <strong>
                                Total Distributed :
                            </strong>{" "}

                            {
                                Number(
                                    dailyReport.total_quantity
                                ).toFixed(2)
                            } kg

                        </span>

                    </div>


                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Sl. No.
                                </th>

                                <th>
                                    Item
                                </th>

                                <th>
                                    Quantity Distributed
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                dailyReport.items.length > 0

                                    ?

                                    dailyReport.items.map(
                                        (item, index) => (

                                            <tr key={index}>

                                                <td>
                                                    {index + 1}
                                                </td>

                                                <td>
                                                    {item.item_name}
                                                </td>

                                                <td>

                                                    {
                                                        Number(
                                                            item.quantity
                                                        ).toFixed(2)
                                                    } kg

                                                </td>

                                            </tr>

                                        )
                                    )

                                    :

                                    <tr>

                                        <td
                                            colSpan="3"
                                            style={{
                                                textAlign: "center",
                                                padding: "30px"
                                            }}
                                        >

                                            No ration distributions
                                            have been recorded for
                                            the selected business date.

                                        </td>

                                    </tr>
                            }

                        </tbody>

                    </table>

                </div>


                {/* =================================
                    MONTHLY DISTRIBUTION REPORT
                ================================= */}

                <div
                    className="report-section"
                    id="monthly-report"
                >

                    <div className="report-filter">

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
                                    (m, index) => (

                                        <option
                                            key={index}
                                            value={index + 1}
                                        >

                                            {m}

                                        </option>

                                    )
                                )
                            }

                        </select>


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


                    <h2>
                        Monthly Distribution Report
                    </h2>


                    <div className="report-info">

                        <span>

                            <strong>
                                Month :
                            </strong>{" "}

                            {
                                monthNames[
                                    monthlyReport.month - 1
                                ]
                            }{" "}

                            {
                                monthlyReport.year
                            }

                        </span>


                        <span>

                            <strong>
                                Beneficiaries Served :
                            </strong>{" "}

                            {
                                monthlyReport.beneficiaries_served
                            }

                        </span>


                        <span>

                            <strong>
                                Total Distributed :
                            </strong>{" "}

                            {
                                Number(
                                    monthlyReport.total_quantity
                                ).toFixed(2)
                            } kg

                        </span>

                    </div>


                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Sl. No.
                                </th>

                                <th>
                                    Item
                                </th>

                                <th>
                                    Quantity Distributed
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {
                                monthlyReport.items.length > 0

                                    ?

                                    monthlyReport.items.map(
                                        (item, index) => (

                                            <tr key={index}>

                                                <td>
                                                    {index + 1}
                                                </td>

                                                <td>
                                                    {item.item_name}
                                                </td>

                                                <td>

                                                    {
                                                        Number(
                                                            item.quantity
                                                        ).toFixed(2)
                                                    } kg

                                                </td>

                                            </tr>

                                        )
                                    )

                                    :

                                    <tr>

                                        <td
                                            colSpan="3"
                                            style={{
                                                textAlign: "center",
                                                padding: "30px",
                                                color: "#64748b"
                                            }}
                                        >

                                            No ration distributions
                                            were recorded during
                                            this month.

                                        </td>

                                    </tr>
                            }

                        </tbody>

                    </table>

                </div>


                {/* =================================
                    MONTHLY VERIFICATION REPORT
                ================================= */}

                <div
                    className="report-section"
                    id="verification-report"
                >

                    <h2>
                        Monthly Entitlement Verification
                    </h2>


                    <p className="reports-subtitle">

                        Consolidated entitlement and
                        warehouse return status for
                        all beneficiaries.

                    </p>


                    {/* Verification Status */}

                    <div className="report-info">

                        <span>

                            <strong>
                                Month :
                            </strong>{" "}

                            {
                                monthNames[
                                    verificationReport.month - 1
                                ]
                            }{" "}

                            {
                                verificationReport.year
                            }

                        </span>


                        <span>

                            <strong>
                                Verification Status :
                            </strong>{" "}

                            <span
                                style={{
                                    fontWeight: "bold",
                                    color:
                                        verificationReport.verification_status ===
                                            "VERIFIED"
                                            ? "#16a34a"
                                            : "#d97706"
                                }}
                            >

                                {
                                    verificationReport.verification_status ===
                                        "VERIFIED"
                                        ? "✓ VERIFIED"
                                        : "⚠ NOT VERIFIED"
                                }

                            </span>

                        </span>

                    </div>


                    {/* Overall Totals */}

                    <div className="report-summary">

                        <div className="report-card">

                            <h2>

                                {
                                    Number(
                                        verificationReport.total_entitled
                                    ).toFixed(2)
                                } kg

                            </h2>

                            <p>
                                Total Entitled
                            </p>

                        </div>


                        <div className="report-card">

                            <h2>

                                {
                                    Number(
                                        verificationReport.total_claimed
                                    ).toFixed(2)
                                } kg

                            </h2>

                            <p>
                                Total Claimed
                            </p>

                        </div>


                        <div className="report-card">

                            <h2>

                                {
                                    Number(
                                        verificationReport.total_unclaimed
                                    ).toFixed(2)
                                } kg

                            </h2>

                            <p>
                                Total Unclaimed
                            </p>

                        </div>


                        <div className="report-card">

                            <h2>

                                {
                                    Number(
                                        verificationReport.total_returned
                                    ).toFixed(2)
                                } kg

                            </h2>

                            <p>
                                Returned to Warehouse
                            </p>

                        </div>

                    </div>


                    {/* Rice / Wheat Table */}

                    <table>

                        <thead>

                            <tr>

                                <th>
                                    Item
                                </th>

                                <th>
                                    Total Entitled
                                </th>

                                <th>
                                    Total Claimed
                                </th>

                                <th>
                                    Total Unclaimed
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
                                        (item, index) => (

                                            <tr key={index}>

                                                <td>
                                                    <strong>
                                                        {item.item_name}
                                                    </strong>
                                                </td>

                                                <td>

                                                    {
                                                        Number(
                                                            item.total_entitled
                                                        ).toFixed(2)
                                                    } kg

                                                </td>

                                                <td>

                                                    {
                                                        Number(
                                                            item.total_claimed
                                                        ).toFixed(2)
                                                    } kg

                                                </td>

                                                <td>

                                                    {
                                                        Number(
                                                            item.total_unclaimed
                                                        ).toFixed(2)
                                                    } kg

                                                </td>

                                                <td>

                                                    {
                                                        Number(
                                                            item.total_returned
                                                        ).toFixed(2)
                                                    } kg

                                                </td>

                                                <td>

                                                    <span
                                                        style={{
                                                            fontWeight: "bold",
                                                            color:
                                                                item.status ===
                                                                    "VERIFIED"
                                                                    ? "#16a34a"
                                                                    : "#d97706"
                                                        }}
                                                    >

                                                        {
                                                            item.status ===
                                                                "VERIFIED"
                                                                ? "✓ Verified"
                                                                : "⚠ Not Verified"
                                                        }

                                                    </span>

                                                </td>

                                            </tr>

                                        )
                                    )

                                    :

                                    <tr>

                                        <td
                                            colSpan="6"
                                            style={{
                                                textAlign: "center",
                                                padding: "30px",
                                                color: "#64748b"
                                            }}
                                        >

                                            No entitlement records
                                            were found for this month.

                                        </td>

                                    </tr>
                            }

                        </tbody>

                    </table>

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