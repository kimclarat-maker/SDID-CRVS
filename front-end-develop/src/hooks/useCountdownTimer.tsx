// src/useCountdownTimer.js
import { useState, useEffect } from "react";

const useCountdownTimer = (duration = 30) => {
  const [seconds, setSeconds] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) return;

    const intervalId = setInterval(() => {
      setSeconds((prevSeconds) => {
        if (prevSeconds <= 0) {
          clearInterval(intervalId);
          setIsRunning(false);
          return 0;
        }
        return prevSeconds - 1;
      });
    }, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [isRunning]);

  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setSeconds(duration);
  };

  return { seconds, isRunning, startTimer, stopTimer, resetTimer };
};

export default useCountdownTimer;
