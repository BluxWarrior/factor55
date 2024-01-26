const puppeteer = require("puppeteer");
const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function get_metadata(page) {
  const metadata = await page.evaluate(() => {
    const metadataDivs = document.querySelectorAll('h2[class="product-title"]');

    const metadata = [];
    metadataDivs.forEach((div) => {
      const a = div.querySelector("a");
      metadata.push({ name: a.textContent.trim(), url: a.href });
    });

    return metadata;
  });

  return metadata;
}

async function get_product_metadata() {
  const categories = JSON.parse(
    fs.readFileSync("./assets/categories.json", "utf8")
  );
  let data = [];
  if (fs.existsSync("./assets/metadata.json"))
    data = JSON.parse(fs.readFileSync("./assets/metadata.json", "utf8"));

  let finished = false;
  while (!finished) {
    // Launch a new browser session
    const browser = await puppeteer.launch({ headless: false });

    // Open a new page
    const page = await browser.newPage();

    // Set the navigation timeout (in milliseconds)
    page.setDefaultNavigationTimeout(30000); // Timeout after 30 seconds

    try {
      for (const category of categories.slice(data.length)) {
        await page.goto(category.url);
        await sleep(1000);
        // get metadata
        let metadata = await get_metadata(page);

        let pageNumber = 2;
        let isresult = true;
        while (isresult) {
          await page.goto(
            `${category.url}#/pageSize=15&orderBy=0&pageNumber=${pageNumber}`
          );
          await sleep(1000);

          // check if there is result
          const divSelector = ".k-widget.k-window.ajaxFilters";
          const div = await page.$(divSelector);

          if (div) {
            console.log("no result");
            isresult = false;
          } else {
            metadata = metadata.concat(await get_metadata(page));
          }

          pageNumber++;
        }

        data.push({
          category: category.category,
          url: category.url,
          products: metadata,
        });

        // save metadata
        const jsonContent = JSON.stringify(data, null, 2);
        fs.writeFileSync(
          "./assets/metadata.json",
          jsonContent,
          "utf8",
          (err) => {
            if (err) {
              console.error("An error occurred:", err);
              return;
            }
            console.log("JSON file has been saved.");
          }
        );
      }
    } catch (err) {
      console.log(err);
      await browser.close();
    }

    finished = true;
    await browser.close();
  }
}

module.exports = get_product_metadata;
