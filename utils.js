const fs = require("fs");

async function count_files(dir) {
  let count = 0;
  const subdirs = fs.readdirSync(dir);

  for (const sd of subdirs) {
    const fullPath = `${dir}/${sd}`;
    if (fs.statSync(fullPath).isFile()) {
      count += 1;
    } else {
      count += fs.readdirSync(fullPath).length;
    }
  }

  return count;
}

async function get_progress() {
  let progress = {
    categories: 0.0,
    metadata: 0.0,
    details: 0.0,
  };

  // get categories process
  let numberofbrands = 0;
  if (fs.existsSync(`./assets/categories.json`)) {
    progress["categories"] = 100.0;
    numberofcategories = JSON.parse(
      fs.readFileSync("./assets/categories.json", "utf8")
    ).length;
  } else {
    return progress;
  }

  // get metadata process
  if (
    fs.existsSync(`./assets/metadata.json`) &&
    progress["categories"] == 100.0
  ) {
    progress["metadata"] = 100.0;
  }

  // get details process
  if (fs.existsSync(`./assets/data`) && progress["metadata"] == 100.0) {
    progress["details"] =
      ((await count_files("./assets/data")) / numberofcategories) * 100;
  }

  return progress;
}

(async () => {
  const process = await get_progress();
  console.log(process);
})();

module.exports = get_progress;
