import { Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import BeneficiaryLogin from "./pages/BeneficiaryLogin";

import Dashboard from "./pages/Dashboard";
import Beneficiaries from "./pages/Beneficiaries";

function App() {

    return (
        <Routes>

            {/* Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* Admin Login */}
            <Route
                path="/admin-login"
                element={<Login />}
            />

            {/* Beneficiary Login */}
            <Route
                path="/beneficiary-login"
                element={<BeneficiaryLogin />}
            />

            {/* Admin Pages */}
            <Route
                path="/dashboard"
                element={<Dashboard />}
            />

            <Route
                path="/beneficiaries"
                element={<Beneficiaries />}
            />

        </Routes>
    );

}

export default App;