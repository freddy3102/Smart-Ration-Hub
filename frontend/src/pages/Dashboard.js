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

                <div className="dashboard-header">

                    <h1>Dashboard</h1>

                    <p>
                        Welcome back, Administrator 👋
                    </p>

                </div>

                <div className="dashboard-grid">

                    <div className="dashboard-card beneficiaries">

                        <h3>👥 Beneficiaries</h3>

                        <h1>{data.total_beneficiaries}</h1>

                    </div>

                    <div className="dashboard-card inventory">

                        <h3>📦 Inventory</h3>

                        <h1>{data.total_inventory_items}</h1>

                    </div>

                    <div className="dashboard-card distribution">

                        <h3>🍚 Distributions</h3>

                        <h1>{data.total_distributions}</h1>

                    </div>

                    <div className="dashboard-card lowstock">

                        <h3>⚠ Low Stock</h3>

                        <h1>{data.low_stock_items}</h1>

                    </div>

                </div>

                <div className="dashboard-bottom">

                    <div className="status-card">

                        <h2>📢 System Status</h2>

                        <p>✔ All services are running normally.</p>

                    </div>

                    <div className="activity-card">

                        <h2>🕒 Recent Activity</h2>

                        <ul>

                            <li>Beneficiary module updated</li>

                            <li>Dashboard loaded successfully</li>

                            <li>Ready for Inventory Module</li>

                        </ul>

                    </div>

                </div>

            </div>

        </Layout>

    );

}

export default Dashboard;