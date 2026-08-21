import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Login from "@/screens/authentication/login";
import toastMessage from "@/utils/common/toastMessage";
import { LanguageContext } from "@/context/LanguageContext";
import { translations } from "@/internationalization";

vi.mock("@/api/login", () => ({
  userLoginApi: vi.fn(),
  userSendOTPByEmail: vi.fn(),
}));
vi.mock("@/utils/common/toastMessage", () => ({ default: vi.fn() }));

import { userLoginApi } from "@/api/login";

/**
 * Regression for: userLoginApi() catches its own errors internally (it's
 * also called by silent background token-refresh flows in
 * tokenExpiryBanner/revalidateAccount that must not toast on every network
 * blip) and resolves to undefined rather than rejecting. Its own
 * "Network Error"/ECONNREFUSED toast is then silently dropped by
 * toastMessage's EXCLUDED_MESSAGES list. Before the fix, a direct,
 * user-initiated login attempt against an unreachable API showed nothing
 * at all — this asserts the Login screen now always surfaces its own
 * feedback when userLoginApi comes back empty.
 */
describe("Login shows feedback when the real API is unreachable", () => {
  afterEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  it("toasts a login-failed message when userLoginApi resolves to undefined (swallowed network error)", async () => {
    (userLoginApi as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={["/staff/sign-in"]}>
        <LanguageContext.Provider
          value={{ translation: translations.english, setLanguage: () => {} }}
        >
          <Login />
        </LanguageContext.Provider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByTestId("email"), {
      target: { value: "someone@example.com" },
    });
    fireEvent.change(screen.getByTestId("password"), {
      target: { value: "whatever-password" },
    });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => expect(toastMessage).toHaveBeenCalled());

    const [type, payload] = (toastMessage as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(type).toBe("error");
    // Must be a message toastMessage's own EXCLUDED_MESSAGES list won't
    // silently drop (unlike the raw "Network Error"/ECONNREFUSED text).
    expect(payload.message.toUpperCase()).not.toContain("NETWORK ERROR");
    expect(payload.message.toUpperCase()).not.toContain("ECONNREFUSED");
    expect(payload.message.length).toBeGreaterThan(0);
  });
});
