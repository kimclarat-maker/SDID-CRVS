export const user = {
  email: "kibugenzad@gmail.com",
  password: "HuzaD2992@",
};

export const userAdmin = {
  email: "kibugenzad@gmail.com",
  firstName: "KIBUGENZA",
  lastName: "Didier",
  accountType: "System Super Administrator",
  refreshToken:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIzYjRjYjJhMC1lZDU1LTExZWYtOWYwZS05ZGI0MzNiMTk2NjMiLCJzdWIiOiJkNDhmY2Q2MC02NWZkLTExZWYtYjdmZC1mN2Q5MTAwNDc5YjciLCJpYXQiOjE3Mzk4MTM1NzksImV4cCI6MTc0MDQxODM3OSwiaXNzIjoiMFlwRjFlQkd2dWptOG0wZHI2WlNhbmlyRHVMZGdFWUlaRnhRYy81ZnlRUjYvbUh5dkgwQXlHUzVTQlpPeGc9PSJ9.vAhfZOTnVKelI9xmlsARiGKM5l4KxeoEPLFyHRf8O1M",
  token:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzaWQiOiIzYjRjYjJhMC1lZDU1LTExZWYtOWYwZS05ZGI0MzNiMTk2NjMiLCJzdWIiOiJkNDhmY2Q2MC02NWZkLTExZWYtYjdmZC1mN2Q5MTAwNDc5YjciLCJpYXQiOjE3Mzk4MTM1NzksImV4cCI6MTczOTg5OTk3OSwiaXNzIjoiMFlwRjFlQkd2dWptOG0wZHI2WlNhbmlyRHVMZGdFWUlaRnhRYy81ZnlRUjYvbUh5dkgwQXlHUzVTQlpPeGc9PSJ9.S_m7oS6d-jiV8k-j99ndTBZ-f0oJOgOzHIT0YAUjP1w",
  shouldResetPassword: true,
  passwordResetLink: "",
  shouldVerifyEmail: false,
  account: {
    _id: "d48fcd60-65fd-11ef-b7fd-f7d9100479b7",
    firstName: "KIBUGENZA",
    lastName: "Didier",
    email: "kibugenzad@gmail.com",
    phoneNumber: "+250787393488",
    idNumber: "1199280188264156",
    centerId: null,
    accessRoleId: "74d47050-3e2b-11ef-88ff-5769797ab819",
    documentType: [],
    resetPasswordToken: null,
    hasResetPassword: true,
    emailVerificationToken: "*****",
    hasVerifiedEmail: true,
    logAttempts: 0,
    tempLockDate: null,
    status: "active",
    center: null,
    accessRole: {
      _id: "74d47050-3e2b-11ef-88ff-5769797ab819",
      name: "System Super Administrator",
      value: "superAdmin",
      status: "active",
    },
    permissions: [],
  },
};

export const requestInitialPayload = {
  identifier: "1199280188264156",
  documentType: "40252340-4e84-11ef-ad8e-fd27e8e43ccd",
  applicantCategory: "f9458660-3e00-11ef-8713-a93cefd56684",
  requestType: "WITH_IDENTIFIER",
  postedBy: "KIBUGENZA Didier",
};

export const children = [
  {
    _id: "1",
    firstName: "John",
    lastName: "Doe",
    photo: "john-doe.jpg",
    placeOfBirth: "Kigali",
    countryOfDomicile: "Rwanda",
  },
  {
    _id: "2",
    firstName: "Jane",
    lastName: "Doe",
    photo: "jane-doe.jpg",
    placeOfBirth: "Nairobi",
    countryOfDomicile: "Kenya",
  },
];
