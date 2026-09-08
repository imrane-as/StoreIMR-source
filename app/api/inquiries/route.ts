export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      items?: number[];
      total?: number;
    };

    if (!body.items?.length || !Number.isFinite(body.total)) {
      return Response.json(
        { error: "Sélection invalide" },
        { status: 400 }
      );
    }

    return Response.json(
      {
        success: true,
        inquiry: {
          id: crypto.randomUUID(),
          items: body.items,
          total: body.total,
          status: "new",
          createdAt: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  } catch {
    return Response.json(
      { error: "La demande n’a pas pu être envoyée" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return Response.json({ inquiries: [] });
}