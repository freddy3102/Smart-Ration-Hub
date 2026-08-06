import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "../styles/Reports.css";

function Reports() {

    const today = new Date();

    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());

    const [dailyReport, setDailyReport] = useState({
        business_date: "",
        beneficiaries_served: 0,
        total_quantity: 0,
        items: []
    });

    const [monthlyReport, setMonthlyReport] = useState({
        month: today.getMonth() + 1,
        year: today.getFullYear(),
        beneficiaries_served: 0,
        total_quantity: 0,
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

    const formatDate = (date) => {

        if (!date) return "-";

        return new Date(date).toLocaleDateString(

            "en-GB",

            {

                day: "numeric",

                month: "long",

                year: "numeric"

            }

        );

    };

    useEffect(() => {

        loadReports();

    }, [month, year]);

    const loadReports = () => {

        Promise.all([

            axios.get(

                "http://127.0.0.1:5000/daily-report"

            ),

            axios.get(

                `http://127.0.0.1:5000/monthly-report?month=${month}&year=${year}`

            )

        ])

        .then(([daily, monthly]) => {

            setDailyReport(daily.data);

            setMonthlyReport(monthly.data);

        })

        .catch((err) => {

            console.log(err);

        });

    };

        return (

        <Layout>

            <div className="reports-container">

                <h1>

                    Reports Dashboard

                </h1>

                <p className="reports-subtitle">

                    View daily and monthly ration distribution reports.

                </p>

                {/* SUMMARY CARDS */}

                <div className="report-summary">

                    <div className="report-card">

                        <h2>

                            {

                                Number(

                                    dailyReport.total_quantity

                                ).toFixed(2)

                            } kg

                        </h2>

                        <p>

                            Today's Quantity Distributed

                        </p>

                    </div>

                    <div className="report-card">

                        <h2>

                            {

                                Number(

                                    monthlyReport.total_quantity

                                ).toFixed(2)

                            } kg

                        </h2>

                        <p>

                            This Month's Distribution

                        </p>

                    </div>

                </div>

                {/* DAILY REPORT */}

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

                            </strong>

                            {" "}

                            {

                                formatDate(

                                    dailyReport.business_date

                                )

                            }

                        </span>

                        <span>

                            <strong>

                                Beneficiaries Served :

                            </strong>

                            {" "}

                            {

                                dailyReport.beneficiaries_served

                            }

                        </span>

                        <span>

                            <strong>

                                Total Distributed :

                            </strong>

                            {" "}

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

                                    (item,index)=>(

                                    <tr

                                        key={index}

                                    >

                                        <td>

                                            {

                                                index+1

                                            }

                                        </td>

                                        <td>

                                            {

                                                item.item_name

                                            }

                                        </td>

                                        <td>

                                            {

                                                Number(

                                                    item.quantity

                                                ).toFixed(2)

                                            } kg

                                        </td>

                                    </tr>

                                ))

                                :

                                <tr>

                                    <td

                                        colSpan="3"

                                        style={{

                                            textAlign:"center",

                                            padding:"30px"

                                        }}

                                    >

                                        No ration distributions have been recorded for the selected business date.

                                    </td>

                                </tr>

                            }

                        </tbody>

                    </table>

                </div>

                {/* MONTHLY REPORT */}

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

                            onChange={(e)=>

                                setMonth(

                                    Number(

                                        e.target.value

                                    )

                                )

                            }

                        >

                            {

                                monthNames.map(

                                    (m,index)=>(

                                    <option

                                        key={index}

                                        value={index+1}

                                    >

                                        {m}

                                    </option>

                                ))

                            }

                        </select>

                        <label>

                            Year

                        </label>

                        <input

                            type="number"

                            value={year}

                            onChange={(e)=>

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

                            </strong>

                            {" "}

                            {

                                monthNames[

                                    monthlyReport.month-1

                                ]

                            }

                            {" "}

                            {

                                monthlyReport.year

                            }

                        </span>

                        <span>

                            <strong>

                                Beneficiaries Served :

                            </strong>

                            {" "}

                            {

                                monthlyReport.beneficiaries_served

                            }

                        </span>

                        <span>

                            <strong>

                                Total Distributed :

                            </strong>

                            {" "}

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

                                    (item,index)=>(

                                    <tr

                                        key={index}

                                    >

                                        <td>

                                            {

                                                index+1

                                            }

                                        </td>

                                        <td>

                                            {

                                                item.item_name

                                            }

                                        </td>

                                        <td>

                                            {

                                                Number(

                                                    item.quantity

                                                ).toFixed(2)

                                            } kg

                                        </td>

                                    </tr>

                                ))

                                :

                                <tr>

                                    <td

                                        colSpan="3"

                                        style={{

                                            textAlign:"center",

                                            padding:"30px",

                                            color:"#64748b"

                                        }}

                                    >

                                        No ration distributions were recorded during this month.

                                    </td>

                                </tr>

                            }

                        </tbody>

                    </table>

                </div>

                <div className="report-footer">

                    Report generated on

                    {" "}

                    {

                        new Date().toLocaleString()

                    }

                </div>

            </div>

        </Layout>

    );

}

export default Reports;