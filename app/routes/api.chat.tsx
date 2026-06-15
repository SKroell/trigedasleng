import type { ActionFunctionArgs } from "react-router";

// Server-side proxy to the standalone Python RAG service. The ML stack never
// runs in the Node app; we just forward the request. Configure the endpoint with
// AI_SERVICE_URL (no trailing slash), e.g. http://127.0.0.1:8000 in dev or the
// internal HPC/service URL in production.
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://127.0.0.1:8000";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const message = (body?.message ?? "").toString().trim();
  if (!message) {
    return Response.json({ error: "Empty message" }, { status: 400 });
  }

  try {
    const res = await fetch(`${AI_SERVICE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        canon_only: Boolean(body?.canon_only),
        history: Array.isArray(body?.history) ? body.history.slice(-10) : [],
      }),
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json(
        { error: `AI service error (${res.status})`, detail },
        { status: 502 }
      );
    }

    return Response.json(await res.json());
  } catch (e: any) {
    return Response.json(
      {
        error: "AI service unreachable",
        detail: String(e?.message ?? e),
        hint: `Is the RAG service running at ${AI_SERVICE_URL}?`,
      },
      { status: 503 }
    );
  }
}
