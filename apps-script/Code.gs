// SoilScan — Apps Script Web App làm backend nhẹ cho Google Sheet.
// Cách dùng: xem hướng dẫn trong README.md phần "Bản đồ cộng đồng".

const SECRET = "REPLACE_WITH_YOUR_SHEETS_SECRET"; // phải khớp với SHEETS_SECRET trên Render
const SHEET_NAME = "SoilScanData";

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(["timestamp", "lat", "lng", "location_label", "soil_type", "health_score", "summary"]);
  }
  return sheet;
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.secret !== SECRET) {
      return ContentService.createTextOutput(JSON.stringify({ error: "unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getSheet_();
    sheet.appendRow([
      body.timestamp || new Date().toISOString(),
      body.lat,
      body.lng,
      body.location_label || "",
      body.soil_type || "",
      body.health_score ?? "",
      body.summary || "",
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const [header, ...data] = rows;

  const points = data
    .filter((row) => row[1] !== "" && row[2] !== "")
    .map((row) => {
      const obj = {};
      header.forEach((key, i) => (obj[key] = row[i]));
      return obj;
    });

  return ContentService.createTextOutput(JSON.stringify(points)).setMimeType(ContentService.MimeType.JSON);
}
