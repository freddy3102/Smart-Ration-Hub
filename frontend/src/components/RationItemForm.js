import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/RationItemForm.css";

function RationItemForm({ editData, onSuccess }) {

    const [formData, setFormData] = useState({
        item_name: "",
        unit: "",
        subsidy_price: ""
    });

    useEffect(() => {

        if (editData) {

            setFormData({
                item_name: editData.item_name,
                unit: editData.unit,
                subsidy_price: editData.subsidy_price
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
                    `http://127.0.0.1:5000/ration-items/${editData.item_id}`,
                    formData
                );

                alert(response.data.message);

            } else {

                const response = await axios.post(
                    "http://127.0.0.1:5000/ration-items",
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
                {editData ? "Update Ration Item" : "Add Ration Item"}
            </h2>

            <div className="form-group">

                <label>Item Name</label>

                <input
                    type="text"
                    name="item_name"
                    value={formData.item_name}
                    onChange={handleChange}
                    placeholder="Enter Item Name"
                    required
                />

            </div>

            <div className="form-group">

                <label>Unit</label>

                <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    required
                >

                    <option value="">Select Unit</option>
                    <option value="Kg">Kg</option>
                    <option value="Litre">Litre</option>
                    <option value="Packet">Packet</option>

                </select>

            </div>

            <div className="form-group">

                <label>Subsidy Price (₹)</label>

                <input
                    type="number"
                    step="0.01"
                    name="subsidy_price"
                    value={formData.subsidy_price}
                    onChange={handleChange}
                    placeholder="Enter Subsidy Price"
                    required
                />

            </div>

            <button type="submit">

                {editData
                    ? "Update Item"
                    : "Save Item"}

            </button>

        </form>

    );

}

export default RationItemForm;