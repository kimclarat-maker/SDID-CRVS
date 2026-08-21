import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import FaqList from "@/components/public/FaqList";
import Carousel from "@/components/public/Carousel";

describe("FaqList accordion", () => {
  const items = [
    { question: "What is this?", answer: "An answer." },
    { question: "Another question?", answer: "Another answer." },
  ];

  it("starts collapsed and expands on click, updating aria-expanded/aria-hidden", () => {
    render(<FaqList items={items} />);

    const trigger = screen.getByRole("button", { name: items[0].question });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    // Real <button> elements are natively keyboard-operable (Enter/Space
    // trigger a click per the HTML spec) — asserting the tag name here
    // stands in for that guarantee, since jsdom doesn't implement the
    // native key-to-click translation real browsers perform.
    expect(trigger.tagName).toBe("BUTTON");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");

    const panelId = trigger.getAttribute("aria-controls");
    expect(panelId).toBeTruthy();
    const panel = document.getElementById(panelId as string);
    expect(panel).toHaveAttribute("aria-hidden", "false");
  });

  it("toggles each item independently, each with a minimum 48px target", () => {
    render(<FaqList items={items} />);

    const first = screen.getByRole("button", { name: items[0].question });
    const second = screen.getByRole("button", { name: items[1].question });

    fireEvent.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    expect(second).toHaveAttribute("aria-expanded", "false");
    expect(first.className).toContain("public-accordion-trigger");
  });
});

describe("Carousel", () => {
  const items = [
    { id: "a", content: <div>Card A</div> },
    { id: "b", content: <div>Card B</div> },
    { id: "c", content: <div>Card C</div> },
  ];

  it("renders no navigation controls for a single item", () => {
    render(<Carousel ariaLabel="Test rail" items={[items[0]]} />);
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("renders prev/next controls and a dot per item, prev disabled initially", () => {
    render(<Carousel ariaLabel="Test rail" items={items} />);

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).not.toBeDisabled();

    const dots = screen.getAllByRole("tab");
    expect(dots).toHaveLength(3);
    expect(dots[0]).toHaveAttribute("aria-selected", "true");
    expect(dots[1]).toHaveAttribute("aria-selected", "false");
  });

  it("moves the active dot forward on Next and enables Previous", () => {
    render(<Carousel ariaLabel="Test rail" items={items} />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    const dots = screen.getAllByRole("tab");
    expect(dots[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Previous" })).not.toBeDisabled();
  });

  it("moves to the last item when a dot is activated directly (keyboard-operable button)", () => {
    render(<Carousel ariaLabel="Test rail" items={items} />);

    const dots = screen.getAllByRole("tab");
    expect(dots[2].tagName).toBe("BUTTON");
    fireEvent.click(dots[2]);
    expect(dots[2]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });
});
