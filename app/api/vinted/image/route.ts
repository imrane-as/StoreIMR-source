const VINTED_IMAGE_HOST = /^(?:images\d*\.)vinted\.net$/i;

export async function GET(request: Request) {
  try {
    const source = new URL(request.url).searchParams.get("url");
    if (!source) return new Response("Image manquante", { status: 400 });
    const imageUrl = new URL(source);
    if (imageUrl.protocol !== "https:" || !VINTED_IMAGE_HOST.test(imageUrl.hostname)) {
      return new Response("Image refusée", { status: 403 });
    }

    const response = await fetch(imageUrl, {
      headers: {
        accept: "image/avif,image/webp,image/*",
        "accept-language": "fr-FR,fr;q=0.9",
        referer: "https://www.vinted.fr/",
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
      },
      cache: "force-cache",
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.startsWith("image/")) {
      return new Response("Image indisponible", { status: 404 });
    }

    return new Response(response.body, {
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    });
  } catch {
    return new Response("Image indisponible", { status: 404 });
  }
}
