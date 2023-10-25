addEventListener("fetch", (event) => {
  event.respondWith(proxy(event));
});

/**
 * @param {FetchEvent} event
 */
async function proxy(event) {
  const getReqHeader = (/** @type {string} */ key) =>
    event.request.headers.get(key);

  let url = new URL(event.request.url);
  url.hostname = "deb.debian.org";

  let UA = getReqHeader("User-Agent").toLowerCase();

  let parameter = {
    headers: {
      Host: url.hostname,
      "User-Agent": getReqHeader("User-Agent"),
      Accept: getReqHeader("Accept"),
      "Accept-Language": getReqHeader("Accept-Language"),
      "Accept-Encoding": getReqHeader("Accept-Encoding"),
      Connection: "keep-alive",
      "Cache-Control": "max-age=0",
    },
  };

  if (event.request.headers.has("Referer")) {
    parameter.headers.Referer = getReqHeader("Referer");
  }

  if (event.request.headers.has("Origin")) {
    parameter.headers.Origin = getReqHeader("Origin");
  }
  if (
    !(
      UA.includes("apt") ||
      UA.includes("curl") ||
      UA.includes("wget") ||
      (url.pathname.includes(".") && !url.pathname.endsWith("/"))
    )
  ) {
    if (event.request.url === "https://deb.akihi.me/debian") {
      return new Response(null, {
        status: 301,
        headers: {
          Location: "https://deb.akihi.me/debian/",
        },
      });
    }

    const proxyRequest = new Request(url, {
      method: event.request.method,
      headers: event.request.headers,
      body: event.request.body,
    });

    try {
      const proxyResponse = await fetch(proxyRequest);

      const clonedResponse = new Response(proxyResponse.body, {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        headers: proxyResponse.headers,
      });

      const openGraphMetaTags = `
      <meta property="og:title" content="deb.akihi.me" />
      <meta property="og:description" content="Debian mirrors backed by Cloudflare CDN" />
      <meta property="og:image" content="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@master/png/debian.png" />
      <meta property="og:image:width" content="64" />
      <meta property="og:image:height" content="64" />
      <meta name="twitter:title" content="deb.akihi.me">
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
            if (event.request.url === "https://deb.akihi.me/") {
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
        .transform(clonedResponse);

      return new Response(modifiedResponse.body, {
        status: clonedResponse.status,
        statusText: clonedResponse.statusText,
        headers: clonedResponse.headers,
      });
    } catch (error) {
      return new Response("Error: ${error.message}, { status: 500 }");
    }
  } else {
    return fetch(new Request(url, event.request), parameter);
  }
}
