import { createHash } from "node:crypto";

export async function GET() {
  const secret = process.env.SYNC_SECRET;
  if (!secret) return Response.json({ error: "Configuração ausente" }, { status: 503 });
  return Response.json({ fingerprint: createHash("sha256").update(secret).digest("hex") });
}
