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

                <h1 className="dashboard-title">
                    Dashboard
                </h1>

                <div className="dashboard-grid">

                    <div className="dashboard-card">
                        <h3>Total Beneficiaries</h3>
                        <h1>{data.total_beneficiaries}</h1>
                    </div>

                    <div className="dashboard-card">
                        <h3>Inventory Items</h3>
                        <h1>{data.total_inventory_items}</h1>
                    </div>

                    <div className="dashboard-card">
                        <h3>Total Distributions</h3>
                        <h1>{data.total_distributions}</h1>
                    </div>

                    <div className="dashboard-card">
                        <h3>Low Stock</h3>
                        <h1>{data.low_stock_items}</h1>
                    </div>

                </div>

            </div>
        </Layout>
    );
}

export default Dashboard;