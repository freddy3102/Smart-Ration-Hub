import "../styles/BeneficiaryReports.css";

function BeneficiaryReports() {

    return (

        <div className="beneficiary-reports-page">

            <h1>
                Monthly Reports
            </h1>

            <p className="reports-subtitle">
                View monthly ration distribution and verification reports.
            </p>

            <div className="report-placeholder">

                <h2>
                    Monthly Verification Report
                </h2>

                <p>
                    Monthly entitlement, claimed, unclaimed,
                    returned and verification details will be
                    displayed here.
                </p>

            </div>

        </div>

    );

}

export default BeneficiaryReports;