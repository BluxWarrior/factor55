const fs = require("fs");
const path = require("path");
const Papa = require("papaparse");
const JSZip = require("jszip");

function getAllData() {
  const subdirs = fs.readdirSync("./assets/data");

  data = [];
  for (const sd of subdirs) {
    const fullPath = `./assets/data/${sd}`;
    if (!fs.statSync(fullPath).isFile()) {
      const filenames = fs.readdirSync(fullPath);
      for (const fn of filenames) {
        const path = `${fullPath}/${fn}`;
        data = data.concat(JSON.parse(fs.readFileSync(path, "utf8")));
      }
    } else {
      data = data.concat(JSON.parse(fs.readFileSync(fullPath, "utf8")));
    }
  }

  return data;
}

function getNewData(data) {
  const new_data = [];
  for (let dt of data) {
    let new_options = [dt["options"][0]];
    for (const op of dt["options"].slice(1)) {
      let new_imgs = dt["options"][0].imgs.slice(0);
      new_imgs.unshift(op.img);
      new_options.push({
        skunumber: op.skunumber,
        mpnnumber: op.mpnnumber,
        oldprice: dt["options"][0].oldprice,
        finalprice: op.finalprice,
        instock: op.instock,
        imgs: new_imgs,
        optionname: op.optionname,
      });
    }
    if (new_options.length > 1) new_options = new_options.slice(1);
    new_data.push({
      options: new_options,
      description: dt.description,
      name: dt.name,
      url: dt.url,
    });
  }
  return new_data;
}

function refactor(data) {
  let refactoredData = [];
  let count = 0;

  data.forEach((dt) => {
    const seperatedurl = dt.url.split("/");
    const handle = seperatedurl[seperatedurl.length - 1];
    const title = dt.name;
    const body = dt.description;

    dt.options.forEach((option, oid) => {
      const skunumber = option.skunumber;
      const mpnnumber = option.mpnnumber;
      let finalprice = option.finalprice;
      let oldprice = option.oldprice;
      if (oldprice === "") oldprice = finalprice;

      const optionname = option.optionname;

      let inventorytracker = "";
      let inventorypolicy = "";
      if (option["instock"] === "In stock") inventorypolicy = "continue";
      else {
        inventorytracker = "shopify";
        inventorypolicy = "deny";
      }
      option.imgs.forEach((img, i) => {
        let tempPd = {
          Handle: handle,
          Title: title,
          "Body (HTML)": body,
          Vendor: "",
          "Product Category": "Vehicles & Parts > Vehicle Parts & Accessories",
          Type: "",
          Tags: "",
          Published: "",
          "Option1 Name": "",
          "Option1 Value": "",
          "Variant SKU": skunumber,
          "Variant Grams": "",
          "Variant Inventory Tracker": inventorytracker,
          "Variant Inventory Policy": inventorypolicy,
          "Variant Fulfillment Service": "manual",
          "Variant Price": finalprice,
          "Variant Compare At Price": oldprice,
          "Variant Requires Shipping": "TRUE",
          "Variant Taxable": "TRUE",
          "Variant Barcode": mpnnumber,
          "Image Src": img,
          "Image Position": i + 1,
          "Image Alt Text": "",
          "Gift Card": "FALSE",
          "SEO Title": "",
          "SEO Description": "",
          "Google Shopping / Google Product Category": "",
          "Google Shopping / Gender": "",
          "Google Shopping / Age Group": "",
          "Google Shopping / MPN": "",
          "Google Shopping / Condition": "",
          "Google Shopping / Custom Product": "",
          "Google Shopping / Custom Label 0": "",
          "Google Shopping / Custom Label 1": "",
          "Google Shopping / Custom Label 2": "",
          "Google Shopping / Custom Label 3": "",
          "Google Shopping / Custom Label 4": "",
          "Variant Image": "",
          "Variant Tax Code": "",
          "Cost per item": "",
          "Included / United States": "TRUE",
          "Price / United States": "",
          "Compare At Price / United States": "",
          "Included / International": "TRUE",
          "Price / International": "",
          "Compare At Price / International": "",
        };

        // options logic
        if (
          optionname == "original" ||
          dt.options.length === 1 ||
          oid + i > 0
        ) {
          tempPd["Option1 Name"] = "";
          tempPd["Option1 Value"] = "";
        }

        if (i !== 0) {
          tempPd.Title = "";
          tempPd["Body (HTML)"] = "";
          tempPd.Vendor = "";
          tempPd["Variant SKU"] = "";
          tempPd["Variant Inventory Tracker"] = "";
          tempPd["Variant Inventory Policy"] = "";
          tempPd["Variant Fulfillment Service"] = "";
          tempPd["Variant Price"] = "";
          tempPd["Variant Compare At Price"] = "";
          tempPd["Product Category"] = "";
          tempPd["Option1 Name"] = "";
          tempPd["Variant Requires Shipping"] = "";
          tempPd["Variant Taxable"] = "";
          tempPd["Variant Barcode"] = "";
          tempPd["Gift Card"] = "";
          tempPd["Included / United States"] = "";
          tempPd["Included / International"] = "";
        }

        if (oid > 0) {
          tempPd.Title = "";
          tempPd["Body (HTML)"] = "";
          tempPd.Vendor = "";
          tempPd["Option1 Name"] = "";
        }
        if (i === 0 && optionname != "original") {
          tempPd["Option1 Name"] = "color";
          tempPd["Option1 Value"] = optionname;
        }
        refactoredData.push(tempPd);
      });
    });
  });

  console.log(count);
  return refactoredData;
}

function convertToCSV(data, outputPath) {
  // Here you would implement or use a library to write the CSV.
  // Since papaparse is a popular choice, this example will use it.

  const bom = "\uFEFF";
  const csv =
    bom +
    Papa.unparse(data, {
      encoding: "utf-8",
    });
  fs.writeFileSync(outputPath, csv, "utf8");
  console.log(
    `The JSON data has been successfully converted to '${outputPath}'.`
  );
}

function zipFile(filePath, outputZipPath, compressionLevel = "DEFLATE") {
  const zip = new JSZip();
  const fileName = path.basename(filePath);

  fs.readFile(filePath, function (err, data) {
    if (err) throw err;

    // Add the file to the zip
    zip.file(fileName, data, { compression: compressionLevel });

    // Generate the zip file as a buffer
    zip
      .generateAsync({ type: "nodebuffer", compression: compressionLevel })
      .then(function (content) {
        // Write zip file to disk
        fs.writeFile(outputZipPath, content, function (err) {
          if (err) throw err;
          console.log(`Zipped file saved to ${outputZipPath}`);
        });
      });
  });
}

async function getCSV() {
  const data = getAllData();
  const new_data = getNewData(data);
  console.log(data.length);
  console.log(new_data.length);

  const refactoredData = refactor(new_data);
  convertToCSV(refactoredData, "./assets/output.csv");
  zipFile("./assets/output.csv", "./assets/output.zip");
}

getCSV().catch(console.error);
