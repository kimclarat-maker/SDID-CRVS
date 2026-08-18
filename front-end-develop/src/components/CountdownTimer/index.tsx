import useCountdownTimer from "@/hooks/useCountdownTimer";
import React, { useEffect } from "react";
import { Text } from "rsuite";

const CountdownTimer = ({
  initialDuration,
  testId,
}: {
  initialDuration: number;
  testId?: string;
}) => {
  const { seconds, isRunning, startTimer, stopTimer, resetTimer } =
    useCountdownTimer(initialDuration);

  useEffect(() => {
    startTimer();
  }, []);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div data-testid={testId}>
      <Text className="textBold textPrimary">{formatTime(seconds)}</Text>
    </div>
  );
};

export default CountdownTimer;
