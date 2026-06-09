export async function GET() {
  return Response.json({
    ok: true,
    service: 'rpg-builder-api',
  });
}
