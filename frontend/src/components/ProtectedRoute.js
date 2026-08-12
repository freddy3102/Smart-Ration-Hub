import {
    Navigate,
    Outlet,
    useLocation
} from "react-router-dom";

import { useEffect } from "react";


function ProtectedRoute() {

    const location = useLocation();


    // =================================
    // Prevent Browser Back Cache
    // =================================

    useEffect(() => {

        const handlePageShow = (event) => {

            /*
             * When the browser restores a page
             * from its Back/Forward cache,
             * force a reload so authentication
             * is checked again.
             */

            if (event.persisted) {

                window.location.reload();

            }

        };


        window.addEventListener(
            "pageshow",
            handlePageShow
        );


        return () => {

            window.removeEventListener(
                "pageshow",
                handlePageShow
            );

        };

    }, []);


    const path =
        location.pathname;


    // =================================
    // Warehouse Routes
    // =================================

    const warehousePaths = [

        "/warehouse-dashboard",

        "/warehouse-audit",

        "/warehouse-verification"

    ];


    // =================================
    // Beneficiary Routes
    // =================================

    const beneficiaryPaths = [

        "/beneficiary-dashboard",

        "/beneficiary-stock",

        "/beneficiary-history",

        "/beneficiary-reports"

    ];


    const isWarehousePage =
        warehousePaths.includes(path);


    const isBeneficiaryPage =
        beneficiaryPaths.includes(path);


    // =================================
    // Warehouse Authentication
    // =================================

    if (isWarehousePage) {

        const warehouseManager =
            localStorage.getItem(
                "warehouse_manager"
            );


        if (!warehouseManager) {

            return (

                <Navigate
                    to="/warehouse-login"
                    replace
                />

            );

        }


        return <Outlet />;

    }


    // =================================
    // Beneficiary Authentication
    // =================================

    if (isBeneficiaryPage) {

        const beneficiaryId =
            localStorage.getItem(
                "beneficiary_id"
            );


        if (!beneficiaryId) {

            return (

                <Navigate
                    to="/beneficiary-login"
                    replace
                />

            );

        }


        return <Outlet />;

    }


    // =================================
    // Admin Authentication
    // =================================

    const adminSession =
        sessionStorage.getItem(
            "admin_authenticated"
        );


    if (!adminSession) {

        return (

            <Navigate
                to="/admin-login"
                replace
            />

        );

    }


    return <Outlet />;

}


export default ProtectedRoute;