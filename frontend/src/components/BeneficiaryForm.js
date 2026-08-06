import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Form.css";

function BeneficiaryForm({ onSuccess, editData }) {

    const [formData, setFormData] = useState({
        ration_card_no: "",
        full_name: "",
        aadhaar_no: "",
        phone: "",
        address: "",
        category_id: "",
        family_members: "",
        username: "",
        password: "",
        status: "Active"
    });

    const [categories, setCategories] = useState([]);

    useEffect(() => {
        axios
            .get("http://127.0.0.1:5000/categories")
            .then((response) => {
                setCategories(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    }, []);

    useEffect(() => {

        if (editData) {

            setFormData({
                ration_card_no: editData.ration_card_no,
                full_name: editData.full_name,
                aadhaar_no: editData.aadhaar_no,
                phone: editData.phone,
                address: editData.address,
                category_id: editData.category_id,
                family_members: editData.family_members,
                username: editData.username,
                password: "",
                status: editData.status
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

            let response;

            if (editData) {

                response = await axios.put(
                    `http://127.0.0.1:5000/beneficiaries/${editData.beneficiary_id}`,
                    formData
                );

            } else {

                response = await axios.post(
                    "http://127.0.0.1:5000/beneficiaries",
                    formData
                );

            }

            alert(response.data.message);

            setFormData({
                ration_card_no: "",
                full_name: "",
                aadhaar_no: "",
                phone: "",
                address: "",
                category_id: "",
                family_members: "",
                username: "",
                password: "",
                status: "Active"
            });

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
                {editData ? "Update Beneficiary" : "Add Beneficiary"}
            </h2>

            <input
                type="text"
                name="ration_card_no"
                placeholder="Ration Card Number"
                value={formData.ration_card_no}
                onChange={handleChange}
                required
                disabled={editData}
            />

            <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleChange}
                required
            />

            <input
                type="text"
                name="aadhaar_no"
                placeholder="Aadhaar Number"
                value={formData.aadhaar_no}
                onChange={handleChange}
                required
                disabled={editData}
            />

            <input
                type="text"
                name="phone"
                placeholder="Phone Number"
                value={formData.phone}
                onChange={handleChange}
                required
            />

            <input
                type="text"
                name="address"
                className="full-width"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
            />

            <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
            >
                <option value="">Select Card Category</option>

                {categories.map((category) => (
                    <option
                        key={category.category_id}
                        value={category.category_id}
                    >
                        {category.category_name}
                    </option>
                ))}
            </select>

            <input
                type="number"
                name="family_members"
                placeholder="Family Members"
                value={formData.family_members}
                onChange={handleChange}
                required
            />

            <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={editData}
            />

            {!editData && (
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
            )}

            {editData && (
                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            )}

            <button type="submit">
                {editData ? "Update Beneficiary" : "Save Beneficiary"}
            </button>

        </form>

    );
}

export default BeneficiaryForm;