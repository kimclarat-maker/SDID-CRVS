import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import DemoBiometricSimulator from "@/components/demoBiometricSimulator";

describe("Demo biometric simulator", () => {
  it("shows the no-real-capture notice", () => {
    render(<DemoBiometricSimulator kind="selfie" onComplete={() => {}} />);
    expect(
      screen.getByText(/no biometric data is being captured/i)
    ).toBeInTheDocument();
  });

  it("calls onComplete only when the outcome is a successful capture", async () => {
    const onComplete = vi.fn();
    render(<DemoBiometricSimulator kind="fingerprint" onComplete={onComplete} />);

    fireEvent.click(screen.getByText("Simulate success"));

    await waitFor(() => expect(onComplete).toHaveBeenCalledWith("captured"));
  });

  it("does not call onComplete for a simulated poor-quality result", async () => {
    const onComplete = vi.fn();
    render(<DemoBiometricSimulator kind="iris" onComplete={onComplete} />);

    fireEvent.click(screen.getByText("Simulate poor quality"));

    await waitFor(() =>
      expect(screen.getByText(/Quality check failed/i)).toBeInTheDocument()
    );
    expect(onComplete).not.toHaveBeenCalled();
  });
});
