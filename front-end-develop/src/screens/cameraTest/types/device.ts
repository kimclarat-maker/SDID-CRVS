export type CameraFormatInfo = {
  width: number;
  height: number;
  frameRate: number;
  mediaSubtype: number;
  label: string;
};

export type CameraDeviceInfo = {
  id: string;
  displayName: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  formats: CameraFormatInfo[];
};
