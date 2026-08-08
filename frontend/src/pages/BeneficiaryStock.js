import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/BeneficiaryStock.css";

function BeneficiaryStock() {

    const [stock, setStock] = useState([]);
    const [loading, setLoading] = useState(true);

    const beneficiary_id =
        localStorage.getItem("beneficiary_id");

    useEffect(() => {

        axios.get(
            "http://localhost:5000/beneficiary-dashboard",
            {
                params: {
                    beneficiary_id: beneficiary_id
                }
            }
        )
        .then((res) => {

            setStock(res.data.live_stock || []);

        })
        .catch((err) => {

            console.log(err);

        })
        .finally(() => {

            setLoading(false);

        });

    }, [beneficiary_id]);


    if (loading) {

        return (
            <div className="beneficiary-stock-page">
                <h1>Live Stock Availability</h1>
                <p>Loading stock...</p>
            </div>
        );

    }


    return (

        <div className="beneficiary-stock-page">

            <h1>
                Live Stock Availability
            </h1>

            <p className="stock-subtitle">
                Current availability of ration items at the ration shop.
            </p>


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

                        stock.map((item, index) => (

                            <tr key={index}>

                                <td>
                                    {item.item_name}
                                </td>

                                <td>
                                    {Number(
                                        item.available_quantity
                                    ).toFixed(2)} kg
                                </td>

                                <td>

                                    {Number(
                                        item.available_quantity
                                    ) > 0 ? (

                                        <span className="stock-available">
                                            Available
                                        </span>

                                    ) : (

                                        <span className="stock-unavailable">
                                            Out of Stock
                                        </span>

                                    )}

                                </td>

                            </tr>

                        ))

                    ) : (

                        <tr>

                            <td
                                colSpan="3"
                                className="no-stock"
                            >
                                No stock information available.
                            </td>

                        </tr>

                    )}

                </tbody>

            </table>

        </div>

    );

}

export default BeneficiaryStock;