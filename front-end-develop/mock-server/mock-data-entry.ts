// Aggregates the app's existing test fixtures (src/mocks/**) into one module
// so the mock server can require a single bundled CJS file at runtime.
export { default as accounts } from "../src/mocks/accounts";
export { default as alerts } from "../src/mocks/alerts";
export { default as analyticsSummary } from "../src/mocks/analytics";
export { default as emailPasswordResponse } from "../src/mocks/auth/email-password";
export { default as loggedInUser } from "../src/mocks/auth/loggedin-user";
export { default as sendOtpResponse } from "../src/mocks/auth/send-otp";
export { default as centers } from "../src/mocks/centers";
export { biometricDevices as devices } from "../src/mocks/devices";
export { default as drafts } from "../src/mocks/drafts";
export { default as enrollments } from "../src/mocks/enrollments";
export { default as countries } from "../src/mocks/geo/countries";
export { default as provinces } from "../src/mocks/geo/provinces";
export { default as districts } from "../src/mocks/geo/districts";
export { default as sectors } from "../src/mocks/geo/sectors";
export { default as cells } from "../src/mocks/geo/cells";
export { default as villages } from "../src/mocks/geo/villages";
export { default as notifications } from "../src/mocks/notifications";
export { default as prenrollment } from "../src/mocks/prenrollment";
export { default as reports } from "../src/mocks/reports";
export { default as rollbacks } from "../src/mocks/rollbacks";
export { default as schedules, calendarData } from "../src/mocks/schedules";
export { default as transfers } from "../src/mocks/transfer";
