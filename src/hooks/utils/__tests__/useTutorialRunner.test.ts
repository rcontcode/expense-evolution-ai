import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

// Mock dependencies before importing the hook
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("@/contexts/HighlightContext", () => ({
  useHighlight: () => ({
    highlight: vi.fn(),
    clearHighlights: vi.fn(),
  }),
}));

vi.mock("@/hooks/utils/useVoiceSynthesis", () => ({
  useVoiceSynthesis: () => ({
    speak: vi.fn(),
    isSpeaking: false,
    stop: vi.fn(),
  }),
}));

// Import after mocks
import { useTutorialRunner, type Tutorial, type TutorialStep } from "@/hooks/utils/useTutorialRunner";

describe("useTutorialRunner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockTutorial: Tutorial = {
    id: "test-tutorial",
    name: { es: "Tutorial de Prueba", en: "Test Tutorial" },
    description: { es: "Descripción", en: "Description" },
    steps: [
      {
        highlight: "step-1",
        narration: "Este es el paso 1",
        delay: 1000,
      },
      {
        highlight: "step-2",
        narration: "Este es el paso 2",
        delay: 1000,
      },
      {
        highlight: "step-3",
        narration: "Este es el paso 3",
        delay: 1000,
      },
    ],
  };

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useTutorialRunner());

    expect(result.current.isRunning).toBe(false);
    expect(result.current.currentStepIndex).toBe(-1);
    expect(result.current.currentTutorial).toBeNull();
    expect(result.current.totalSteps).toBe(0);
  });

  it("should start a tutorial and set isRunning to true", () => {
    const { result } = renderHook(() => useTutorialRunner());

    act(() => {
      result.current.runTutorial(mockTutorial);
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.currentTutorial).toEqual(mockTutorial);
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.totalSteps).toBe(3);
  });

  it("should run steps array directly", () => {
    const { result } = renderHook(() => useTutorialRunner());
    const steps: TutorialStep[] = [
      { highlight: "btn-1", narration: "Click aquí" },
      { highlight: "btn-2", narration: "Luego aquí" },
    ];

    act(() => {
      result.current.runSteps(steps);
    });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.currentStepIndex).toBe(0);
    expect(result.current.totalSteps).toBe(2);
  });

  it("should stop tutorial and reset state", () => {
    const { result } = renderHook(() => useTutorialRunner());

    act(() => {
      result.current.runTutorial(mockTutorial);
    });

    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.stopTutorial();
    });

    expect(result.current.isRunning).toBe(false);
    expect(result.current.currentStepIndex).toBe(-1);
    expect(result.current.currentTutorial).toBeNull();
  });

  it("should call onTutorialComplete callback when finished", () => {
    const onComplete = vi.fn();
    const { result } = renderHook(() =>
      useTutorialRunner({ onTutorialComplete: onComplete })
    );

    const singleStepTutorial: Tutorial = {
      id: "single",
      name: { es: "Uno", en: "One" },
      description: { es: "", en: "" },
      steps: [{ highlight: "single-step", narration: "Solo uno", delay: 100 }],
    };

    act(() => {
      result.current.runTutorial(singleStepTutorial);
    });

    // Fast-forward timers to complete the tutorial
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it("should call onStepStart callback when step begins", () => {
    const onStepStart = vi.fn();
    const { result } = renderHook(() =>
      useTutorialRunner({ onStepStart })
    );

    act(() => {
      result.current.runTutorial(mockTutorial);
    });

    expect(onStepStart).toHaveBeenCalledWith(mockTutorial.steps[0], 0);
  });

  it("should support language option", () => {
    const { result } = renderHook(() =>
      useTutorialRunner({ language: "en" })
    );

    // Should not throw
    act(() => {
      result.current.runTutorial(mockTutorial);
    });

    expect(result.current.isRunning).toBe(true);
  });

  it("should handle nextStep navigation", () => {
    const { result } = renderHook(() => useTutorialRunner());

    act(() => {
      result.current.runTutorial(mockTutorial);
    });

    expect(result.current.currentStepIndex).toBe(0);

    act(() => {
      result.current.nextStep();
    });

    // Note: nextStep uses internal timeout logic
    // Step should advance after internal delays
    act(() => {
      vi.advanceTimersByTime(2000);
    });
  });

  it("should handle previousStep navigation", () => {
    const { result } = renderHook(() => useTutorialRunner());

    act(() => {
      result.current.runTutorial(mockTutorial);
    });

    // Tutorial is running after start
    expect(result.current.isRunning).toBe(true);
    expect(result.current.currentStepIndex).toBe(0);

    // previousStep on step 0 should do nothing (guard condition)
    act(() => {
      result.current.previousStep();
    });

    // Still on step 0
    expect(result.current.currentStepIndex).toBe(0);
  });

  it("should handle pause and resume", () => {
    const { result } = renderHook(() => useTutorialRunner());

    act(() => {
      result.current.runTutorial(mockTutorial);
    });

    act(() => {
      result.current.pauseTutorial();
    });

    // Should still be running (paused doesn't change isRunning)
    expect(result.current.isRunning).toBe(true);

    act(() => {
      result.current.resumeTutorial();
    });

    expect(result.current.isRunning).toBe(true);
  });
});
