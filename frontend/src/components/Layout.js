import { Link } from "react-router-dom";
import "../styles/Layout.css";

function Layout({ children }) {
    return (
        <div className="layout">

            <div className="sidebar">

                <h2>🍚 Smart Ration Hub</h2>

                <hr />

                <Link to="/dashboard">Dashboard</Link>

                <Link to="/beneficiaries">Beneficiaries</Link>

                <Link to="#">Inventory</Link>

                <Link to="#">Distribution</Link>

                <Link to="#">Reports</Link>

                <Link to="/">Logout</Link>

            </div>

            <div className="main-content">
                {children}
            </div>

        </div>
    );
}

export default Layout;