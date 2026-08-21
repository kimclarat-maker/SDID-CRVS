import { afterEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PublicHeader from "@/components/public/PublicHeader";
import { PublicLanguageProvider } from "@/context/PublicLanguageContext";

function renderHeader() {
  return render(
    <MemoryRouter>
      <PublicLanguageProvider>
        <PublicHeader />
      </PublicLanguageProvider>
    </MemoryRouter>
  );
}

describe("PublicHeader mobile menu", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("opens the mobile nav panel and locks background scroll", () => {
    renderHeader();

    const toggle = screen.getByRole("button", { name: "Menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    // Two "Menu" landmarks now exist (desktop nav + the opened mobile
    // panel, which share the same accessible name by design).
    expect(document.getElementById("public-mobile-nav")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("closes on Escape and returns focus to the toggle button", async () => {
    renderHeader();

    const toggle = screen.getByRole("button", { name: "Menu" });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() =>
      expect(toggle).toHaveAttribute("aria-expanded", "false")
    );
    expect(toggle).toHaveFocus();
    expect(document.body.style.overflow).toBe("");
  });
});
