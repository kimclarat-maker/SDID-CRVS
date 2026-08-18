import React from "react";

export type AlertType = {
  operator: string;
  center: {
    name: string;
    id: string;
    phoneNumber: string;
  };
  prenrollmentNumber: string;
  firstName: string;
  lastName: string;
  date: string;
};

export type GETParameters = {
  offset?: number;
  limit?: number;
};
