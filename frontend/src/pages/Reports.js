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

                // Daily report
                axios.get(
                    "http://127.0.0.1:5000/daily-report"
                ),

                // Monthly report
                // Kept intentionally so existing
                // functionality is not changed.
                axios.get(
                    "http://127.0.0.1:5000/monthly-report",
                    {
                        params: {
                            month,
                            year
                        }
                    }
                ),

                // Monthly verification report
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

                {/* =================================
                    PAGE HEADER
                ================================= */}

                <div className="reports-header">

                    <h1>
                        Reports Dashboard
                    </h1>

                    <p className="reports-subtitle">

                        View daily distribution and
                        entitlement verification reports.

                    </p>

                </div>


                {/* =================================
                    DAILY DISTRIBUTION REPORT
                ================================= */}

                <div
                    className="report-section"
                    id="daily-report"
                >

                    <div className="section-header">

                        <div>

                            <h2>
                                Daily Distribution Report
                            </h2>

                            <p>
                                Distribution activity recorded
                                for the current business date.
                            </p>

                        </div>

                    </div>


                    {/* Daily Report Information */}

                    <div className="report-info">

                        <span>

                            <strong>
                                Business Date
                            </strong>

                            {formatDate(
                                dailyReport.business_date
                            )}

                        </span>


                        <span>

                            <strong>
                                Beneficiaries Served
                            </strong>

                            {dailyReport.beneficiaries_served}

                        </span>


                        <span>

                            <strong>
                                Total Distributed
                            </strong>

                            {
                                Number(
                                    dailyReport.total_quantity
                                ).toFixed(2)
                            } kg

                        </span>

                    </div>


                    {/* Daily Distribution Table */}

                    <div className="table-wrapper">

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
                                                        <strong>
                                                            {item.item_name}
                                                        </strong>
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
                                                className="empty-state"
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

                </div>


                {/* =================================
                    MONTHLY ENTITLEMENT VERIFICATION
                ================================= */}

                <div
                    className="report-section"
                    id="verification-report"
                >

                    <div className="section-header">

                        <div>

                            <h2>
                                Monthly Entitlement Verification
                            </h2>

                            <p>
                                Consolidated entitlement and
                                warehouse return status for
                                all beneficiaries.
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
                                        (monthName, index) => (

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
                        VERIFICATION INFORMATION
                    ================================= */}

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


                        <div className="verification-status">

                            <span>
                                Verification Status
                            </span>

                            <strong
                                className={
                                    verificationReport.verification_status ===
                                    "VERIFIED"

                                        ?

                                        "verified"

                                        :

                                        "not-verified"
                                }
                            >

                                {
                                    verificationReport.verification_status ===
                                    "VERIFIED"

                                        ?

                                        "✓ VERIFIED"

                                        :

                                        "⚠ NOT VERIFIED"
                                }

                            </strong>

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

                                                                    "⚠ Not Verified"
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
                                                className="empty-state"
                                            >

                                                No entitlement records
                                                were found for this month.

                                            </td>

                                        </tr>
                                }

                            </tbody>

                        </table>

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