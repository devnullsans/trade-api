const { join } = require("path");
const { google } = require("googleapis");
const sheets = google.sheets("v4");
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

// GCLOUD_PROJECT env needs to be set with your-project-id
const auth = new google.auth.GoogleAuth({
  keyFile: join(process.cwd(), "keys.json"),
  scopes: SCOPES
});

let client = null;

async function setClient() {
  client = await auth.getClient();
}

async function getValues(range) {
  return await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.SHEETID,
    auth: client,
    range
  });
}

async function updateValues(major, range, values) {
  return await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEETID,
    auth: client,
    range,
    valueInputOption: "RAW",
    requestBody: {
      range,
      values,
      majorDimension: major
    }
  });
}

module.exports = {
  setClient,
  getValues,
  updateValues
};
