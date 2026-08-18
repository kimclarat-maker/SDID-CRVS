import { CenterType } from "./Center";
import { RequestType } from "./Request";
import { TimeSlotType } from "./Schedule";

export type AppointmentType = {
  _id?: string;
  appointmentDate?: string;
  appointmentNo: string;
  requestNo?: string;
  status: string;
  center?: CenterType;
  request: RequestType;
  email?: string;
  phoneNumber?: string;
  timeSlot?: TimeSlotType;
  requestType?: string;
};
