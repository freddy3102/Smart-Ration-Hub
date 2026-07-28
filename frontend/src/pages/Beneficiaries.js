import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import BeneficiaryForm from "../components/BeneficiaryForm";
import "../styles/Beneficiaries.css";

function Beneficiaries() {

    const [showForm, setShowForm] = useState(false);
    const [beneficiaries, setBeneficiaries] = useState([]);

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    const fetchBeneficiaries = () => {
        axios
            .get("http://127.0.0.1:5000/beneficiaries")
            .then((response) => {
                setBeneficiaries(response.data);
            })
            .catch((error) => {
                console.log(error);
            });
    };

    return (
        <Layout>

            <div className="beneficiaries-page">

                <div className="page-header">

                    <h1>Beneficiary Management</h1>

                    <button
                        className="add-btn"
                        onClick={() => setShowForm(true)}
                    >
                        + Add Beneficiary
                    </button>

                </div>

                {showForm && (
                    <div
                        className="modal-overlay"
                        onClick={() => setShowForm(false)}
                    >
                        <div
                            className="modal"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                className="close-btn"
                                onClick={() => setShowForm(false)}
                            >
                                ✖
                            </button>

                            <BeneficiaryForm
                                onSuccess={() => {
                                    fetchBeneficiaries();
                                    setShowForm(false);
                                }}
                            />

                        </div>
                    </div>
                )}

                <table className="beneficiary-table">

                    <thead>
    <tr>
        <th>ID</th>
        <th>Ration Card No</th>
        <th>Name</th>
        <th>Aadhaar</th>
        <th>Phone</th>
        <th>Card Type</th>
        <th>Actions</th>
    </tr>
</thead>

                    <tbody>

    {beneficiaries.map((beneficiary) => (

        <tr key={beneficiary.beneficiary_id}>

            <td>{beneficiary.beneficiary_id}</td>

            <td>{beneficiary.ration_card_no}</td>

            <td>{beneficiary.full_name}</td>

            <td>{beneficiary.aadhaar_no}</td>

            <td>{beneficiary.phone}</td>

            <td>{beneficiary.category_name}</td>

            <td>

                <button className="edit-btn">
                    Edit
                </button>

                <button className="delete-btn">
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

export default Beneficiaries;