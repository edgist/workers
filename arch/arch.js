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

  if (url.pathname.startsWith("/archlinux") || url.pathname.startsWith("/icons") || url.pathname === "/" ) {
    const country = event.request.cf.country;
    const colo = event.request.cf.colo;

    if (country === "US") {
      url.hostname = "arch.hu.fo";
    } else if (
      colo === "NRT" ||
      colo === "KIX" ||
      colo === "FUK" ||
      colo === "OKA"
    ) {
      url.hostname = "mirror.nishi.network";
    } else if (country === "HK" || colo === "HKG") {
      url.hostname = "mirror-hk.koddos.net";
    } else if (country === "CA") {
      url.hostname = "mirror.cedille.club";
    } else {
      const mirrors = [
        "arch.hu.fo",
        "mirrors.sonic.net",
        "mirror.lty.me",
        "mirrors.xtom.com",
      ];
      var randomMirror = mirrors[Math.floor(Math.random() * mirrors.length)];
      url.hostname = randomMirror;
    }

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

    const response = await fetch(new Request(url, event.request), parameter);

    if (response.headers.get("Content-Type").includes("text/html")) {
      const openGraphMetaTags = `
    <meta property="og:url" content="https://arch.akihi.me">
    <meta property="og:type" content="website">
    <meta property="og:title" content="arch.akihi.me" />
    <meta property="og:description" content="Arch Linux mirror" />
    <meta property="og:image" content="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@master/png/arch.png" />
    <meta property="og:image:width" content="64" />
    <meta property="og:image:height" content="64" />
    <meta property="twitter:domain" content="arch.akihi.me">
    <meta property="twitter:url" content="https://arch.akihi.me">
    <meta name="twitter:title" content="arch.akihi.me">
    <meta name="twitter:description" content="Arch Linux mirror">
    <meta name="twitter:image" content="https://cdn.jsdelivr.net/gh/walkxcode/dashboard-icons@master/png/arch.png">
    `;

      const modifiedResponse = new HTMLRewriter()
        .on("head", {
          element(element) {
            element.append(
              '<link rel="icon" type="image/png" href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAABuElEQVQ4y5WQP2gTURzHP+/dS85rTeGuYG+oi4kUSslgEdTZVRBxEZ0crGAWwYBQdNFZhx6dHArtIg4iWkGhg1MRRegVFcVoqRkOLSIGkibeu+dygTTkQv0u78fvz5fP+wpjDFnyg/D4aE6q2tzMetaOYriuWUKMAJkGIovg8OLmuBDU85ZUU549tXq+9HXQnsxyHs3LOUfJA2BUK06uZ+1lGjhKHnGUxFGSVpxcvPpy2923wamVT2dtS7yxlVhzlKSjjVv/05nfVwazSx/znqNqxjAZG/MrMbjaGOFYslHIy+Ljc8WfQwk8R1VHcnLSVgJj8No6EX+1YVcnhZY2t4YSTD/4MHbUs7d2mrH7vdGho/fS2ZZojNlWafPy9I+BBLs6qb6Lmm7td7t7/AR42J23tSnstOIbAwn8IDwE1ICD6exZVCmfSWfLwKW03wSKUaUc9RPc7jkGeNpTv0hfA3wDqnu+4AdhEbjSl8+Xnvp9lxiwgUf9GdwFcmm9BdwDPvcY1IH7wDZQAtb8ILwAICYWNo4Bb4HnwJ2oUn7NEPlBeBKYB04DM2JiYeMm8CqqlNf5D6VGJ/4BcSib4cIIXvoAAAAASUVORK5CYII=" />',
              { html: true }
            );
            element.append(openGraphMetaTags, { html: true });
          },
        })
        .on("body", {
          element(element) {
            if (url.pathname === "/archlinux/") {
              element.append(
                `
              <div style="position: relative; bottom: 5px;font-size: 16px; text-align: left;">
              <p>Country: ${country}, Colo: ${colo}, Mirror: ${url.hostname}</p>
              </div>
            `,
                { html: true }
              );
            }
          },
        })
        .transform(response);

      return new Response(modifiedResponse.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
    return response;
  } else {
    return new Response("Access denied. Invalid path.", { status: 403 });
  }
}
