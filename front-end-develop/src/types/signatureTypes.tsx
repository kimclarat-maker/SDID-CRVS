/* eslint-disable @typescript-eslint/no-explicit-any */
import { EnrollmentType } from "@/types/Enrollment";

export interface SignatureProps {
  setTab: (t: string) => void;
  activeTab: string;
  enrollmentId: string;
  enableCapture: boolean;
  setOpen: (open: boolean) => void;
  isBioRefresh: boolean;
  bioRefreshToken?: string;
  age: number;
  enrollmentData: EnrollmentType;
  deviceSerialNumber?: string;
}

export interface IDevice {
  vendorId: string;
  productId: string;
  productName: string;
}

export interface IExtraData {
  name: string;
  value: unknown;
}

// Fix: Add index signature to make it compatible with Record<string, unknown>
export interface SignatureConfig {
  [key: string]: unknown; // Add this line
  strokeSize: number;
  strokeColor: string;
  attachTo: string;
  sizeMode: string;
  width: number;
  height: number;
  left: string;
  top: string;
  centered: boolean;
  hasTitle: boolean;
  title: string;
  borderColor: string;
  borderWidth: string;
  signatory: {
    visible: boolean;
    fontFace: string;
    fontSize: number;
    offsetX: number;
    offsetY: number;
    color: string;
  };
  reason: {
    visible: boolean;
    fontFace: string;
    fontSize: number;
    offsetX: number;
    offsetY: number;
    color: string;
  };
  date: {
    visible: boolean;
    fontFace: string;
    fontSize: number;
    offsetX: number;
    offsetY: number;
    color: string;
  };
  signingLine: {
    visible: boolean;
    left: number;
    right: number;
    width: number;
    offsetY: number;
    color: string;
  };
  buttonsFont: string;
  modal: boolean;
  draggable: boolean;
  background: {
    color: string;
    alpha: number;
    mode: string;
  };
  timeOut: {
    enabled: boolean;
    time: number;
  };
  minTimeOnSurface: number;
  allowZeroPressure: boolean;
  showWait: boolean;
  source: {
    mouse: boolean;
    touch: boolean;
    pen: boolean;
    stu: boolean;
  };
}

export interface SignatureState {
  sigSDK: any;
  mSigObj: any;
  initSDKLoading: boolean;
  sdkInitialized: boolean;
  initLicenseLoading: boolean;
  licenseInitialized: boolean;
  capturing: boolean;
  sigImg: string;
  sigTxt: string;
  documentHash: any;
  who: string;
  why: string;
  devices: IDevice[];
  selectedDevice: IDevice | undefined;
  config: SignatureConfig; // Change this from Record<string, unknown> to SignatureConfig
  capDialog: any;
  isSubmitting: boolean;
  openSuccessModal: boolean;
  showSDModal: boolean;
  supportingDocuments: any[];
  isSubmittingWithSD: boolean;
  comment: string;
  updatedComment: string;
  openCommentModal: boolean;
  supportsWebHID: boolean;
}

export const defaultConfig: SignatureConfig = {
  strokeSize: 6,
  strokeColor: "#0202fe",
  attachTo: "signatureCaptureWindow",
  sizeMode: "fixed",
  width: 600,
  height: 450,
  left: "0px",
  top: "0px",
  centered: true,
  hasTitle: true,
  title: "SDID Signature",
  borderColor: "#00000",
  borderWidth: "3",
  signatory: {
    visible: true,
    fontFace: "Verdana",
    fontSize: 20,
    offsetX: 30,
    offsetY: 5,
    color: "#000000",
  },
  reason: {
    visible: true,
    fontFace: "Verdana",
    fontSize: 20,
    offsetX: 5,
    offsetY: 10,
    color: "#000000",
  },
  date: {
    visible: true,
    fontFace: "Verdana",
    fontSize: 16,
    offsetX: 30,
    offsetY: 20,
    color: "#000000",
  },
  signingLine: {
    visible: true,
    left: 30,
    right: 30,
    width: 2,
    offsetY: 5,
    color: "#d3d3d3",
  },
  buttonsFont: "Arial",
  modal: false,
  draggable: false,
  background: { color: "#ffffff", alpha: 1, mode: "fit" },
  timeOut: { enabled: false, time: 10000 },
  minTimeOnSurface: 300,
  allowZeroPressure: true,
  showWait: true,
  source: {
    mouse: false,
    touch: false,
    pen: false,
    stu: true,
  },
};
