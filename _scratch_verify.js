const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const base = "http://localhost:3001";

  const checks = [
    { name: "Hotels (existing category)", url: `${base}/destinations/uae/dubai/hotels` },
    { name: "Apartments (newly migrated)", url: `${base}/destinations/uae/dubai/apartments` },
    { name: "Transfers/Airports (newly migrated)", url: `${base}/destinations/uae/dubai/airports` },
    { name: "Hotel detail via legacy numeric URL (ref_id=39)", url: `${base}/destinations/uae/dubai/hotels/39` },
  ];

  for (const c of checks) {
    await page.goto(c.url, { waitUntil: "networkidle", timeout: 30000 }).catch((e) => console.log(`${c.name}: navigation error`, e.message));
    await page.waitForTimeout(1500);
    const bodyText = await page.evaluate(() => document.body.innerText);
    const hasNoResults = /No .* found|no items|nothing here/i.test(bodyText);
    console.log(`\n=== ${c.name} ===`);
    console.log("URL:", c.url);
    console.log("length:", bodyText.length, "| looks empty:", hasNoResults);
    console.log(bodyText.slice(0, 400).replace(/\n+/g, " | "));
  }

  await browser.close();
})();
