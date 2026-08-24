import { describe, expect, it } from "vitest";
import {
  canTransitionCertificateRequest,
  assertTransitionCertificateRequest,
  canTransitionCertificate,
  assertTransitionCertificate,
} from "@/domain/crvs/statusMachines";
import { IllegalTransitionError } from "@/domain/crvs/statusMachines";

describe("certificate request status machine", () => {
  it("allows the automatic-issuance happy path", () => {
    expect(canTransitionCertificateRequest("DRAFT", "IDENTITY_VERIFICATION_REQUIRED")).toBe(true);
    expect(canTransitionCertificateRequest("IDENTITY_VERIFICATION_REQUIRED", "RECORD_LOOKUP_REQUIRED")).toBe(true);
    expect(canTransitionCertificateRequest("RECORD_LOOKUP_REQUIRED", "ELIGIBILITY_CHECK")).toBe(true);
    expect(canTransitionCertificateRequest("ELIGIBILITY_CHECK", "PAYMENT_PENDING")).toBe(true);
    expect(canTransitionCertificateRequest("PAYMENT_PENDING", "PAID")).toBe(true);
    expect(canTransitionCertificateRequest("PAID", "APPROVED")).toBe(true);
    expect(canTransitionCertificateRequest("APPROVED", "ISSUING")).toBe(true);
    expect(canTransitionCertificateRequest("ISSUING", "ISSUED")).toBe(true);
    expect(canTransitionCertificateRequest("ISSUED", "DELIVERED")).toBe(true);
  });

  it("rejects illegal jumps such as DRAFT straight to ISSUED", () => {
    expect(canTransitionCertificateRequest("DRAFT", "ISSUED")).toBe(false);
    expect(() => assertTransitionCertificateRequest("DRAFT", "ISSUED")).toThrow(IllegalTransitionError);
  });

  it("routes record-lookup failures correctly", () => {
    expect(canTransitionCertificateRequest("RECORD_LOOKUP_REQUIRED", "RECORD_NOT_FOUND")).toBe(true);
    expect(canTransitionCertificateRequest("RECORD_LOOKUP_REQUIRED", "MANUAL_REVIEW")).toBe(true);
    expect(canTransitionCertificateRequest("RECORD_NOT_FOUND", "RECORD_LOOKUP_REQUIRED")).toBe(true);
  });

  it("allows payment retry and manual-review-to-paid via waiver", () => {
    expect(canTransitionCertificateRequest("PAYMENT_FAILED", "PAYMENT_PENDING")).toBe(true);
    expect(canTransitionCertificateRequest("MANUAL_REVIEW", "PAID")).toBe(true);
    expect(canTransitionCertificateRequest("MANUAL_REVIEW", "APPROVED")).toBe(true);
    expect(canTransitionCertificateRequest("MANUAL_REVIEW", "REJECTED")).toBe(true);
  });

  it("only allows cancellation before payment or issuance", () => {
    expect(canTransitionCertificateRequest("DRAFT", "CANCELLED")).toBe(true);
    expect(canTransitionCertificateRequest("PAYMENT_PENDING", "CANCELLED")).toBe(true);
    expect(canTransitionCertificateRequest("PAID", "CANCELLED")).toBe(false);
    expect(canTransitionCertificateRequest("ISSUED", "CANCELLED")).toBe(false);
  });

  it("has no transitions out of DELIVERED, REJECTED or CANCELLED", () => {
    expect(canTransitionCertificateRequest("DELIVERED", "ISSUED")).toBe(false);
    expect(canTransitionCertificateRequest("REJECTED", "MANUAL_REVIEW")).toBe(false);
    expect(canTransitionCertificateRequest("CANCELLED", "DRAFT")).toBe(false);
  });

  it("allows delivery-failure retry", () => {
    expect(canTransitionCertificateRequest("DELIVERY_PENDING", "DELIVERY_FAILED")).toBe(true);
    expect(canTransitionCertificateRequest("DELIVERY_FAILED", "DELIVERY_PENDING")).toBe(true);
    expect(canTransitionCertificateRequest("DELIVERY_FAILED", "DELIVERED")).toBe(true);
  });
});

describe("certificate (issued document) status machine", () => {
  it("allows ACTIVE -> REVOKED and ACTIVE -> SUPERSEDED", () => {
    expect(canTransitionCertificate("ACTIVE", "REVOKED")).toBe(true);
    expect(canTransitionCertificate("ACTIVE", "SUPERSEDED")).toBe(true);
  });

  it("REVOKED and SUPERSEDED are terminal — revocation never deletes, but never reverses either", () => {
    expect(canTransitionCertificate("REVOKED", "ACTIVE")).toBe(false);
    expect(canTransitionCertificate("SUPERSEDED", "ACTIVE")).toBe(false);
    expect(() => assertTransitionCertificate("REVOKED", "ACTIVE")).toThrow(IllegalTransitionError);
  });
});
