const get_categories = require("./src/get_categories");
const get_product_metadata = require("./src/get_product_metadata");
const get_product_details = require("./src/get_product_details");

(async () => {
  await get_product_details();
})();
