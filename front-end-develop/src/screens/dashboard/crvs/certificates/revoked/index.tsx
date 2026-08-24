import CertificateListTable from "../components/CertificateListTable";
import "../../shared.css";

export default function RevokedCertificates() {
  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Revoked certificates</h1>
        <p className="crvs-page-subtitle">Certificates revoked by a Supervisor or Registrar.</p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>
      <CertificateListTable status="REVOKED" />
    </div>
  );
}
