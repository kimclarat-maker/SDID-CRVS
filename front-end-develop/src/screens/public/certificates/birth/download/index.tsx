import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { saveAs } from "file-saver";
import PageHeader from "@/components/public/PageHeader";
import Section from "@/components/public/Section";
import Notice from "@/components/public/Notice";
import DemoBadge from "@/components/demoBadge";
import {
  demoRecordCertificateDownload,
  demoResolveDownloadAccessToken,
  DownloadAccessResult,
} from "@/demo/services/crvsCertificates";
import { generateCertificatePdfBlob } from "@/domain/crvs/certificateDocument";
import { getDemoData } from "@/demo/storage/demoStore";
import { isDemoMode } from "@/demo/config";

const PUBLIC_ACTOR_NAME = "Public requester";

/** Secure download page (spec §28). Validates the opaque access token,
 * shows a summary before download, and blocks download of expired/revoked
 * certificates. Never exposes internal database ids. */
export default function BirthCertificateDownload() {
  const { accessToken } = useParams<{ accessToken: string }>();
  const [result, setResult] = useState<DownloadAccessResult | undefined>();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!accessToken || !isDemoMode()) {
        setLoading(false);
        return;
      }
      const res = await demoResolveDownloadAccessToken(accessToken);
      setResult(res);
      setLoading(false);
    })();
  }, [accessToken]);

  const handleDownload = async () => {
    if (!result || result.outcome !== "VALID") return;
    setDownloading(true);
    try {
      const config = getDemoData().crvsCertificateConfig;
      const blob = await generateCertificatePdfBlob(result.certificate, config);
      saveAs(blob, result.certificate.document.fileName);
      demoRecordCertificateDownload(result.certificate.id, PUBLIC_ACTOR_NAME);
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <Section>
        <Notice type="info" title="Checking link">
          Validating your secure download link…
        </Notice>
      </Section>
    );
  }

  return (
    <>
      <PageHeader title="Download your certificate" eyebrow="Certificates" />
      <Section>
        {isDemoMode() && (
          <p style={{ marginBottom: "1rem" }}>
            <DemoBadge /> Demo certificates are watermarked "DEMO — NOT A LEGALLY VALID CERTIFICATE".
          </p>
        )}

        {!result || result.outcome === "NOT_FOUND" ? (
          <Notice type="warning" title="Link not recognized">
            This download link doesn't match any demo certificate.
          </Notice>
        ) : result.outcome === "EXPIRED" ? (
          <Notice type="warning" title="Link expired">
            This secure download link has expired. Request a new link from your certificate request status page.
          </Notice>
        ) : result.outcome === "REVOKED" ? (
          <Notice type="danger" title="Certificate revoked">
            This certificate has been revoked and can no longer be downloaded. Contact your registration office if you
            believe this is an error.
          </Notice>
        ) : (
          <>
            <dl className="public-fact-list" style={{ marginBottom: "1.5rem" }}>
              <div>
                <dt>Certificate number</dt>
                <dd>{result.certificate.certificateNumber}</dd>
              </div>
              <div>
                <dt>Issuing authority</dt>
                <dd>{result.certificate.issuingAuthority}</dd>
              </div>
              <div>
                <dt>Issue date</dt>
                <dd>{new Date(result.certificate.issuedAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>Active</dd>
              </div>
            </dl>
            <button
              type="button"
              className="public-btn public-btn-primary"
              onClick={handleDownload}
              disabled={downloading}
              data-testid="secure-download-button"
            >
              {downloading ? "Preparing…" : "Download demo certificate (PDF)"}
            </button>
          </>
        )}
      </Section>
    </>
  );
}
