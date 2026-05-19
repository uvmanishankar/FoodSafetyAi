type ApiResponse = {
  status: (statusCode: number) => ApiResponse;
  setHeader: (key: string, value: string) => ApiResponse;
  send: (body: unknown) => void;
  json?: (body: unknown) => void;
  end: () => void;
};

export default async function handler(_req: any, res: ApiResponse) {
  const checks: Record<string, unknown> = {
    groqKey: !!process.env.GROQ_API_KEY,
    mistralKey: !!process.env.MISTRAL_API_KEY,
    offReachable: false,
    timestamp: Date.now(),
  };

  try {
    const r = await fetch('https://world.openfoodfacts.org/api/v2/product/737628064502.json', { headers: { Accept: 'application/json' } });
    checks.offReachable = r.ok;
  } catch (e) {
    // ignore
  }

  try { res.setHeader('Content-Type', 'application/json'); } catch {}
  try { res.setHeader('Cache-Control', 'no-store'); } catch {}
  res.status(200).send(JSON.stringify(checks));
}
