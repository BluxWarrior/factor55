const puppeteer = require("puppeteer");
const fs = require("fs");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function get_details(page) {
  const product = {};

  // get original option
  const originaloption = await page.evaluate(() => {
    // get SKU
    const skunumber = document.querySelector('meta[itemprop="sku"]').content;
    // get MPN
    const mpnnumber = document
      .querySelector('span.value[id*="mpn"]')
      .textContent.trim();

    // get final price
    const finalprice = document
      .querySelector('div[class="product-price"]')
      .textContent.trim()
      .replace("$", "");
    // get old price
    let oldprice = "";
    const oldpriceDiv = document.querySelector(
      'div[class="old-product-price"]'
    );
    if (oldpriceDiv) oldprice = oldpriceDiv.textContent.trim().split("$")[1];
    const shortdescriptionDiv = document.querySelector(
      'div[class="short-description"]'
    );
    if (shortdescriptionDiv) {
      const msrpDiv = shortdescriptionDiv.querySelector(
        'p[class="price-msrp"]'
      );
      if (msrpDiv) oldprice = msrpDiv.textContent.trim().split("$")[1];
    }

    // get instock
    let instock = "";
    const instockDiv = document.querySelector(
      'span.value[id*="stock-availability-value"]'
    );
    if (instockDiv) instock = instockDiv.textContent.trim();

    // images
    const images = [];
    const itemimageDivs = document.querySelectorAll('img[src*="105.jpeg"');
    itemimageDivs.forEach((div) => {
      const imgurl = div.src.replace("105.jpeg", "625.jpeg");
      if (!images.includes(imgurl)) images.push(imgurl);
    });
    if (images.length === 0) {
      images.push(document.querySelector('img[id*="main-product-img"]').src);
    }

    return {
      skunumber: skunumber,
      mpnnumber: mpnnumber,
      oldprice: oldprice,
      finalprice: finalprice,
      instock: instock,
      imgs: images,
      optionname: "original",
    };
  });

  const pageHTML = await page.content();
  const options = [originaloption];

  // get options
  for (const element of pageHTML.split("n.push(").slice(1)) {
    const jsonString = element
      .split(");")[0]
      .replace("DisplayOrder:t++,", "")
      .replace(/ShortDescription:"[^"]*",/i, "")
      .replace(/(?<!")(\b\w+)(?<!:\/\/|https)(?="?:)/g, '"$1"');
    const jsonObject = JSON.parse(jsonString);
    options.push({
      skunumber: jsonObject.Sku,
      mpnnumber: jsonObject.Mpn,
      oldprice: "",
      finalprice: jsonObject.Price,
      instock: jsonObject.StockAvailability,
      img: jsonObject.DefaultImage,
      optionname: jsonObject.ColorName,
    });
  }

  // get description
  const description = await page.evaluate(() => {
    return document
      .querySelector('div[class="productTabs-body"]')
      .innerHTML.trim();
  });
  return {
    options: options,
    description: description
      .split('<div id="quickTab-reviews"')[0]
      .replace('style="display: none;"', "")
      .replace('aria-hidden="true"', 'aria-hidden="false"'),
  };
}

(async () => {
  // Launch a new browser session
  const browser = await puppeteer.launch({ headless: false });

  // Open a new page
  const page = await browser.newPage();

  // Set the navigation timeout (in milliseconds)
  page.setDefaultNavigationTimeout(30000); // Timeout after 30 seconds

  // Navigate to the specified URL
  await page.goto("https://www.factor55.com/p-xtv-6-hawse-fairlead-00023");
  await sleep(1000);

  const data = await get_details(page);

  browser.close();
  const jsonContent = JSON.stringify(data, null, 2);
  fs.writeFileSync("./__plusper.json", jsonContent, "utf8", (err) => {
    if (err) {
      console.error("An error occurred:", err);
      return;
    }
    console.log("JSON file has been saved.");
  });
})();
