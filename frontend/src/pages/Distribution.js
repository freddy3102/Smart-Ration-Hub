import Layout from "../components/Layout";
import DistributionForm from "../components/DistributionForm";
import "../styles/Distribution.css";

function Distribution() {

    return (

        <Layout>

            <div className="distribution-page">

                <h1>Distribution Management</h1>

                <DistributionForm />

            </div>

        </Layout>

    );

}

export default Distribution;