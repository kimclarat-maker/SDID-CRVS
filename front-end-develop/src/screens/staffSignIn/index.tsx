import AppLayout from "@/layout";
import Login from "@/screens/authentication/login";

/**
 * Public-facing entry point for staff authentication. Reuses the existing
 * Login screen and its facial/OTP MFA flow untouched so the internal
 * enrolment login workflow keeps working exactly as before; this route
 * simply gives the public site a stable, discoverable staff sign-in URL.
 */
export default function StaffSignIn() {
  return (
    <AppLayout navbarContainerType="container">
      <Login />
    </AppLayout>
  );
}
