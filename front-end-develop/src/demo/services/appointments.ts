import { demoDelay } from "../config";
import { getDemoData, updateDemoData } from "../storage/demoStore";

const toScheduleRecord = (appointmentId: string) => {
  const db = getDemoData();
  const appt = db.appointments.find((a) => a.id === appointmentId);
  if (!appt) return undefined;
  const center = db.centers.find((c) => c.id === appt.centerId);
  const officer = db.accounts.find((a) => a.id === appt.officerId);

  return {
    _id: appt.id,
    appointmentNo: appt.id,
    applicantName: appt.applicantName,
    date: appt.date,
    time: appt.time,
    status: appt.status,
    center: center ? { _id: center.id, name: center.name } : undefined,
    officer: officer
      ? { firstName: officer.firstName, lastName: officer.lastName }
      : undefined,
  };
};

export const demoFetchSchedules = async (params: {
  offset?: number;
  limit?: number;
}) => {
  const db = getDemoData();
  const offset = params.offset || 0;
  const limit = params.limit || 10;
  const page = db.appointments.slice(offset, offset + limit);

  return demoDelay({
    data: page.map((a) => toScheduleRecord(a.id)).filter(Boolean),
    total: db.appointments.length,
  });
};

const toTransferRecord = (appointmentId: string) => {
  const db = getDemoData();
  const appt = db.appointments.find((a) => a.id === appointmentId);
  if (!appt) return undefined;
  const application = db.applications.find(
    (a) => a.id === appt.applicationId
  );
  const applicant = db.applicants.find(
    (a) => a.id === application?.applicantId
  );
  const center = db.centers.find((c) => c.id === appt.centerId);
  const lastTransfer = appt.transferHistory[appt.transferHistory.length - 1];
  const fromCenter = lastTransfer
    ? db.centers.find((c) => c.id === lastTransfer.fromCenterId)
    : center;

  return {
    _id: appt.id,
    prenrollmentNumber: application?.reference || appt.id,
    firstName: applicant?.firstName || appt.applicantName.split(" ")[0],
    lastName: applicant?.lastName || appt.applicantName.split(" ")[1] || "",
    appointmentDate: `${appt.date}T${appt.time}`,
    fromCenter: fromCenter
      ? { _id: fromCenter.id, name: fromCenter.name }
      : { _id: "", name: "-" },
    toCenter: center ? { _id: center.id, name: center.name } : { _id: "", name: "-" },
    transferDate: lastTransfer?.at || appt.date,
  };
};

export const demoFetchTransfers = async (params: {
  search?: string;
  offset?: number;
  limit?: number;
}) => {
  const db = getDemoData();
  let transferred = db.appointments.filter(
    (a) => a.status === "transferred"
  );

  if (params.search) {
    const term = params.search.toUpperCase();
    transferred = transferred.filter((a) => {
      const application = db.applications.find(
        (x) => x.id === a.applicationId
      );
      return application?.reference.toUpperCase() === term;
    });
  }

  const offset = params.offset || 0;
  const limit = params.limit || 10;
  const page = transferred.slice(offset, offset + limit);

  return demoDelay({
    data: page.map((a) => toTransferRecord(a.id)).filter(Boolean),
    total: transferred.length,
  });
};

export const demoTransferAppointment = async (
  appointmentId: string,
  toCenterId: string
) =>
  demoDelay(
    updateDemoData((db) => {
      const appt = db.appointments.find((a) => a.id === appointmentId);
      if (!appt) return db;

      appt.transferHistory.push({
        fromCenterId: appt.centerId,
        toCenterId,
        at: new Date().toISOString(),
      });
      appt.centerId = toCenterId;
      appt.status = "transferred";

      db.auditEvents.unshift({
        id: `LOG-${Date.now()}`,
        actor: "Demo Officer",
        action: "transferred",
        module: "appointments",
        targetRef: appt.id,
        at: new Date().toISOString(),
        details: `Appointment transferred to a different centre.`,
      });

      return db;
    })
  );
