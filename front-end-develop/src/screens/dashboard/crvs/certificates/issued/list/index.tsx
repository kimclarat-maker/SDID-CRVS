import CertificateListTable from "../../components/CertificateListTable";
import "../../../shared.css";

export default function IssuedCertificatesList() {
  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Issued certificates</h1>
        <p className="crvs-page-subtitle">Active demo birth certificates.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>
      <CertificateListTable status="ACTIVE" />
    </div>
  );
}
