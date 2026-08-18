export type ScheduleType = {
  _id: string;
  prenrollmentNumber: string;
  firstName: string;
  lastName: string;
  appointmentDate: string;
  center: string;
};

export type GETParameters = {
  offset?: number;
  limit?: number;
  id?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  appointmentNo?: string;
  requestNo?: string;
  center?: string;
  status?: string;
};

export type BookSchedule = {
  _id?: string;
  date?: string;
  appointmentDate?: string;
  timeSlotId?: string;
  centerId?: any;
  requestId?: string;
  scheduleId?: string;
  postedBy?: string;
  status?: string;
  appointmentNo?: string;
  request?: any;
  phoneNumber?: string;
  email?: string;
};

export type GETTimeSlotsParameters = {
  center?: string[];
  offset: number;
  limit: number;
  search?: string;
  province?: string;
  appointmentDate?: string;
  isCurrentDay?: boolean;
  timezone?: string;
};

export type TimeSlotType = {
  center: any;
  name: string;
  _id?: string;
  time?: string;
  timeSlotEndTime: string;
  nameEndTime: "";
  centerIDUpdate?: boolean;
};

export type AppointmentType = {
  centerId?: any;
  requestId?: string;
  _id?: string;
  timeSlotId?: string;
  postedBy: string;
  status?: string;
};
