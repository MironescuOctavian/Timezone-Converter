// Run against an existing dev server. Streamed SSR failures can have status 200,
// so inspect the response payload as well as the HTTP status.
const baseUrl = process.env["LOCALE_CHECK_URL"] ?? "http://localhost:5173";
const locales = ["en", "ro", "pt", "ar", "de", "es", "fr", "hi", "ru", "zh"];
for (const locale of locales) {
  for (const page of ["", "world-clock"]) {
    const response = await fetch(`${baseUrl}/${locale}/${page}`);
    const html = await response.text();
    console.log(
      locale,
      page || "home",
      response.status,
      /data-error|Internal Server Error|STRICT_READ|ContextNotFoundError/.test(html),
    );
    if (
      response.status !== 200 ||
      /Object\.assign\(new (?:TypeError|ReferenceError|RangeError|Error)\(|displayCity\) is not a function/.test(
        html,
      )
    ) {
      const index = html.indexOf("displayCity) is not a function");
      console.log(html.slice(Math.max(0, index - 250), index + 1000).replace(/<[^>]+>/g, " "));
      throw new Error(`Failed ${locale}/${page}`);
    }
    if (response.status !== 200) console.log(html.replace(/<[^>]+>/g, " ").slice(0, 1600));
  }
}
