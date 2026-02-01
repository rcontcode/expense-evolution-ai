import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickCaptureTutorial } from "@/components/capture/QuickCaptureTutorial";

// Mock LanguageContext
vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({ language: "es", t: (key: string) => key }),
}));

describe("QuickCaptureTutorial", () => {
  const mockOnComplete = vi.fn();
  const mockOnSkip = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render initial step correctly", () => {
    render(
      <QuickCaptureTutorial onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Check tutorial badge shows step 1/4
    expect(screen.getByText(/Tutorial/)).toBeInTheDocument();
    expect(screen.getByText(/1\/4/)).toBeInTheDocument();

    // Check first step title (Spanish)
    expect(screen.getByText("Captura tu recibo")).toBeInTheDocument();
  });

  it("should navigate to next step when clicking Siguiente", () => {
    render(
      <QuickCaptureTutorial onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Click next button
    const nextButton = screen.getByText("Siguiente");
    fireEvent.click(nextButton);

    // Should show step 2
    expect(screen.getByText(/2\/4/)).toBeInTheDocument();
    expect(screen.getByText("Procesamiento Inteligente")).toBeInTheDocument();
  });

  it("should navigate through all steps", () => {
    render(
      <QuickCaptureTutorial onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Step 1 -> 2
    fireEvent.click(screen.getByText("Siguiente"));
    expect(screen.getByText("Procesamiento Inteligente")).toBeInTheDocument();

    // Step 2 -> 3
    fireEvent.click(screen.getByText("Siguiente"));
    expect(screen.getByText("Revisa y edita")).toBeInTheDocument();

    // Step 3 -> 4
    fireEvent.click(screen.getByText("Siguiente"));
    expect(screen.getByText("Guarda tu gasto")).toBeInTheDocument();

    // On last step, button should say "¡Comenzar!"
    expect(screen.getByText("¡Comenzar!")).toBeInTheDocument();
  });

  it("should call onComplete when finishing tutorial", () => {
    render(
      <QuickCaptureTutorial onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Navigate to last step
    fireEvent.click(screen.getByText("Siguiente")); // 1->2
    fireEvent.click(screen.getByText("Siguiente")); // 2->3
    fireEvent.click(screen.getByText("Siguiente")); // 3->4

    // Click complete button
    fireEvent.click(screen.getByText("¡Comenzar!"));

    expect(mockOnComplete).toHaveBeenCalledTimes(1);
  });

  it("should call onSkip when clicking skip button", () => {
    render(
      <QuickCaptureTutorial onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Click skip button
    const skipButton = screen.getByText("Saltar");
    fireEvent.click(skipButton);

    expect(mockOnSkip).toHaveBeenCalledTimes(1);
  });

  it("should navigate back with Anterior button", () => {
    render(
      <QuickCaptureTutorial onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Go to step 2
    fireEvent.click(screen.getByText("Siguiente"));
    expect(screen.getByText(/2\/4/)).toBeInTheDocument();

    // Go back to step 1
    fireEvent.click(screen.getByText("Anterior"));
    expect(screen.getByText(/1\/4/)).toBeInTheDocument();
  });

  it("should not show Anterior button on first step", () => {
    render(
      <QuickCaptureTutorial onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Anterior should not exist on step 1
    expect(screen.queryByText("Anterior")).not.toBeInTheDocument();
  });

  it("should show progress bar with correct number of segments", () => {
    render(
      <QuickCaptureTutorial onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Should have 4 progress segments (one per step)
    const progressBars = document.querySelectorAll(".h-1.flex-1.rounded-full");
    expect(progressBars.length).toBe(4);
  });

  it("should show tip for each step", () => {
    render(
      <QuickCaptureTutorial onComplete={mockOnComplete} onSkip={mockOnSkip} />
    );

    // Step 1 tip
    expect(
      screen.getByText(/Asegúrate de que el texto sea legible/)
    ).toBeInTheDocument();

    // Navigate to step 2 and check its tip
    fireEvent.click(screen.getByText("Siguiente"));
    expect(
      screen.getByText(/detectamos si el gasto es deducible/)
    ).toBeInTheDocument();
  });
});
