import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import InventoryForm from "../components/InventoryForm";
import "../styles/Inventory.css";

function Inventory() {

    const [inventory, setInventory] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editData, setEditData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = () => {

        axios
            .get("http://127.0.0.1:5000/inventory")
            .then((response) => {
                setInventory(response.data);
            })
            .catch((error) => {
                console.log(error);
            });

    };

    const deleteInventory = (id) => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this inventory item?"
        );

        if (!confirmDelete) return;

        axios
            .delete(`http://127.0.0.1:5000/inventory/${id}`)
            .then((response) => {

                alert(response.data.message);

                fetchInventory();

            })
            .catch((error) => {

                if (error.response) {
                    alert(error.response.data.message);
                } else {
                    alert("Unable to delete inventory.");
                }

            });

    };

    const filteredInventory = inventory.filter((item) =>
        item.item_name
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
    );

    const availableCount = inventory.filter(
        (item) => item.stock_status === "Available"
    ).length;

    const lowStockCount = inventory.filter(
        (item) => item.stock_status === "Low Stock"
    ).length;

    const outStockCount = inventory.filter(
        (item) => item.stock_status === "Out of Stock"
    ).length;

    return (

        <Layout>

            <div className="inventory-page">

                <div className="page-header">

                    <h1>Inventory Management</h1>

                    <button
                        className="add-btn"
                        onClick={() => {
                            setEditData(null);
                            setShowForm(true);
                        }}
                    >
                        + Add Inventory
                    </button>

                </div>

                {/* Summary Cards */}

                <div className="summary-cards">

                    <div className="summary-card total-card">

                        <h3>📦 Total Items</h3>

                        <h2>{inventory.length}</h2>

                    </div>

                    <div className="summary-card available-card">

                        <h3>🟢 Available</h3>

                        <h2>{availableCount}</h2>

                    </div>

                    <div className="summary-card low-card">

                        <h3>🟠 Low Stock</h3>

                        <h2>{lowStockCount}</h2>

                    </div>

                    <div className="summary-card out-card">

                        <h3>🔴 Out of Stock</h3>

                        <h2>{outStockCount}</h2>

                    </div>

                </div>

                {/* Search */}

                <input
                    type="text"
                    className="search-box"
                    placeholder="🔍 Search Item..."
                    value={searchTerm}
                    onChange={(e) =>
                        setSearchTerm(e.target.value)
                    }
                />

                {/* Modal */}

                {showForm && (

                    <div
                        className="modal-overlay"
                        onClick={() => {
                            setShowForm(false);
                            setEditData(null);
                        }}
                    >

                        <div
                            className="modal"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            <button
                                className="close-btn"
                                onClick={() => {
                                    setShowForm(false);
                                    setEditData(null);
                                }}
                            >
                                ✖
                            </button>

                            <InventoryForm
                                editData={editData}
                                onSuccess={() => {
                                    fetchInventory();
                                    setShowForm(false);
                                    setEditData(null);
                                }}
                            />

                        </div>

                    </div>

                )}

                {/* Inventory Table */}

                <table className="inventory-table">

                    <thead>

                        <tr>

                            <th>ID</th>

                            <th>Item Name</th>

                            <th>Unit</th>

                            <th>Subsidy Price</th>

                            <th>Available Qty</th>

                            <th>Minimum Stock</th>

                            <th>Status</th>

                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredInventory.map((item) => (

                            <tr key={item.inventory_id}>

                                <td>{item.inventory_id}</td>

                                <td>{item.item_name}</td>

                                <td>{item.unit}</td>

                                <td>₹ {item.subsidy_price}</td>

                                <td>{item.available_quantity}</td>

                                <td>{item.minimum_stock}</td>

                                <td>

                                    <span
                                        className={`status ${item.stock_status
                                            .replace(/\s/g, "")
                                            .toLowerCase()}`}
                                    >
                                        {item.stock_status}
                                    </span>

                                </td>

                                <td>

                                    <button
                                        className="edit-btn"
                                        onClick={() => {
                                            setEditData(item);
                                            setShowForm(true);
                                        }}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            deleteInventory(
                                                item.inventory_id
                                            )
                                        }
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </Layout>

    );

}

export default Inventory;