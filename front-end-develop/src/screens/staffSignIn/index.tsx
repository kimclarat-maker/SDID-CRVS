import Login from "@/screens/authentication/login";
import StaffAuthLayout from "@/components/public/StaffAuthLayout";
import { PublicLanguageProvider } from "@/context/PublicLanguageContext";

/**
 * Public-facing entry point for staff authentication. Reuses the existing
 * Login screen and its facial/OTP MFA flow untouched so the internal
 * enrolment login workflow keeps working exactly as before; this route
 * gives it the same visual language as the rest of the public site instead
 * of the old internal AppLayout/Navbar chrome.
 */
export default function StaffSignIn() {
  return (
    <PublicLanguageProvider>
      <StaffAuthLayout>
        <Login />
      </StaffAuthLayout>
    </PublicLanguageProvider>
  );
}
