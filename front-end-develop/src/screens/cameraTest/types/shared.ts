export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Landmark {
  type: string;
  x: number;
  y: number;
}

export interface IcaoCompliance {
  passed: string[];
  failed: string[];
}
