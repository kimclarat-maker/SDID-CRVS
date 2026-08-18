import React from "react";
import StartCaptureBiometrics from "../biometrics/biometricCapture";

interface Props {}

const BioRefresh: React.FC<Props> = () => {
  return <StartCaptureBiometrics enableCapture isBioRefresh />;
};

export default BioRefresh;
