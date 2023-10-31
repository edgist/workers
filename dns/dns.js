addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const { pathname, searchParams } = url;
  const acceptHeader = request.headers.get("Accept");

  if (pathname === "/dns-query" && acceptHeader === "application/dns-message") {
    const dnsOverHttpsUrl = "https://cloudflare-dns.com/dns-query";
    const dnsRequestUrl = new URL(dnsOverHttpsUrl);
    dnsRequestUrl.search = searchParams.toString();

    const dnsResponse = await fetch(dnsRequestUrl, {
      method: request.method,
      headers: request.headers,
    });

    return new Response(dnsResponse.body, {
      status: dnsResponse.status,
      statusText: dnsResponse.statusText,
      headers: dnsResponse.headers,
    });
  }
  return new Response("not found", { status: 404 });
}
