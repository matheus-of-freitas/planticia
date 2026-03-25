import React from "react";
import { render } from "@testing-library/react-native";
import { SplashScreen } from "../../components/ui/SplashScreen";

// Mock Animated to run synchronously
jest.useFakeTimers();

describe("SplashScreen", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders Planticia title", () => {
    const onFinish = jest.fn();
    const { getByText } = render(<SplashScreen onFinish={onFinish} />);
    expect(getByText("Planticia")).toBeTruthy();
  });

  it("renders subtitle text", () => {
    const onFinish = jest.fn();
    const { getByText } = render(<SplashScreen onFinish={onFinish} />);
    expect(getByText("Cuide das suas plantas")).toBeTruthy();
  });

  it("calls onFinish after animation completes", () => {
    const onFinish = jest.fn();
    render(<SplashScreen onFinish={onFinish} />);

    // Fast-forward all timers and animations
    jest.runAllTimers();

    // onFinish is called when the animation sequence completes
    // Since Animated.timing uses requestAnimationFrame under the hood,
    // we need to advance enough for all animations to settle
    expect(onFinish).toHaveBeenCalled();
  });
});
