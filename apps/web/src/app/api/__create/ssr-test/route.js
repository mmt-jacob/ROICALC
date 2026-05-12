// SSR test is a cloud-only feature — no-op for local development
export async function GET() {
  return Response.json({ results: [] });
}
