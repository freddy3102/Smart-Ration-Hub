import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/InventoryForm.css";

function InventoryForm({ editData, onSuccess }) {

    const [items, setItems] = useState([]);

    const [formData, setFormData] = useState({
        item_id: "",
        available_quantity: "",
        minimum_stock: ""
    });

    useEffect(() => {

        axios
            .get("http://127.0.0.1:5000/ration-items")
            .then((response) => {
                setItems(response.data);
            })
            .catch((error) => {
                console.log(error);
            });

    }, []);

    useEffect(() => {

        if (editData) {

            setFormData({
                item_id: editData.item_id,
                available_quantity: editData.available_quantity,
                minimum_stock: editData.minimum_stock
            });

        }

    }, [editData]);

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            if (editData) {

                const response = await axios.put(
                    `http://127.0.0.1:5000/inventory/${editData.inventory_id}`,
                    formData
                );

                alert(response.data.message);

            } else {

                const response = await axios.post(
                    "http://127.0.0.1:5000/inventory",
                    formData
                );

                alert(response.data.message);

            }

            if (onSuccess) {
                onSuccess();
            }

        } catch (error) {

            if (error.response) {
                alert(error.response.data.message);
            } else {
                alert("Server Error");
            }

        }

    };

    return (

        <form onSubmit={handleSubmit}>

            <h2>
                {editData ? "Update Inventory" : "Add Inventory"}
            </h2>

            <div className="form-group">

                <label>Item Name</label>

                <select
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleChange}
                    disabled={editData}
                    required
                >

                    <option value="">
                        Select Item
                    </option>

                    {items.map((item) => (

                        <option
                            key={item.item_id}
                            value={item.item_id}
                        >
                            {item.item_name}
                        </option>

                    ))}

                </select>

            </div>

            <div className="form-group">

                <label>Available Quantity</label>

                <input
                    type="number"
                    name="available_quantity"
                    placeholder="Enter Available Quantity"
                    value={formData.available_quantity}
                    onChange={handleChange}
                    required
                />

            </div>

            <div className="form-group">

                <label>Minimum Stock Alert</label>

                <input
                    type="number"
                    name="minimum_stock"
                    placeholder="Enter Minimum Stock"
                    value={formData.minimum_stock}
                    onChange={handleChange}
                    required
                />

            </div>

            <button type="submit">

                {editData
                    ? "Update Inventory"
                    : "Save Inventory"}

            </button>

        </form>

    );

}

export default InventoryForm;