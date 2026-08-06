import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "../styles/Audit.css";

import { Pie } from "react-chartjs-2";

import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend
} from "chart.js";

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend
);

function Audit() {

    const [records, setRecords] = useState([]);
    const [search, setSearch] = useState("");
    const [cycleStatus, setCycleStatus] = useState("");

    const today = new Date();

    const [selectedMonth, setSelectedMonth] = useState(
        today.getMonth() + 1
    );

    const [selectedYear, setSelectedYear] = useState(
        today.getFullYear()
    );

    useEffect(() => {

        loadAudit();
        loadCycleStatus();

    }, [selectedMonth, selectedYear]);

    // ---------------------------------
    // Load Audit Records
    // ---------------------------------

    const loadAudit = () => {

        axios

            .get(

                `http://127.0.0.1:5000/audit?month=${selectedMonth}&year=${selectedYear}`

            )

            .then((res) => {

                setRecords(res.data);

            })

            .catch((err) => {

                console.log(err);

            });

    };

    // ---------------------------------
    // Load Distribution Cycle Status
    // ---------------------------------

    const loadCycleStatus = () => {

    axios

        .get(

            `http://127.0.0.1:5000/cycle-status?month=${selectedMonth}&year=${selectedYear}`

        )

        .then((res) => {

            setCycleStatus(

                res.data.status

            );

        })

        .catch((err) => {

            console.log(err);

        });

};
    // ---------------------------------
    // Return Stock
    // ---------------------------------

    const returnStock = async (auditId, qty) => {

        const confirmReturn = window.confirm(

            "Return this unclaimed stock to warehouse?"

        );

        if (!confirmReturn) return;

        try {

            await axios.put(

                `http://127.0.0.1:5000/warehouse-return/${auditId}`,

                {

                    returned_quantity: qty,

                    processed_by: 1

                }

            );

            alert("Stock returned successfully.");

            loadAudit();

        }

        catch (err) {

            alert(

                err.response?.data?.message ||

                "Unable to return stock."

            );

        }

    };

    // ---------------------------------
    // Search Filter
    // ---------------------------------

    const filtered = records.filter((r) =>

        r.full_name
            .toLowerCase()
            .includes(search.toLowerCase())

        ||

        r.item_name
            .toLowerCase()
            .includes(search.toLowerCase())

    );

    // ---------------------------------
    // Summary Cards
    // ---------------------------------

    const totalRecords = records.length;

    const pending = records.filter(

        r => r.audit_status === "Pending"

    ).length;

    const returned = records.filter(

        r => r.audit_status === "Returned"

    ).length;

    const totalQty = records.reduce(

        (sum, r) =>

            sum + Number(r.unclaimed_quantity),

        0

    );

    const returnedQty = records.reduce(

        (sum, r) =>

            sum + Number(

                r.warehouse_returned_quantity

            ),

        0

    );

    // ---------------------------------
    // Pie Chart
    // ---------------------------------

    const chartData = {

        labels: [

            "Returned",

            "Pending"

        ],

        datasets: [

            {

                data: [

                    returned,

                    pending

                ],

                backgroundColor: [

                    "#22c55e",

                    "#f59e0b"

                ],

                borderColor: [

                    "#16a34a",

                    "#d97706"

                ],

                borderWidth: 2

            }

        ]

    };

    const chartOptions = {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {

                position: "bottom",

                labels: {

                    font: {

                        size: 13

                    }

                }

            }

        }

    };

    // ---------------------------------
// Friendly Audit ID
// ---------------------------------

const getAuditDisplayId = (row) => {

    const monthNames = [
        "JAN",
        "FEB",
        "MAR",
        "APR",
        "MAY",
        "JUN",
        "JUL",
        "AUG",
        "SEP",
        "OCT",
        "NOV",
        "DEC"
    ];

    const monthCode = monthNames[row.month - 1];

    const sameMonthRecords = records
        .filter(r => r.month === row.month && r.year === row.year)
        .sort((a, b) => a.audit_id - b.audit_id);

    const index =
        sameMonthRecords.findIndex(
            r => r.audit_id === row.audit_id
        ) + 1;

    return `${monthCode}${String(index).padStart(2, "0")}`;

};

        return (

        <Layout>

            <div className="audit-container">

                <h1>

                    Warehouse Return Audit

                </h1>

                <p className="audit-subtitle">

                    Track all unclaimed ration stock and ensure it is
                    returned to the warehouse to prevent misuse
                    and black-market diversion.

                </p>

                {/* SUMMARY */}

                <div className="summary-cards">

                    <div className="card">

                        <h2>{totalRecords}</h2>

                        <p>Total Records</p>

                    </div>

                    <div className="card pending-card">

                        <h2>{pending}</h2>

                        <p>Pending Returns</p>

                    </div>

                    <div className="card returned-card">

                        <h2>{returned}</h2>

                        <p>Returned</p>

                    </div>

                    <div className="card">

                        <h2>

                            {totalQty.toFixed(2)} kg

                        </h2>

                        <p>Total Unclaimed</p>

                    </div>

                </div>

                {/* ANALYTICS */}

                <div className="analytics-section">

                    <div className="chart-card">

                        <h2>

                            Audit Analytics

                        </h2>

                        <div className="chart-wrapper">

                            <Pie

                                data={chartData}

                                options={chartOptions}

                            />

                        </div>

                    </div>

                    <div className="mini-stats">

                        <div className="mini-card">

                            <h2>{returned}</h2>

                            <p>Returned</p>

                        </div>

                        <div className="mini-card">

                            <h2>{pending}</h2>

                            <p>Pending</p>

                        </div>

                        <div className="mini-card">

                            <h2>

                                {returnedQty.toFixed(2)} kg

                            </h2>

                            <p>

                                Warehouse Returned

                            </p>

                        </div>

                    </div>

                </div>

                {/* MONTH FILTER */}

                <div className="audit-filter">

                    <select

                        value={selectedMonth}

                        onChange={(e)=>

                            setSelectedMonth(

                                Number(e.target.value)

                            )

                        }

                    >

                        <option value={1}>January</option>
                        <option value={2}>February</option>
                        <option value={3}>March</option>
                        <option value={4}>April</option>
                        <option value={5}>May</option>
                        <option value={6}>June</option>
                        <option value={7}>July</option>
                        <option value={8}>August</option>
                        <option value={9}>September</option>
                        <option value={10}>October</option>
                        <option value={11}>November</option>
                        <option value={12}>December</option>

                    </select>

                    <input

                        type="number"

                        value={selectedYear}

                        onChange={(e)=>

                            setSelectedYear(

                                Number(e.target.value)

                            )

                        }

                    />

                </div>

                {/* CYCLE STATUS */}

                <div className="cycle-status-banner">

                    <span>

                        Distribution Cycle :

                    </span>

                    <span

                        className={

                            cycleStatus === "OPEN"

                                ? "status-open"

                                : "status-closed"

                        }

                    >

                        {cycleStatus}

                    </span>

                </div>

                <input

                    className="search-box"

                    type="text"

                    placeholder="Search beneficiary or item..."

                    value={search}

                    onChange={(e)=>setSearch(e.target.value)}

                />

                                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Beneficiary</th>
                            <th>Item</th>
                            <th>Month</th>
                            <th>Year</th>
                            <th>Entitled</th>
                            <th>Claimed</th>
                            <th>Unclaimed</th>
                            <th>Returned</th>
                            <th>Status</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            filtered.length > 0 ?

                                filtered.map((row) => (

                                    <tr key={row.audit_id}>

                                        <td>{getAuditDisplayId(row)}</td>

                                        <td>{row.full_name}</td>

                                        <td>{row.item_name}</td>

                                        <td>{row.month}</td>

                                        <td>{row.year}</td>

                                        <td>{row.entitled_quantity}</td>

                                        <td>{row.claimed_quantity}</td>

                                        <td>{row.unclaimed_quantity}</td>

                                        <td>{row.warehouse_returned_quantity}</td>

                                        <td>

                                            <span

                                                className={

                                                    row.audit_status === "Returned"

                                                        ? "badge returned"

                                                        : "badge pending"

                                                }

                                            >

                                                {row.audit_status}

                                            </span>

                                        </td>

                                        <td>

                                            {

                                                row.audit_status === "Returned"

                                                ?

                                                <span

                                                    style={{

                                                        color:"#16a34a",

                                                        fontWeight:"bold",

                                                        fontSize:"17px"

                                                    }}

                                                >

                                                    ✔ Returned

                                                </span>

                                                :

                                                <button

                                                    className="return-btn"

                                                    disabled={
                                                        cycleStatus !== "CLOSED"
                                                    }

                                                    title={

                                                        cycleStatus !== "CLOSED"

                                                        ?

                                                        "Warehouse return is available only after the distribution cycle is closed."

                                                        :

                                                        ""

                                                    }

                                                    onClick={()=>

                                                        returnStock(

                                                            row.audit_id,

                                                            row.unclaimed_quantity

                                                        )

                                                    }

                                                >

                                                    {

                                                        cycleStatus === "CLOSED"

                                                        ?

                                                        "↩ Return"

                                                        :

                                                        "🔒 Cycle Open"

                                                    }

                                                </button>

                                            }

                                        </td>

                                    </tr>

                                ))

                            :

                                <tr>

                                    <td

                                        colSpan="11"

                                        style={{

                                            textAlign:"center",

                                            padding:"30px",

                                            color:"#666"

                                        }}

                                    >

                                        No audit records found for the selected month.

                                    </td>

                                </tr>

                        }

                    </tbody>

                </table>

                            </div>

        </Layout>

    );

}

export default Audit;