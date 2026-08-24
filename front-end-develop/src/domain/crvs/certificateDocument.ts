// Demo birth-certificate document generation (spec §24-§26). Everything here
// is client-side and offline: jsPDF renders the PDF (already a project
// dependency, see hooks/useExport.tsx), the `qrcode` package renders the QR
// locally (no external QR service call), crypto-js produces the "signature
// digest" metadata. None of this is a real PKI signature or a legally valid
// document — every certificate carries a prominent demo watermark and the
// signature block explicitly says so.
import jsPDF from "jspdf";
import QRCode from "qrcode";
import CryptoJS from "crypto-js";
import { CertificateConfig, DemoBirthCertificate } from "./types";

export const DEFAULT_DEMO_WATERMARK = "DEMO — NOT A LEGALLY VALID CERTIFICATE";

export function buildCertificateDigest(fields: {
  certificateNumber: string;
  birthRecordNumber: string;
  issuedAt: string;
  subjectLastName?: string;
  templateVersion: string;
}): string {
  const material = [
    fields.certificateNumber,
    fields.birthRecordNumber,
    fields.issuedAt,
    fields.subjectLastName || "",
    fields.templateVersion,
  ].join("|");
  return CryptoJS.SHA256(material).toString(CryptoJS.enc.Hex).slice(0, 32).toUpperCase();
}

/** The QR payload is deliberately minimal — a public verify URL plus an
 * opaque token. It must never carry record/parent/NIN/contact data or
 * internal database ids (spec §26). */
export function buildVerificationQrPayload(token: string, verifyBaseUrl = "/verify"): string {
  return `${verifyBaseUrl}?token=${encodeURIComponent(token)}`;
}

export async function buildCertificateQrDataUri(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { margin: 1, width: 220 });
}

export function buildCertificatePdf(
  certificate: DemoBirthCertificate,
  config: CertificateConfig,
  qrDataUri: string
): Blob {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const watermarkText = config.demoWatermarkText || DEFAULT_DEMO_WATERMARK;

  doc.setTextColor(225, 225, 225);
  doc.setFontSize(46);
  doc.text(watermarkText, pageWidth / 2, 420, { angle: 35, align: "center" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.text(config.issuingAuthorityLabel, margin, 60);

  doc.setFontSize(20);
  doc.text(config.certificateTitle, pageWidth / 2, 100, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(180, 30, 30);
  doc.text(watermarkText, pageWidth / 2, 122, { align: "center" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  let y = 160;
  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(value || "—", margin + 170, y);
    y += 22;
  };

  const fullName = [certificate.subject.firstName, certificate.subject.middleName, certificate.subject.lastName]
    .filter(Boolean)
    .join(" ");

  line("Certificate number", certificate.certificateNumber);
  line("Birth record number", certificate.birthRecordNumber);
  line("Full name", fullName || "—");
  line("Sex", certificate.subject.sex);
  line("Date of birth", certificate.subject.dateOfBirth);
  line("Place of birth", certificate.subject.placeOfBirth);
  line("Mother's name", certificate.parentSummary.motherName);
  if (certificate.parentSummary.fatherName) line("Father's name", certificate.parentSummary.fatherName);
  line("Issue date", certificate.issuedAt.slice(0, 10));

  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Demo signature", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Signed by ${certificate.signature.signerName} (${certificate.signature.signerRole})`, margin, y);
  y += 16;
  doc.text(certificate.signature.notice, margin, y);
  y += 16;
  doc.text(`Certificate digest: ${certificate.signature.digest}`, margin, y);

  doc.addImage(qrDataUri, "PNG", pageWidth - margin - 110, 150, 110, 110);
  doc.setFontSize(9);
  doc.text("Scan to verify", pageWidth - margin - 110, 270);
  doc.text(`Code: ${certificate.verification.verificationCode}`, pageWidth - margin - 110, 284);

  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(config.footerText, margin, pageHeight - 40, { maxWidth: pageWidth - margin * 2 });
  doc.text(`Template version ${config.templateVersion}`, margin, pageHeight - 26);

  return doc.output("blob");
}

export async function generateCertificatePdfBlob(
  certificate: DemoBirthCertificate,
  config: CertificateConfig
): Promise<Blob> {
  const qrDataUri = await buildCertificateQrDataUri(certificate.verification.qrPayload);
  return buildCertificatePdf(certificate, config, qrDataUri);
}
