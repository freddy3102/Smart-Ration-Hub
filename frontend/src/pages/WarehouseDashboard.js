import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import "../styles/WarehouseDashboard.css";

function WarehouseDashboard() {

    const navigate = useNavigate();


    const manager = JSON.parse(
        localStorage.getItem(
            "warehouse_manager"
        )
    );


    // ---------------------------------
    // Inventory
    // ---------------------------------

    const [inventory, setInventory] =
        useState([]);

    const [loadingInventory, setLoadingInventory] =
        useState(true);


    // ---------------------------------
    // Add Stock
    // ---------------------------------

    const [showAddStock, setShowAddStock] =
        useState(false);

    const [selectedItem, setSelectedItem] =
        useState(null);

    const [stockQuantity, setStockQuantity] =
        useState("");

    const [addingStock, setAddingStock] =
        useState(false);


    // ---------------------------------
    // Load Inventory
    // ---------------------------------

    const loadInventory = async () => {

        try {

            setLoadingInventory(true);

            const response = await axios.get(
                "http://127.0.0.1:5000/inventory"
            );

            setInventory(
                response.data || []
            );

        } catch (error) {

            console.log(
                "INVENTORY LOAD ERROR:",
                error
            );

        } finally {

            setLoadingInventory(false);

        }

    };


    useEffect(() => {

        loadInventory();

    }, []);


    // ---------------------------------
    // Open Add Stock
    // ---------------------------------

    const openAddStock = (item) => {

        setSelectedItem(item);

        setStockQuantity("");

        setShowAddStock(true);

    };


    // ---------------------------------
    // Close Add Stock
    // ---------------------------------

    const closeAddStock = () => {

        if (addingStock) {
            return;
        }

        setShowAddStock(false);

        setSelectedItem(null);

        setStockQuantity("");

    };


    // ---------------------------------
    // Add Stock
    // ---------------------------------

    const addStock = async () => {

        if (!selectedItem) {
            return;
        }


        const quantity =
            Number(stockQuantity);


        if (
            !Number.isFinite(quantity) ||
            quantity <= 0
        ) {

            alert(
                "Please enter a valid stock quantity greater than zero."
            );

            return;

        }


        try {

            setAddingStock(true);


            const response = await axios.put(
                "http://127.0.0.1:5000/inventory/add-stock",
                {
                    item_id:
                        selectedItem.item_id,

                    quantity:
                        quantity
                }
            );


            alert(
                response.data.message ||
                "Stock added successfully."
            );


            closeAddStock();

            await loadInventory();


        } catch (error) {

            console.log(
                "ADD STOCK ERROR:",
                error
            );


            alert(

                error.response?.data?.message ||

                "Unable to add stock."

            );

        } finally {

            setAddingStock(false);

        }

    };


    // ---------------------------------
    // Logout
    // ---------------------------------

    const logout = () => {

        localStorage.removeItem(
            "warehouse_manager"
        );

        sessionStorage.clear();


        navigate(
            "/warehouse-login",
            {
                replace: true
            }
        );

    };


    return (

        <div className="warehouse-dashboard">

            <div className="warehouse-container">


                {/* =================================
                    HEADER
                ================================= */}

                <div className="warehouse-header">

                    <div>

                        <span className="warehouse-label">
                            SMART RATION HUB
                        </span>

                        <h1>
                            Warehouse Manager
                        </h1>

                        <p>
                            Manage warehouse returns and
                            monthly verification.
                        </p>

                    </div>


                    <div className="manager-profile">

                        <div className="manager-avatar">

                            {
                                manager?.full_name
                                    ?.charAt(0)
                                    ?.toUpperCase() ||
                                "W"
                            }

                        </div>


                        <div>

                            <span>
                                Welcome
                            </span>

                            <strong>
                                {
                                    manager?.full_name ||
                                    "Manager"
                                }
                            </strong>

                        </div>

                    </div>

                </div>


                {/* =================================
                    DASHBOARD CONTENT
                ================================= */}

                <div className="warehouse-content">


                    <div className="section-heading">

                        <h2>
                            Warehouse Operations
                        </h2>

                        <p>
                            Select an operation to continue.
                        </p>

                    </div>


                    {/* =================================
                        OPERATION CARDS
                    ================================= */}

                    <div className="warehouse-actions">


                        {/* =================================
                            RETURN AUDIT
                        ================================= */}

                        <div className="warehouse-action-card">

                            <div className="action-icon audit-icon">
                                📋
                            </div>


                            <div className="action-content">

                                <span className="action-number">
                                    01
                                </span>

                                <h3>
                                    Warehouse Return Audit
                                </h3>

                                <p>
                                    View unclaimed ration stock
                                    reported by ration shops and
                                    record the quantity returned
                                    to the warehouse.
                                </p>


                                <button
                                    type="button"
                                    className="action-btn"
                                    onClick={() =>
                                        navigate(
                                            "/warehouse-audit"
                                        )
                                    }
                                >

                                    Open Return Audit

                                    <span>
                                        →
                                    </span>

                                </button>

                            </div>

                        </div>


                        {/* =================================
                            VERIFICATION
                        ================================= */}

                        <div className="warehouse-action-card">

                            <div className="action-icon verification-icon">
                                ✓
                            </div>


                            <div className="action-content">

                                <span className="action-number">
                                    02
                                </span>

                                <h3>
                                    Warehouse Verification
                                </h3>

                                <p>
                                    Verify monthly warehouse
                                    returns after all unclaimed
                                    ration stock has been
                                    returned by the ration shop.
                                </p>


                                <button
                                    type="button"
                                    className="action-btn"
                                    onClick={() =>
                                        navigate(
                                            "/warehouse-verification"
                                        )
                                    }
                                >

                                    Open Verification

                                    <span>
                                        →
                                    </span>

                                </button>

                            </div>

                        </div>


                    </div>


                    {/* =================================
                        INVENTORY STATUS
                    ================================= */}

                    <div className="warehouse-inventory-section">

                        <div className="inventory-section-header">

                            <div>

                                <span className="warehouse-label">
                                    STOCK MONITORING
                                </span>

                                <h2>
                                    Inventory Status
                                </h2>

                                <p>
                                    Monitor current stock levels
                                    and add newly received stock.
                                </p>

                            </div>


                            <button
                                type="button"
                                className="inventory-refresh-btn"
                                onClick={loadInventory}
                                disabled={loadingInventory}
                            >

                                {loadingInventory
                                    ? "Refreshing..."
                                    : "↻ Refresh"}

                            </button>

                        </div>


                        {loadingInventory ? (

                            <div className="inventory-loading">

                                Loading inventory...

                            </div>

                        ) : inventory.length === 0 ? (

                            <div className="inventory-empty">

                                No inventory records available.

                            </div>

                        ) : (

                            <div className="warehouse-inventory-grid">

                                {inventory.map(
                                    (item) => (

                                        <div
                                            className="warehouse-inventory-card"
                                            key={
                                                item.inventory_id
                                            }
                                        >

                                            <div className="inventory-card-top">

                                                <div>

                                                    <h3>
                                                        {
                                                            item.item_name
                                                        }
                                                    </h3>

                                                    <span>
                                                        Inventory Stock
                                                    </span>

                                                </div>


                                                <span
                                                    className={

                                                        item.stock_status ===
                                                        "Out of Stock"

                                                            ?

                                                            "inventory-status out"

                                                            :

                                                        item.stock_status ===
                                                        "Low Stock"

                                                            ?

                                                            "inventory-status low"

                                                            :

                                                            "inventory-status available"

                                                    }
                                                >

                                                    {
                                                        item.stock_status
                                                    }

                                                </span>

                                            </div>


                                            <div className="inventory-quantity">

                                                <strong>

                                                    {
                                                        Number(
                                                            item.available_quantity ||
                                                            0
                                                        ).toFixed(2)
                                                    }

                                                </strong>

                                                <span>
                                                    kg available
                                                </span>

                                            </div>


                                            <div className="inventory-minimum">

                                                <span>
                                                    Minimum Stock
                                                </span>

                                                <strong>

                                                    {
                                                        Number(
                                                            item.minimum_stock ||
                                                            0
                                                        ).toFixed(2)
                                                    } kg

                                                </strong>

                                            </div>


                                            <button
                                                type="button"
                                                className="add-stock-btn"
                                                onClick={() =>
                                                    openAddStock(
                                                        item
                                                    )
                                                }
                                            >

                                                + Add Stock

                                            </button>

                                        </div>

                                    )
                                )}

                            </div>

                        )}

                    </div>


                </div>


                {/* =================================
                    FOOTER
                ================================= */}

                <div className="warehouse-footer">

                    <div>

                        <span>
                            Warehouse Manager Portal
                        </span>

                        <small>
                            Smart Ration Hub
                        </small>

                    </div>


                    <button
                        type="button"
                        className="warehouse-logout"
                        onClick={logout}
                    >
                        Logout
                    </button>

                </div>


            </div>


            {/* =================================
                ADD STOCK MODAL
            ================================= */}

            {showAddStock && selectedItem && (

                <div
                    className="stock-modal-overlay"
                    onClick={closeAddStock}
                >

                    <div
                        className="stock-modal"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <button
                            type="button"
                            className="stock-modal-close"
                            onClick={closeAddStock}
                            disabled={addingStock}
                        >
                            ✕
                        </button>


                        <div className="stock-modal-icon">
                            📦
                        </div>


                        <h2>
                            Add Stock
                        </h2>


                        <p className="stock-modal-subtitle">

                            Add newly received stock to{" "}

                            <strong>
                                {selectedItem.item_name}
                            </strong>

                        </p>


                        <div className="stock-modal-info">

                            <div>

                                <span>
                                    Current Stock
                                </span>

                                <strong>

                                    {
                                        Number(
                                            selectedItem.available_quantity ||
                                            0
                                        ).toFixed(2)
                                    } kg

                                </strong>

                            </div>


                            <div>

                                <span>
                                    Minimum Stock
                                </span>

                                <strong>

                                    {
                                        Number(
                                            selectedItem.minimum_stock ||
                                            0
                                        ).toFixed(2)
                                    } kg

                                </strong>

                            </div>

                        </div>


                        <label className="stock-input-label">

                            Quantity to Add

                        </label>


                        <div className="stock-input-wrapper">

                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Enter quantity"
                                value={stockQuantity}
                                onChange={(e) =>
                                    setStockQuantity(
                                        e.target.value
                                    )
                                }
                                disabled={addingStock}
                            />

                            <span>
                                kg
                            </span>

                        </div>


                        {stockQuantity &&
                        Number(stockQuantity) > 0 && (

                            <div className="stock-new-total">

                                New Stock After Addition:

                                <strong>

                                    {(
                                        Number(
                                            selectedItem.available_quantity ||
                                            0
                                        ) +
                                        Number(
                                            stockQuantity
                                        )
                                    ).toFixed(2)} kg

                                </strong>

                            </div>

                        )}


                        <div className="stock-modal-actions">

                            <button
                                type="button"
                                className="stock-cancel-btn"
                                onClick={closeAddStock}
                                disabled={addingStock}
                            >
                                Cancel
                            </button>


                            <button
                                type="button"
                                className="stock-confirm-btn"
                                onClick={addStock}
                                disabled={

                                    addingStock ||

                                    !stockQuantity ||

                                    Number(
                                        stockQuantity
                                    ) <= 0

                                }
                            >

                                {addingStock
                                    ? "Adding..."
                                    : "Add Stock"}

                            </button>

                        </div>

                    </div>

                </div>

            )}

        </div>

    );

}

export default WarehouseDashboard;