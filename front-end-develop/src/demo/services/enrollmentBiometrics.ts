// Demo-mode backing for the enrollment "biometric capture" wizard
// (src/api/enrollments/index.ts: onStart, onAdd{IRIS,Fingerprint,Signature,
// Selfie}, onMatchFacialForPairValidator, onSubmitEnrollment,
// fetchBioRefreshHistory, assignOfficer, deleteData, fetchBiometricById,
// manualSyncApiHandler, pushToSdidCore, pushBiometricRefreshToCore,
// enrollmentRollback).
//
// Per explicit product decision there is no real fingerprint/iris/signature
// pad/webcam in a demo environment, so every capture step here auto-succeeds
// with fixed placeholder data rather than inspecting whatever (if anything)
// the capture UI collected — the goal is a smooth end-to-end demo walkthrough,
// not realistic biometric matching. Where the real backend call has a side
// effect the rest of the app reads back later (biometrics status, sync
// flags, officer assignment), the matching db.applications record is
// mutated via updateDemoData(), mirroring applications.ts's
// transitionApplication and appointments.ts's demoTransferAppointment.
import { demoDelay } from "../config";
import { updateDemoData } from "../storage/demoStore";
import { DemoApplication, DemoBiometricsStatus, DemoDatabase } from "../types";

// A syntactically valid 1x1 transparent PNG, reused as the stand-in for
// every simulated selfie/iris/fingerprint/signature image.
export const DEMO_PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

const DEMO_ACTOR = "Demo Officer";

const demoToken = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const pushAudit = (
  db: DemoDatabase,
  action: string,
  targetRef: string,
  details?: string
) => {
  db.auditEvents.unshift({
    id: `LOG-${Date.now()}`,
    actor: DEMO_ACTOR,
    action,
    module: "enrollment",
    targetRef,
    at: new Date().toISOString(),
    details,
  });
};

const setBiometricsStatus = (
  app: DemoApplication,
  status: DemoBiometricsStatus
) => {
  app.biometricsStatus = status;
};

// preEnrollmentId, in the demo search flow (src/demo/services/prenrollment.ts
// / demoFetchPrenrollmentByIdentifier), is the seeded applicant's id
// (`_id: applicant.id`). Every seeded applicant already has at least one
// seeded application (src/demo/seed/applications.ts picks across all 20
// applicants), so "starting" an enrollment resumes that existing record
// instead of fabricating a new one — keeping list/detail screens (which
// read db.applications) consistent with what the wizard just did.
const findApplicationForStart = (
  db: DemoDatabase,
  preEnrollmentId: string
): DemoApplication =>
  db.applications.find((a) => a.applicantId === preEnrollmentId) ||
  db.applications.find((a) => a.id === preEnrollmentId) ||
  // Safety net: an id matching neither an applicant nor an application
  // shouldn't happen against the seeded data, but fall back to the first
  // seeded application rather than throwing mid-demo.
  db.applications[0];

// ENROLLMENT PROCESS

export const demoOnStart = async ({
  preEnrollmentId,
  isBioRefresh,
  payload,
}: {
  preEnrollmentId?: string;
  isBioRefresh?: boolean;
  payload?: any;
  bioToken?: string;
  isStartedOnline?: boolean;
}): Promise<any> => {
  if (isBioRefresh) {
    const enrollmentId = payload?.enrollmentId;
    const bioRefreshToken = demoToken("BIOREFRESH");

    updateDemoData((db) => {
      const app = db.applications.find((a) => a.id === enrollmentId);
      if (app) {
        setBiometricsStatus(app, "inProgress");
        pushAudit(db, "started biometric refresh", app.reference);
      }
      return db;
    });

    return demoDelay(
      {
        message: "Selfie matched successfully.",
        bioRefreshToken,
        enrollmentId,
      },
      500
    );
  }

  const bioToken = demoToken("BIOTOKEN");
  let enrollmentId = "";

  updateDemoData((db) => {
    const app = findApplicationForStart(db, preEnrollmentId || "");
    setBiometricsStatus(app, "inProgress");
    enrollmentId = app.id;
    pushAudit(db, "started enrollment", app.reference);
    return db;
  });

  return demoDelay(
    {
      enrollmentId,
      bioToken,
      message: "Enrollment started successfully.",
    },
    500
  );
};

export const demoOnAddIRIS = async (payload: {
  enrollmentId: string;
  leftIris?: any;
  rightIris?: any;
  supportingDocuments?: string[];
}): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === payload.enrollmentId);
    if (app) {
      setBiometricsStatus(app, "inProgress");
      pushAudit(db, "captured iris", app.reference);
    }
    return db;
  });

  return demoDelay({ message: "Iris captured successfully." }, 700);
};

export const demoOnAddFingerprint = async (
  enrollmentId: string
): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === enrollmentId);
    if (app) {
      setBiometricsStatus(app, "inProgress");
      pushAudit(db, "captured fingerprints", app.reference);
    }
    return db;
  });

  return demoDelay({ message: "Fingerprints captured successfully." }, 900);
};

export const demoOnAddSignature = async (payload: {
  enrollmentId: string;
}): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === payload.enrollmentId);
    if (app) {
      // Signature is the last modality in the wizard (photo -> iris ->
      // fingerprint -> signature), so this is the point every biometric has
      // been "captured" for this enrollment.
      setBiometricsStatus(app, "captured");
      pushAudit(db, "captured signature", app.reference);
    }
    return db;
  });

  return demoDelay({ message: "Signature captured successfully." }, 500);
};

export const demoOnAddSelfie = async (payload: {
  enrollmentId: string;
}): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === payload.enrollmentId);
    if (app) {
      setBiometricsStatus(app, "inProgress");
      pushAudit(db, "captured selfie", app.reference);
    }
    return db;
  });

  return demoDelay({ message: "Selfie captured successfully." }, 600);
};

export const demoOnMatchFacialForPairValidator = async (payload: {
  enrollmentId: string;
  accountId: string;
  approverSelfie: string;
}): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === payload.enrollmentId);
    if (app) {
      pushAudit(db, "pair-validated enrollment", app.reference);
    }
    return db;
  });

  return demoDelay(
    {
      message: "Facial match confirmed successfully.",
      data: { _id: payload.enrollmentId },
    },
    700
  );
};

export const demoOnSubmitEnrollment = async (
  enrollmentId: string,
  isBioRefresh?: boolean
): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === enrollmentId);
    if (!app) return db;

    setBiometricsStatus(app, "captured");

    if (isBioRefresh) {
      pushAudit(db, "submitted biometric refresh", app.reference);
    } else {
      app.status = "pendingReview";
      app.statusHistory.push({
        status: "pendingReview",
        at: new Date().toISOString(),
        by: DEMO_ACTOR,
        note: "Enrollment submitted for review.",
      });
      pushAudit(db, "submitted enrollment", app.reference);
    }

    return db;
  });

  return demoDelay({ message: "Enrollment submitted successfully." }, 700);
};

export const demoFetchBioRefreshHistory = async (
  _enrollmentId: string
): Promise<any> =>
  // No historical bio-refresh media is seeded in the demo database — an
  // empty-but-present history for every modality renders the "(0)" empty
  // state cleanly rather than throwing.
  demoDelay({ face: [], iris: [], fingerprint: [], signature: [] }, 400);

export const demoAssignOfficer = async (
  enrollmentId: string,
  accountId: string
): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === enrollmentId);
    const account = db.accounts.find((a) => a.id === accountId);
    if (app && account) {
      app.officerId = accountId;
      pushAudit(
        db,
        "reassigned enrollment",
        app.reference,
        `Reassigned to ${account.firstName} ${account.lastName}.`
      );
    }
    return db;
  });

  return demoDelay({ message: "Officer reassigned successfully." }, 500);
};

export const demoDeleteEnrollment = async (
  enrollmentId: string
): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === enrollmentId);
    if (app) {
      pushAudit(db, "deleted enrollment", app.reference);
    }
    db.applications = db.applications.filter((a) => a.id !== enrollmentId);
    return db;
  });

  return demoDelay({ message: "Enrollment deleted successfully." }, 500);
};

// Backs the "view a single captured biometric by media id" screen
// (citizenProfile/historical.tsx). The demo database doesn't keep
// per-media records, so this always answers with the same placeholder
// content for whichever modality was requested rather than tracking real
// media ids.
export const demoFetchBiometricById = async (_params: any): Promise<any> =>
  demoDelay(
    {
      face: {
        face: DEMO_PLACEHOLDER_IMAGE,
        preview: JSON.stringify({ photo: DEMO_PLACEHOLDER_IMAGE }),
      },
      iris: {
        preview: JSON.stringify({
          leftIris: DEMO_PLACEHOLDER_IMAGE,
          rightIris: DEMO_PLACEHOLDER_IMAGE,
        }),
      },
      fingerprint: {
        LeftThumb: DEMO_PLACEHOLDER_IMAGE,
        RightThumb: DEMO_PLACEHOLDER_IMAGE,
      },
      signature: { signature: DEMO_PLACEHOLDER_IMAGE },
    },
    400
  );

export const demoManualSync = async (): Promise<any> =>
  demoDelay({ data: { message: "Synced to central successfully." } }, 900);

export const demoPushToSdidCore = async (enrollmentId: string): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === enrollmentId);
    if (app) {
      app.syncedToCore = true;
      pushAudit(db, "pushed to SDID Core", app.reference);
    }
    return db;
  });

  return demoDelay(
    { message: "Enrollment synced to SDID Core successfully." },
    800
  );
};

export const demoPushBiometricRefreshToCore = async (
  enrollmentId: string
): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === enrollmentId);
    if (app) {
      app.syncedToCore = true;
      pushAudit(db, "pushed biometric refresh to SDID Core", app.reference);
    }
    return db;
  });

  return demoDelay(
    { message: "Biometric refresh submitted to SDID Core successfully." },
    800
  );
};

export const demoEnrollmentRollback = async (payload: {
  enrollmentId: string;
  rollbackReason: string;
}): Promise<any> => {
  updateDemoData((db) => {
    const app = db.applications.find((a) => a.id === payload.enrollmentId);
    if (!app) return db;

    app.status = "rolledBack";
    app.statusHistory.push({
      status: "rolledBack",
      at: new Date().toISOString(),
      by: DEMO_ACTOR,
      note: payload.rollbackReason,
    });
    pushAudit(db, "rolled back enrollment", app.reference, payload.rollbackReason);

    return db;
  });

  return demoDelay({ message: "Enrollment rolled back successfully." }, 600);
};
