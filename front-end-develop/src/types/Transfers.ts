export type TransferType = {
  _id: string;
  prenrollmentNumber: string;
  firstName: string;
  lastName: string;
  appointmentDate: string;
  fromCenter: {
    _id: string;
    name: string;
  };
  toCenter: {
    _id: string;
    name: string;
  };
  transferDate: string;
};

export type AddTransferType = {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
};

export type GETParameters = {
  offset?: number;
  limit?: number;
  search?: string;
};
