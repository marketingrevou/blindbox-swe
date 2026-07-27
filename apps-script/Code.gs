/**
 * RevoU Blind Box — Google Apps Script Web App backend.
 *
 * Logs each play to a Google Sheet and enforces one-play-per-email.
 *
 * SETUP (see README.md for the full walkthrough):
 *   1. Create a Google Sheet. Note its ID from the URL.
 *   2. Extensions → Apps Script. Paste this file in.
 *   3. Set SHEET_ID below (or leave blank to use the bound sheet).
 *   4. Deploy → New deployment → Web app:
 *        - Execute as: Me
 *        - Who has access: Anyone
 *   5. Copy the /exec URL into SHEET_API in index.html.
 *
 * Columns written: Timestamp | Name | Email | Prize | Box | Program | UserAgent
 */

// Leave "" to use the Sheet this script is bound to (Extensions → Apps Script).
// Or paste a Sheet ID to target a standalone sheet.
const SHEET_ID = "";
const SHEET_NAME = "Plays";
const HEADERS = ["Timestamp", "Name", "Email", "Prize", "Box", "Program", "UserAgent"];

function getSheet_() {
  const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sh;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * GET ?email=foo@bar.com  →  { played: bool, prize: number|null }
 * Used by the login screen to block a second play per email.
 */
function doGet(e) {
  try {
    const email = ((e && e.parameter && e.parameter.email) || "").trim().toLowerCase();
    if (!email) return json_({ played: false });

    const sh = getSheet_();
    const last = sh.getLastRow();
    if (last < 2) return json_({ played: false });

    // Email is column 3, Prize is column 4
    const data = sh.getRange(2, 3, last - 1, 2).getValues();
    for (let i = 0; i < data.length; i++) {
      const rowEmail = String(data[i][0]).trim().toLowerCase();
      if (rowEmail === email) {
        return json_({ played: true, prize: Number(data[i][1]) || null });
      }
    }
    return json_({ played: false });
  } catch (err) {
    return json_({ played: false, error: String(err) });
  }
}

/**
 * POST body (JSON): { name, email, prize, box, ts, ua }
 * Appends one row. Called fire-and-forget from the client (mode:no-cors),
 * so the response body isn't read — but we still return JSON for testing.
 */
function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return json_({ ok: false, error: "missing email" });

    const sh = getSheet_();

    // Defensive de-dupe: if this email already exists, don't append again.
    const last = sh.getLastRow();
    if (last >= 2) {
      const emails = sh.getRange(2, 3, last - 1, 1).getValues();
      for (let i = 0; i < emails.length; i++) {
        if (String(emails[i][0]).trim().toLowerCase() === email) {
          return json_({ ok: true, duplicate: true });
        }
      }
    }

    sh.appendRow([
      body.ts || new Date().toISOString(),
      String(body.name || ""),
      email,
      Number(body.prize) || 0,
      String(body.box || ""),
      String(body.program || ""),
      String(body.ua || "")
    ]);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}
