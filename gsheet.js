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

async function updateValues(range, values) {
  return await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEETID,
    auth: client,
    range,
    valueInputOption: "RAW",
    requestBody: {
      range,
      values
    }
  });
}

async function calculateValues(firstCol, lastRow, closeSym, volumeSym) {
  return await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.SHEETID,
    auth: client,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              startRowIndex: 14,
              endRowIndex: lastRow,
              startColumnIndex: firstCol,
              endColumnIndex: firstCol + 1
            },
            cell: {
              userEnteredValue: {
                formulaValue: `=AVERAGEA(${volumeSym}2:${volumeSym}15)`
              }
            },
            fields: "userEnteredValue"
          }
        },
        {
          repeatCell: {
            range: {
              startRowIndex: 20,
              endRowIndex: lastRow,
              startColumnIndex: firstCol + 1,
              endColumnIndex: firstCol + 2
            },
            cell: {
              userEnteredValue: {
                formulaValue: `=AVERAGEA(${closeSym}2:${closeSym}21)`
              }
            },
            fields: "userEnteredValue"
          }
        },
        {
          repeatCell: {
            range: {
              startRowIndex: 40,
              endRowIndex: lastRow,
              startColumnIndex: firstCol + 2,
              endColumnIndex: firstCol + 3
            },
            cell: {
              userEnteredValue: {
                formulaValue: `=AVERAGEA(${closeSym}2:${closeSym}41)`
              }
            },
            fields: "userEnteredValue"
          }
        },
        {
          repeatCell: {
            range: {
              startRowIndex: 2,
              endRowIndex: lastRow,
              startColumnIndex: firstCol + 3,
              endColumnIndex: firstCol + 4
            },
            cell: {
              userEnteredValue: {
                formulaValue: `=((${closeSym}3-${closeSym}2)/${closeSym}2)*100`
              }
            },
            fields: "userEnteredValue"
          }
        }
      ]
    }
  });
}
//                          "K2:L2",    250,      250,      "E",        "J"
async function generateLimits(range, endRow, spanCols, closeSym, percentSym) {
  return await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.SHEETID,
    auth: client,
    range,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      range,
      values: [
        [
          `=STDEV(${percentSym}${endRow - spanCols + 3}:${percentSym}${
            endRow + 1
          })+AVERAGEA(${closeSym}${endRow - spanCols + 2}:${closeSym}${endRow + 1})`,
          `=STDEV(${percentSym}${endRow - spanCols + 3}:${percentSym}${
            endRow + 1
          })-AVERAGEA(${closeSym}${endRow - spanCols + 2}:${closeSym}${endRow + 1})`
        ]
      ]
    }
  });
}

module.exports = {
  setClient,
  getValues,
  updateValues,
  calculateValues,
  generateLimits
};
