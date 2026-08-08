import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/BeneficiaryDashboard.css";
import BeneficiaryLayout from "../components/BeneficiaryLayout";


function BeneficiaryDashboard() {

    const [data, setData] = useState(null);

    const beneficiary_id =
        localStorage.getItem("beneficiary_id");


    // ---------------------------------
    // Month & Year
    // ---------------------------------

    const [selectedMonth, setSelectedMonth] =
        useState(8);

    const [selectedYear, setSelectedYear] =
        useState(2026);


    // ---------------------------------
    // Load Dashboard
    // ---------------------------------

    const loadDashboard = () => {

        axios.get(
            "http://localhost:5000/beneficiary-dashboard",
            {
                params: {

                    beneficiary_id:
                        beneficiary_id,

                    month:
                        selectedMonth,

                    year:
                        selectedYear

                }
            }
        )
        .then((res) => {

            setData(res.data);

        })
        .catch((err) => {

            console.log(err);

        });

    };


    // ---------------------------------
    // Load When Month/Year Changes
    // ---------------------------------

    useEffect(() => {

        loadDashboard();

    }, [
        beneficiary_id,
        selectedMonth,
        selectedYear
    ]);


    // ---------------------------------
    // Loading
    // ---------------------------------

    if (!data) {

        return (

            <BeneficiaryLayout>

                <div className="loading">

                    Loading...

                </div>

            </BeneficiaryLayout>

        );

    }


    return (

        <BeneficiaryLayout>

            <div className="beneficiary-dashboard">

                {/* =================================
                    Welcome
                ================================= */}

                <h1 className="dashboard-title">

                    Welcome,{" "}

                    {data.beneficiary.full_name}

                </h1>


                <div className="info-card">

                    <p>

                        <strong>
                            Category:
                        </strong>{" "}

                        {data.beneficiary.category_name}

                    </p>

                </div>

            </div>

        </BeneficiaryLayout>

    );

}


export default BeneficiaryDashboard;