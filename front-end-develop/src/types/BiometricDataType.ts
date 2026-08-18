export type BiometricDataType = {
  specification?: any;
  image?: any;
  isCapture?: boolean;
  isCapturedBiometricComplete?: boolean;
  isSupportingDocumentRequired?: boolean;
  isCaptureSupportingDocumentComplete?: boolean;
  biometricType: string;
  biometricDescription?: string;
  isCapturing: boolean;
  supportingDocument: any;
  disability: boolean;
  [key: string]: any;
};
