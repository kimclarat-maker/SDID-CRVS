export type SigApiCaptureRequest = {
  who: string;
  why?: string;
  additionalData?: string;
};

export type SigApiCaptureResult = {
  ok: boolean;
  sigText: string;
  error?: string | null;
  code?: number | null;
};

export type SigApiRenderFormat = "Png" | "Jpeg" | "Tiff";

export type SigApiRenderRequest = {
  sigText: string;
  format?: SigApiRenderFormat; // default Png
  relative?: boolean; // default true
  dpiX?: number; // min 200 for Png/Jpeg, 300 for Tiff (when relative)
  dpiY?: number;
  strokeWidth?: number; // default 0.5
  penColorRgb?: number; // 0xRRGGBB, default 0x000000
  backgroundRgb?: number; // 0xRRGGBB, default 0xFFFFFF
  marginLeft?: number; // ignored when relative=true
  marginTop?: number; // ignored when relative=true
  widthPx?: number; // used when relative=false
  heightPx?: number; // used when relative=false
};

export type SigApiPixelInfo = { width: number; height: number };

export type SigApiDpiInfo = { x: number; y: number };

export type SigApiRenderResult = {
  ok: boolean;
  format: SigApiRenderFormat | string;
  base64Image: string;
  pixels?: SigApiPixelInfo | null;
  dpi?: SigApiDpiInfo | null;
  fileSizeBytes?: number | null;
  error?: string | null;
};

export type SigApiProblemJson = {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  instance?: string;
} & Record<string, unknown>;

export type SigApiClientOptions = {
  baseUrl?: string;
  apiKey: string;
  timeoutMs?: number;
};
