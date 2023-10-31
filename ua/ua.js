addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

/**
 * @param {Request<unknown, CfProperties<unknown>>} request
 */
async function handleRequest(request) {
  return new Response(request.headers.get("User-Agent") + "\n");
}
