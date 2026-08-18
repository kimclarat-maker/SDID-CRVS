import { GlobalConfig } from "./types/GlobalConfig";

export {};
declare global {
  interface Window {
    ________ENV__?: GlobalConfig;
  }
}
