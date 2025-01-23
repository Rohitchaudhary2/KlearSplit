import fs from "fs";
import csv from "csv-parser";
import { ErrorHandler } from "../middlewares/errorHandler.js";

const compareHeaders = (expected, actual) => {
  const errorOccured = [];

  if (expected.length !== actual.length) {
    throw new ErrorHandler(400, "Actual headers differ from Expected");
  }

  expected.forEach((item, index) => {
    if (item !== actual[ index ]) {
      errorOccured.push({
        "row": 1,
        "errors": [ `Expected ${item}, but got ${actual[ index ]}` ]
      });
    }
  });
  if (errorOccured.length > 0) {
    throw new ErrorHandler(400, errorOccured);
  }
};

const fileData = (req) => {
  return new Promise((resolve, reject) => {
    const readRows = [];
    const EXPECTED_HEADERS = [ "Name", "Amount", "Split Type", "Payer Email ID", "Debtor Email ID", "Payer Share", "Debtor Share" ];
    const actualHeaders = [];

    fs.createReadStream(req.file.path)
      .pipe(csv()
        .on("headers", (headerList) => {
          headerList.forEach((header) => actualHeaders.push(header));
          try {
            compareHeaders(EXPECTED_HEADERS, actualHeaders);
          } catch (error) {
            reject(error);
          }
        }))
      .on("data", (data) => {
        if (Object.keys(data).length > 0) {
          readRows.push(data);
        }
      })
      .on("end", () => {
        resolve(readRows);
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};

export default fileData;
