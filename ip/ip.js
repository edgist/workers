addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  var ip = request.headers.get("CF-Connecting-IP");
  var country = request.cf.country;
  var city = request.cf.city ? request.cf.city : "";
  var asn = request.cf.asn;
  var isp = request.cf.asOrganization;
  return new Response(
    ip + "\n" + country + "  " + city + "\n" + "AS" + asn + "  " + isp + "\n"
  );
}
