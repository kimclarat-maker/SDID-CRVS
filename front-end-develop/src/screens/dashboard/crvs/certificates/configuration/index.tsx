import { useState } from "react";
import Button from "@/components/button";
import { getDemoData, updateDemoData } from "@/demo/storage/demoStore";
import { CertificateDeliveryMethod } from "@/domain/crvs/types";
import toastMessage from "@/utils/common/toastMessage";
import "../../shared.css";

const DELIVERY_OPTIONS: { value: CertificateDeliveryMethod; label: string }[] = [
  { value: "SECURE_DOWNLOAD", label: "Secure download" },
  { value: "EMAIL", label: "Email" },
  { value: "SMS_LINK", label: "SMS download link" },
  { value: "ASSISTED_CENTRE_COLLECTION", label: "Assisted-centre collection" },
];

export default function CertificateConfiguration() {
  const [config, setConfig] = useState(() => ({ ...getDemoData().crvsCertificateConfig }));
  const [saving, setSaving] = useState(false);

  const toggleChannel = (value: CertificateDeliveryMethod) => {
    setConfig((prev) => ({
      ...prev,
      deliveryChannelsEnabled: prev.deliveryChannelsEnabled.includes(value)
        ? prev.deliveryChannelsEnabled.filter((v) => v !== value)
        : [...prev.deliveryChannelsEnabled, value],
    }));
  };

  const handleSave = () => {
    setSaving(true);
    try {
      updateDemoData((db) => {
        db.crvsCertificateConfig = config;
        return db;
      });
      toastMessage("success", "Certificate configuration saved.");
    } catch (err) {
      toastMessage("error", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="crvs-page">
      <div className="crvs-page-header">
        <h1 className="crvs-page-title">Certificate configuration</h1>
        <p className="crvs-page-subtitle">
          Demo-only settings for templates, fees, validity, and delivery. Individual registered birth facts cannot be
          edited from this page.
        </p>
        <span className="crvs-demo-note">Demo data — fictional</span>
      </div>

      <div className="crvs-section" style={{ maxWidth: 640, display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="crvs-form-group">
          <label htmlFor="cfg-authority">Issuing authority label</label>
          <input id="cfg-authority" value={config.issuingAuthorityLabel} onChange={(e) => setConfig({ ...config, issuingAuthorityLabel: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="cfg-title">Certificate title</label>
          <input id="cfg-title" value={config.certificateTitle} onChange={(e) => setConfig({ ...config, certificateTitle: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="cfg-template">Template version</label>
          <input id="cfg-template" value={config.templateVersion} onChange={(e) => setConfig({ ...config, templateVersion: e.target.value })} />
        </div>
        <div className="crvs-form-group">
          <label htmlFor="cfg-footer">Footer text</label>
          <textarea id="cfg-footer" rows={2} value={config.footerText} onChange={(e) => setConfig({ ...config, footerText: e.target.value })} />
        </div>
        <div className="crvs-form-grid">
          <div className="crvs-form-group">
            <label htmlFor="cfg-fee">Fee</label>
            <input id="cfg-fee" type="number" min={0} value={config.fee} onChange={(e) => setConfig({ ...config, fee: Number(e.target.value) })} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="cfg-currency">Currency</label>
            <input id="cfg-currency" value={config.currency} onChange={(e) => setConfig({ ...config, currency: e.target.value })} />
          </div>
          <div className="crvs-form-group">
            <label htmlFor="cfg-expiry">Download-link expiry (hours)</label>
            <input
              id="cfg-expiry"
              type="number"
              min={1}
              value={config.downloadLinkExpiryHours}
              onChange={(e) => setConfig({ ...config, downloadLinkExpiryHours: Number(e.target.value) })}
            />
          </div>
        </div>

        <div className="crvs-form-group">
          <label>Delivery channels enabled</label>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {DELIVERY_OPTIONS.map((opt) => (
              <label key={opt.value} style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
                <input
                  type="checkbox"
                  checked={config.deliveryChannelsEnabled.includes(opt.value)}
                  onChange={() => toggleChannel(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 400 }}>
          <input
            type="checkbox"
            checked={config.automaticIssuanceEnabled}
            onChange={(e) => setConfig({ ...config, automaticIssuanceEnabled: e.target.checked })}
          />
          Automatic issuance enabled for eligible, paid requests
        </label>

        <div className="crvs-form-group">
          <label htmlFor="cfg-watermark">Demo watermark text</label>
          <input id="cfg-watermark" value={config.demoWatermarkText} onChange={(e) => setConfig({ ...config, demoWatermarkText: e.target.value })} />
        </div>

        <div>
          <Button text="Save configuration" appearance="primary" loading={saving} onClick={handleSave} testId="save-certificate-configuration" />
        </div>
      </div>
    </div>
  );
}
