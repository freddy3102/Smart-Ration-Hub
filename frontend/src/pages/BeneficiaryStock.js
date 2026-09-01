import { useEffect, useState } from "react";
import axios from "axios";
import BeneficiaryLayout from "../components/BeneficiaryLayout";
import "../styles/BeneficiaryStock.css";


function BeneficiaryStock() {

    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);

    const beneficiary_id =
        localStorage.getItem("beneficiary_id");


    // =================================
    // Load Live Stock
    // =================================

    useEffect(() => {

        setLoading(true);

        axios.get(
            "http://localhost:5000/beneficiary-dashboard",
            {
                params: {
                    beneficiary_id:
                        beneficiary_id
                }
            }
        )
        .then((res) => {

            setStock(
                res.data.live_stock || []
            );

        })
        .catch((err) => {

            console.log(err);

            setStock([]);

        })
        .finally(() => {

            setLoading(false);

        });

    }, [beneficiary_id]);


    // =================================
    // Loading
    // =================================

    if (loading) {

        return (

            <BeneficiaryLayout>

                <div className="beneficiary-stock-page">

                    <div className="stock-page-header">

                        <p className="stock-page-label">
                            Beneficiary Portal
                        </p>

                        <h1>
                            Live Stock Availability
                        </h1>

                        <p className="stock-subtitle">
                            Current availability of ration items
                            at the ration shop.
                        </p>

                    </div>


                    <div className="stock-loading">

                        <div className="stock-loading-spinner">
                        </div>

                        <span>
                            Loading stock availability...
                        </span>

                    </div>

                </div>

            </BeneficiaryLayout>

        );

    }


    return (

        <BeneficiaryLayout>

            <div className="beneficiary-stock-page">


                {/* =================================
                    PAGE HEADER
                ================================= */}

                <div className="stock-page-header">

                    <p className="stock-page-label">
                        Beneficiary Portal
                    </p>

                    <h1>
                        Live Stock Availability
                    </h1>

                    <p className="stock-subtitle">
                        Current availability of ration items
                        at the ration shop.
                    </p>

                </div>


                {/* =================================
                    STOCK TABLE
                ================================= */}

                <div className="stock-table-container">

                    <table className="beneficiary-stock-table">

                        <thead>

                            <tr>

                                <th>
                                    Item
                                </th>

                                <th>
                                    Available Quantity
                                </th>

                                <th>
                                    Status
                                </th>

                            </tr>

                        </thead>


                        <tbody>

                            {stock.length > 0 ? (

                                stock.map((item, index) => {

                                    const status =
                                        item.stock_status ||
                                        "Available";


                                    // -----------------------------
                                    // Status class
                                    // -----------------------------

                                    let statusClass =
                                        "stock-status-available";


                                    if (
                                        status ===
                                        "Low Stock"
                                    ) {

                                        statusClass =
                                            "stock-status-low";

                                    }

                                    else if (
                                        status ===
                                        "Out of Stock"
                                    ) {

                                        statusClass =
                                            "stock-status-unavailable";

                                    }


                                    // -----------------------------
                                    // Item icon
                                    // -----------------------------

                                    let itemIcon = "📦";

                                    const itemName =
                                        (
                                            item.item_name ||
                                            ""
                                        ).trim().toLowerCase();


                                    if (
                                        itemName === "rice"
                                    ) {

                                        itemIcon = "🍚";

                                    }

                                    else if (
                                        itemName === "wheat"
                                    ) {

                                        itemIcon = "🌾";

                                    }

                                    else if (
                                        itemName === "sugar"
                                    ) {

                                        itemIcon = "🧂";

                                    }

                                    else if (
                                        itemName === "kerosene"
                                    ) {

                                        itemIcon = "🛢️";

                                    }


                                    // -----------------------------
                                    // Unit
                                    // -----------------------------

                                    const unit =
                                        item.unit ||
                                        "kg";


                                    return (

                                        <tr
                                            key={
                                                item.item_id ||
                                                index
                                            }
                                        >

                                            {/* =====================
                                                ITEM
                                            ===================== */}

                                            <td>

                                                <div className="stock-item">

                                                    <div className="stock-item-icon">

                                                        {itemIcon}

                                                    </div>

                                                    <strong>
                                                        {
                                                            item.item_name
                                                        }
                                                    </strong>

                                                </div>

                                            </td>


                                            {/* =====================
                                                QUANTITY
                                            ===================== */}

                                            <td>

                                                <span className="stock-quantity">

                                                    {
                                                        Number(
                                                            item.available_quantity ||
                                                            0
                                                        ).toFixed(2)
                                                    }

                                                    {" "}

                                                    {unit}

                                                </span>

                                            </td>


                                            {/* =====================
                                                STATUS
                                            ===================== */}

                                            <td>

                                                <span
                                                    className={
                                                        `stock-status ${statusClass}`
                                                    }
                                                >

                                                    {status}

                                                </span>

                                            </td>

                                        </tr>

                                    );

                                })

                            ) : (

                                <tr>

                                    <td
                                        colSpan="3"
                                        className="no-stock"
                                    >

                                        <div className="no-stock-content">

                                            <div className="no-stock-icon">
                                                📦
                                            </div>

                                            <strong>
                                                No stock information available
                                            </strong>

                                            <span>
                                                Stock availability could not
                                                be loaded at this time.
                                            </span>

                                        </div>

                                    </td>

                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>


                {/* =================================
                    FOOTER INFORMATION
                ================================= */}

                <div className="stock-information">

                    <div className="stock-information-icon">
                        ℹ
                    </div>

                    <div>

                        <strong>
                            Stock Information
                        </strong>

                        <p>
                            Stock availability is updated based
                            on the current inventory at the
                            ration shop.
                        </p>

                    </div>

                </div>


            </div>

        </BeneficiaryLayout>

    );

}


export default BeneficiaryStock;