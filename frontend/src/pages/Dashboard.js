import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import "../styles/Dashboard.css";

function Dashboard() {

    const [data, setData] = useState({
        total_beneficiaries: 0,
        total_inventory_items: 0,
        total_distributions: 0,
        low_stock_items: 0,
    });

    useEffect(() => {

        axios
            .get("http://127.0.0.1:5000/dashboard")
            .then((response) => {
                setData(response.data);
            })
            .catch((error) => {
                console.log(error);
            });

    }, []);

    return (

        <Layout>

            <div className="dashboard">

                {/* Header */}

                <div className="dashboard-header">

                    <div>

                        <div className="breadcrumb">
                            Smart Ration Hub
                            <span>/</span>
                            Dashboard
                        </div>

                        <h1>Dashboard</h1>

                        <p>
                            Welcome back, Administrator 👋
                        </p>

                    </div>

                    <div className="dashboard-date">
                        📅 {new Date().toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                        })}
                    </div>

                </div>


                {/* Main Summary Cards */}

                <div className="dashboard-grid">

                    {/* Beneficiaries */}

                    <div className="dashboard-card beneficiaries">

                        <div className="card-top">

                            <div className="card-icon">
                                👥
                            </div>

                            <div>
                                <h3>Beneficiaries</h3>

                                <span>
                                    Total Registered
                                </span>
                            </div>

                        </div>

                        <h1>
                            {data.total_beneficiaries}
                        </h1>

                        <div className="card-footer">

                            <a href="/beneficiaries">
                                View beneficiaries
                                <span>→</span>
                            </a>

                        </div>

                    </div>


                    {/* Low Stock */}

                    <div className="dashboard-card lowstock">

                        <div className="card-top">

                            <div className="card-icon">
                                ⚠️
                            </div>

                            <div>
                                <h3>Low Stock Alerts</h3>

                                <span>
                                    Items running low
                                </span>
                            </div>

                        </div>

                        <h1>
                            {data.low_stock_items}
                        </h1>

                        <div className="card-footer">

                            <a href="/inventory">
                                View inventory
                                <span>→</span>
                            </a>

                        </div>

                    </div>

                </div>


                {/* Bottom Section */}

                <div className="dashboard-bottom">


                    {/* System Status */}

                    <div className="status-card">

                        <div className="section-heading">

                            <div>

                                <h2>
                                    System Status
                                </h2>

                                <p>
                                    Current status of Smart Ration Hub
                                </p>

                            </div>

                            <span className="active-badge">
                                ● Active
                            </span>

                        </div>


                        <div className="status-content">

                            <div className="status-icon">
                                ✓
                            </div>

                            <div>

                                <h3>
                                    All systems are running normally
                                </h3>

                                <p>
                                    Dashboard services and database
                                    connections are operating normally.
                                </p>

                            </div>

                        </div>

                    </div>


                    {/* Inventory Overview */}

                    <div className="overview-card">

                        <div className="section-heading">

                            <div>

                                <h2>
                                    Inventory Overview
                                </h2>

                                <p>
                                    Current inventory status
                                </p>

                            </div>

                        </div>


                        <div className="inventory-overview">

                            <div className="inventory-number">

                                <span>
                                    📦
                                </span>

                                <strong>
                                    {data.total_inventory_items}
                                </strong>

                                <small>
                                    Inventory Items
                                </small>

                            </div>


                            <div className="inventory-link">

                                <p>
                                    Manage your ration stock
                                    and monitor availability.
                                </p>

                                <a href="/inventory">
                                    Open Inventory →
                                </a>

                            </div>

                        </div>

                    </div>

                </div>

            </div>

        </Layout>
    );
}

export default Dashboard;