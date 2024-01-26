const puppeteer = require("puppeteer");
const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function get_categories() {
  // Launch a new browser session
  const browser = await puppeteer.launch({ headless: "new" });

  // Open a new page
  const page = await browser.newPage();

  // Set the navigation timeout (in milliseconds)
  page.setDefaultNavigationTimeout(30000); // Timeout after 30 seconds

  // Navigate to the specified URL
  await page.goto("https://www.factor55.com/c-products");
  await sleep(1000);

  // Get categories
  const categories = await page.evaluate(() => {
    const categoryDivs = document.querySelectorAll('li[class="inactive"]');
    const categories = [];
    categoryDivs.forEach((div) => {
      const a = div.querySelector("a");
      categories.push({
        category: a.textContent.trim(),
        url: a.href,
      });
    });

    return categories;
  });

  const jsonContent = JSON.stringify(categories, null, 2);
  fs.writeFileSync("./assets/categories.json", jsonContent, "utf8", (err) => {
    if (err) {
      console.error("An error occurred:", err);
      return;
    }
    console.log("JSON file has been saved.");
  });

  browser.close();
}

module.exports = get_categories;
