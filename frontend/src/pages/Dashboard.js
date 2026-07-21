import { useEffect, useState } from "react";
import axios from "axios";

function Dashboard() {

    const [data, setData] = useState({
        total_beneficiaries: 0,
        total_inventory_items: 0,
        total_distributions: 0,
        low_stock_items: 0
    });

    useEffect(() => {

        axios.get("http://127.0.0.1:5000/dashboard")
        .then((response)=>{
            setData(response.data);
        })
        .catch((error)=>{
            console.log(error);
        });

    }, []);

    return (

        <div style={{padding:"40px"}}>

            <h1>📊 Smart Ration Hub Dashboard</h1>

            <hr/>

            <div style={{
                display:"grid",
                gridTemplateColumns:"repeat(2,250px)",
                gap:"20px",
                marginTop:"30px"
            }}>

                <div style={cardStyle}>
                    <h3>Total Beneficiaries</h3>
                    <h1>{data.total_beneficiaries}</h1>
                </div>

                <div style={cardStyle}>
                    <h3>Inventory Items</h3>
                    <h1>{data.total_inventory_items}</h1>
                </div>

                <div style={cardStyle}>
                    <h3>Total Distributions</h3>
                    <h1>{data.total_distributions}</h1>
                </div>

                <div style={cardStyle}>
                    <h3>Low Stock</h3>
                    <h1>{data.low_stock_items}</h1>
                </div>

            </div>

        </div>

    );

}

const cardStyle = {
    background:"#fff",
    padding:"20px",
    borderRadius:"10px",
    boxShadow:"0 0 10px rgba(0,0,0,0.15)",
    textAlign:"center"
};

export default Dashboard;