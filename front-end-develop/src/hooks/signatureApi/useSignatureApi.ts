import {
  SIG_API_KEY,
  SIG_API_TIMEOUT,
  SIG_API_URL,
} from "@/constants/signatureApi";
import { createSignatureApi } from "@/helpers/signatureApi";
import {
  SigApiCaptureRequest,
  SigApiClientOptions,
  SigApiRenderRequest,
} from "@/types/signatureApi";
import { useCallback, useMemo, useRef, useState } from "react";

export function useSignatureApi(initial?: SigApiClientOptions) {
  const [busy, setBusy] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const optsRef = useRef<SigApiClientOptions>({
    baseUrl: SIG_API_URL,
    apiKey: SIG_API_KEY,
    timeoutMs: SIG_API_TIMEOUT,
  });

  const api = useMemo(() => createSignatureApi(optsRef.current), []);

  const capture = useCallback(
    async (req: SigApiCaptureRequest) => {
      setBusy(true);
      setLastError(null);
      try {
        return await api.capture(req);
      } catch (e: any) {
        setLastError(e?.message ?? "Capture failed");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [api]
  );

  const render = useCallback(
    async (req: SigApiRenderRequest) => {
      setBusy(true);
      setLastError(null);
      try {
        return await api.render(req);
      } catch (e: any) {
        setLastError(e?.message ?? "Render failed");
        throw e;
      } finally {
        setBusy(false);
      }
    },
    [api]
  );

  return {
    capture,
    render,
    busy,
    lastError,
  };
}
