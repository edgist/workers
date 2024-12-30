addEventListener("fetch", (event) => {
  event.respondWith(proxy(event));
});

/**
 * @param {FetchEvent} event
 */
async function proxy(event) {
  const getReqHeader = (/** @type {string} */ key) =>
    event.request.headers.get(key);

  let targetURL = new URL(event.request.url);
  const country = event.request.cf.country;
  const colo = event.request.cf.colo;

  if (country === "HK" || colo === "HKG") {
    targetURL.hostname = "cdn-fastly.deb.debian.org";
  } else {
    targetURL.hostname = "deb.debian.org";
  }

  let parameter = {
    headers: {
      "Host": targetURL.hostname,
      "User-Agent": getReqHeader("User-Agent"),
      "Accept": getReqHeader("Accept"),
      "Accept-Encoding": getReqHeader("Accept-Encoding"),
      "Connection": "keep-alive",
      "Cache-Control": "max-age=0",
    },
  };
  if (event.request.headers.has("Range")) {
    parameter.headers.Range = getReqHeader("Range");
  }
  if (event.request.headers.has("Referer")) {
    parameter.headers.Referer = targetURL.toString();
  }

  const response = await fetch(new Request(targetURL, event.request), parameter);

  if (response.status === 301) {
    const location = response.headers.get("Location");
    const clientURL = new URL(event.request.url);
    const redirectURL = new URL(location);
    redirectURL.hostname = clientURL.hostname;
    const newResponse = new Response(response.body, response);
    newResponse.headers.set("Location", redirectURL.toString());
    return newResponse;
  }

  if (response.headers.has("Content-Type") && response.headers.get("Content-Type").includes("text/html")) {

    const openGraphMetaTags = `
      <meta property="og:title" content="deb.boletus.me" />
      <meta property="og:description" content="Debian mirrors backed by Cloudflare CDN" />
      <meta property="og:image" content="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@master/png/debian.png" />
      <meta property="og:image:width" content="64" />
      <meta property="og:image:height" content="64" />
      <meta name="twitter:title" content="deb.boletus.me">
      <meta name="twitter:description" content="Debian mirrors backed by Cloudflare CDN">
      <meta name="twitter:image" content="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@master/png/debian.png">
      `;
    const modifiedResponse = new HTMLRewriter()
      .on("head", {
        element(element) {
          element.append(
            "<title>Debian mirrors backed by Cloudflare CDN</title>" +
            '<link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABmJLR0QA/wD/AP+gvaeTAAACQElEQVRYw9WWsY7TQBCGv0U0AZkqdpPihJCbVER5ALu9/uLXQfc64D6t/QARnZsIEEWaTSp8IeVSJI7s9e7aPpNDTGnvzvzzz8w/K3iGrQnVhBkAJ3bcsQVWnPjOExsRDfAlhgTOiFXfsyd2HFmIBz6PB1DP+DkWk1njdAIwZR3gM+eL9a4JsA2EE4AeXJANqq9+3wTile3yhmXj8oFgUHBTwDVhi83X+occiIASDzg30z3bQc2qs6YuTJzLsnUzENWoGxu88lcHk7sYSEmYIq80dQVPSXjL10bDmfrEo6TEwwdVkAhqo9kqQUCGJObEzplZDiikEmxFpNGaklCf/x98EFOk+knY8tMqgSQG4E1H9r8Jla0xfU186mD0fw0A7/l2pd/V8SkJAe+wqZzt7oQZexI7gCc2vRpuilTLjrM5j31ctXsAcNb/XPtui/hk9PtAZmfAZ6UA7vjYC70LpMmOLNxKuL/o+96h85WlWi2biTRJMimgEYDOhMkizlTW9aLKurgEntd2TErChBkHAuNqNgKQ7J3ZH1mIE7vGvoi0wFXwKVIF+NaJaQDou2yqWZb8Yk2o9JqnJGTEaopUBwLhWt2tHxuWqsRzPiIqK+Cqbvr+9yjpGlVjCaot2Of5NQdxz1YcWYgAH4+SA4GIyUSf4FbLiNWQ998YMzZh1yK6OYBqDb8EC9YnWYAPQOHQhJsCqEanSxNubi/ZkE4QLj3/r5kYJBYFKyXZ/5XX8igrWP37vsh5ZE2oClYqH+HnD8KP16YBvW+JAAAAAElFTkSuQmCC" />',
            { html: true }
          );
          element.append(openGraphMetaTags, { html: true });
        },
      })
      .on("title, h1", {
        element(element) {
          if (event.request.url === "https://deb.boletus.me/") {
            const tagName = element.tagName.toLowerCase();
            if (tagName === "title" || tagName === "h1") {
              element.setInnerContent("Debian mirrors backed by ");
              if (tagName === "title") {
                element.append("Cloudflare CDN", { html: true });
              } else {
                element.append("<s>Fastly</s> Cloudflare CDN", {
                  html: true,
                });
              }
            }
          }
        },
      })
      .transform(response);

    return new Response(modifiedResponse.body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } return response;
}
