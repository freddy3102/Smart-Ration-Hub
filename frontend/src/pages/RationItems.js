import { useEffect, useState } from "react";
import axios from "axios";
import Layout from "../components/Layout";
import RationItemForm from "../components/RationItemForm";
import "../styles/RationItems.css";

function RationItems() {

    const [items, setItems] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editData, setEditData] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = () => {

        axios
            .get("http://127.0.0.1:5000/ration-items")
            .then((response) => {
                setItems(response.data);
            })
            .catch((error) => {
                console.log(error);
            });

    };

    const deleteItem = (id) => {

        if (!window.confirm("Delete this item?"))
            return;

        axios
            .delete(`http://127.0.0.1:5000/ration-items/${id}`)
            .then((response) => {

                alert(response.data.message);
                fetchItems();

            })
            .catch((error)=> {

                if(error.response)
                    alert(error.response.data.message);
                else
                    alert("Server Error");

            });

    };

    const filteredItems = items.filter((item)=>

        item.item_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

    );

    return(

        <Layout>

            <div className="ration-page">

                <div className="page-header">

                    <h1>Ration Items</h1>

                    <button
                        className="add-btn"
                        onClick={()=>{
                            setEditData(null);
                            setShowForm(true);
                        }}
                    >
                        + Add Item
                    </button>

                </div>

                <input
                    className="search-box"
                    placeholder="🔍 Search Item..."
                    value={searchTerm}
                    onChange={(e)=>setSearchTerm(e.target.value)}
                />

                {showForm && (

                    <div
                        className="modal-overlay"
                        onClick={()=>{
                            setShowForm(false);
                            setEditData(null);
                        }}
                    >

                        <div
                            className="modal"
                            onClick={(e)=>e.stopPropagation()}
                        >

                            <button
                                className="close-btn"
                                onClick={()=>{
                                    setShowForm(false);
                                    setEditData(null);
                                }}
                            >
                                ✖
                            </button>

                            <RationItemForm

                                editData={editData}

                                onSuccess={()=>{
                                    fetchItems();
                                    setShowForm(false);
                                    setEditData(null);
                                }}

                            />

                        </div>

                    </div>

                )}

                <table className="ration-table">

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Item</th>
                            <th>Unit</th>
                            <th>Subsidy Price</th>
                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {filteredItems.map((item)=>(

                            <tr key={item.item_id}>

                                <td>{item.item_id}</td>

                                <td>{item.item_name}</td>

                                <td>{item.unit}</td>

                                <td>₹ {item.subsidy_price}</td>

                                <td>

                                    <button
                                        className="edit-btn"
                                        onClick={()=>{
                                            setEditData(item);
                                            setShowForm(true);
                                        }}
                                    >
                                        Edit
                                    </button>

                                    <button
                                        className="delete-btn"
                                        onClick={()=>
                                            deleteItem(item.item_id)
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

export default RationItems;