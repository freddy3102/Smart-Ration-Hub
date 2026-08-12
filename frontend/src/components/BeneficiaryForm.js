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


    // ---------------------------------
    // Handle Input Changes
    // ---------------------------------

    const handleChange = (e) => {

        const { name, value } = e.target;

        let updatedValue = value;


        // Ration Card:
        // RC + 4 numbers
        if (name === "ration_card_no") {

            updatedValue = value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "");

            // Keep maximum 6 characters: RC1234
            updatedValue = updatedValue.slice(0, 6);

        }


        // Aadhaar:
        // Numbers only, maximum 12 digits
        if (name === "aadhaar_no") {

            updatedValue = value
                .replace(/\D/g, "")
                .slice(0, 12);

        }


        // Phone:
        // Numbers only, maximum 10 digits
        if (name === "phone") {

            updatedValue = value
                .replace(/\D/g, "")
                .slice(0, 10);

        }


        setFormData({
            ...formData,
            [name]: updatedValue
        });

    };


    // ---------------------------------
    // Validation
    // ---------------------------------

    const validateForm = () => {

        // Ration Card Validation
        const rationCardPattern =
            /^RC\d{4}$/;

        if (
            !rationCardPattern.test(
                formData.ration_card_no
            )
        ) {

            alert(
                "Ration Card Number must be in the format RC1234."
            );

            return false;

        }


        // Aadhaar Validation
        const aadhaarPattern =
            /^\d{12}$/;

        if (
            !aadhaarPattern.test(
                formData.aadhaar_no
            )
        ) {

            alert(
                "Aadhaar Number must contain exactly 12 digits."
            );

            return false;

        }


        // Phone Validation
        const phonePattern =
            /^[6-9]\d{9}$/;

        if (
            !phonePattern.test(
                formData.phone
            )
        ) {

            alert(
                "Phone Number must contain exactly 10 digits and start with 6, 7, 8 or 9."
            );

            return false;

        }


        return true;

    };


    // ---------------------------------
    // Submit
    // ---------------------------------

    const handleSubmit = async (e) => {

        e.preventDefault();


        // Stop submission if validation fails
        if (!validateForm()) {
            return;
        }


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


            alert(
                response.data.message
            );


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

                alert(
                    error.response.data.message
                );

            } else {

                alert(
                    "Server Error"
                );

            }

        }

    };


    return (

        <form onSubmit={handleSubmit}>

            <h2>
                {editData
                    ? "Update Beneficiary"
                    : "Add Beneficiary"}
            </h2>


            {/* Ration Card */}

            <input
                type="text"
                name="ration_card_no"
                placeholder="Ration Card Number (RC1234)"
                value={formData.ration_card_no}
                onChange={handleChange}
                required
                disabled={editData}
                maxLength={6}
            />


            {/* Full Name */}

            <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={formData.full_name}
                onChange={handleChange}
                required
            />


            {/* Aadhaar */}

            <input
                type="text"
                name="aadhaar_no"
                placeholder="Aadhaar Number (12 digits)"
                value={formData.aadhaar_no}
                onChange={handleChange}
                required
                disabled={editData}
                maxLength={12}
                inputMode="numeric"
            />


            {/* Phone */}

            <input
                type="text"
                name="phone"
                placeholder="Phone Number (10 digits)"
                value={formData.phone}
                onChange={handleChange}
                required
                maxLength={10}
                inputMode="numeric"
            />


            {/* Address */}

            <input
                type="text"
                name="address"
                className="full-width"
                placeholder="Address"
                value={formData.address}
                onChange={handleChange}
                required
            />


            {/* Category */}

            <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                required
            >

                <option value="">
                    Select Card Category
                </option>

                {categories.map(
                    (category) => (

                        <option
                            key={
                                category.category_id
                            }
                            value={
                                category.category_id
                            }
                        >

                            {
                                category.category_name
                            }

                        </option>

                    )
                )}

            </select>


            {/* Family Members */}

            <input
                type="number"
                name="family_members"
                placeholder="Family Members"
                value={formData.family_members}
                onChange={handleChange}
                required
            />


            {/* Username */}

            <input
                type="text"
                name="username"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
                required
                disabled={editData}
            />


            {/* Password */}

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


            {/* Status */}

            {editData && (

                <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                >

                    <option value="Active">
                        Active
                    </option>

                    <option value="Inactive">
                        Inactive
                    </option>

                </select>

            )}


            <button type="submit">

                {editData
                    ? "Update Beneficiary"
                    : "Save Beneficiary"}

            </button>

        </form>

    );

}

export default BeneficiaryForm;