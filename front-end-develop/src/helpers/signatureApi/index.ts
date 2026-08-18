import {
  SigApiCaptureRequest,
  SigApiCaptureResult,
  SigApiClientOptions,
  SigApiProblemJson,
  SigApiRenderRequest,
  SigApiRenderResult,
} from "@/types/signatureApi";

async function http<T>(
  path: string,
  init: RequestInit,
  opts: SigApiClientOptions
): Promise<T> {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 15000);

  try {
    const res = await fetch(
      (opts.baseUrl ?? "https://localhost:11402") + path,
      {
        ...init,
        headers: {
          "Content-Type": "application/json",
          ...(opts.apiKey ? { "X-Api-Key": opts.apiKey } : {}),
          ...(init.headers || {}),
        },
        signal: ctrl.signal,
      }
    );

    const isJson = res.headers.get("content-type")?.includes("json");

    if (!res.ok) {
      if (isJson) {
        const prob = (await res.json()) as SigApiProblemJson;
        const msg = prob.detail || prob.title || `HTTP ${res.status}`;
        throw Object.assign(new Error(msg), {
          problem: prob,
          status: res.status,
        });
      }
      const txt = await res.text().catch(() => "");
      throw Object.assign(new Error(txt || `HTTP ${res.status}`), {
        status: res.status,
      });
    }

    return (isJson ? ((await res.json()) as T) : await res.text()) as T;
  } finally {
    clearTimeout(to);
  }
}

export function createSignatureApi(opts: SigApiClientOptions) {
  return {
    capture: (body: SigApiCaptureRequest) =>
      http<SigApiCaptureResult>(
        "/signature/capture",
        { method: "POST", body: JSON.stringify(body) },
        opts
      ),

    render: (body: SigApiRenderRequest) =>
      http<SigApiRenderResult>(
        "/signature/render",
        { method: "POST", body: JSON.stringify(body) },
        opts
      ),
  };
}
