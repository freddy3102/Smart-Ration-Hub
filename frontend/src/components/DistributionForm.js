import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/DistributionForm.css";

function DistributionForm() {

    const [beneficiaries, setBeneficiaries] = useState([]);
    const [items, setItems] = useState([]);

    const [formData, setFormData] = useState({
        beneficiary_id: "",
        item_id: "",
        quantity_given: "",
        distributed_by: 1
    });

    // Load beneficiaries
    useEffect(() => {

        axios
            .get("http://127.0.0.1:5000/beneficiaries")
            .then((response) => {
                setBeneficiaries(response.data);
            })
            .catch((error) => {
                console.log(error);
            });

    }, []);

    // Load ration items
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

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            const response = await axios.post(
                "http://127.0.0.1:5000/distribution",
                formData
            );

            alert(response.data.message);

            setFormData({
                beneficiary_id: "",
                item_id: "",
                quantity_given: "",
                distributed_by: 1
            });

        } catch (error) {

            if (error.response)
                alert(error.response.data.message);
            else
                alert("Server Error");

        }

    };

    return (

        <form onSubmit={handleSubmit}>

            <h2>Distribute Ration</h2>

            {/* Beneficiary */}

            <div className="form-group">

                <label>Beneficiary</label>

                <select
                    name="beneficiary_id"
                    value={formData.beneficiary_id}
                    onChange={handleChange}
                    required
                >

                    <option value="">
                        Select Beneficiary
                    </option>

                    {beneficiaries.map((b) => (

                        <option
                            key={b.beneficiary_id}
                            value={b.beneficiary_id}
                        >
                            {b.full_name} ({b.ration_card_no})
                        </option>

                    ))}

                </select>

            </div>

            {/* Item */}

            <div className="form-group">

                <label>Ration Item</label>

                <select
                    name="item_id"
                    value={formData.item_id}
                    onChange={handleChange}
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

            {/* Quantity */}

            <div className="form-group">

                <label>Quantity</label>

                <input
                    type="number"
                    step="0.01"
                    name="quantity_given"
                    value={formData.quantity_given}
                    onChange={handleChange}
                    placeholder="Enter Quantity"
                    required
                />

            </div>

            <button type="submit">
                Distribute
            </button>

        </form>

    );

}

export default DistributionForm;