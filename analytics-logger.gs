// ============================================================
// Eegeesiak Campaign — Privacy-Light Pageview Analytics Logger
// ============================================================
// 1. Open https://sheets.google.com and create a new sheet
//    named "Okalik Site Analytics"
// 2. Click Extensions -> Apps Script
// 3. Delete the default code, paste THIS file
// 4. Save, then Deploy -> New deployment -> Web app
//    - Execute as: Me
//    - Who has access: Anyone
// 5. Copy the Web App URL
// 6. Paste it into assets/analytics-config.js as endpoint
//
// This logs anonymous pageview/session information only. It does
// not write names, emails, IP addresses, or user-agent strings to
// the Sheet.
// ============================================================

const SHEET_NAME = 'Pageviews';
const HEADERS = [
  'Timestamp',
  'Site',
  'Path',
  'Title',
  'Referrer Host',
  'Language',
  'Device',
  'Viewport',
  'Session ID',
  'UTM Source',
  'UTM Medium',
  'UTM Campaign',
  'UTM Content',
  'UTM Term',
  'Timezone'
];

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = spreadsheet.insertSheet(SHEET_NAME);

  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    if (data.type !== 'pageview') {
      return json_({ ok: false, error: 'Unsupported event type.' });
    }

    const campaign = data.campaign || {};
    const sheet = getSheet_();
    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.site || '',
      data.path || '',
      data.title || '',
      data.referrerHost || '',
      data.language || '',
      data.device || '',
      data.viewport || '',
      data.sessionId || '',
      campaign.utm_source || '',
      campaign.utm_medium || '',
      campaign.utm_campaign || '',
      campaign.utm_content || '',
      campaign.utm_term || '',
      data.timezone || ''
    ]);

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const days = Math.max(1, Math.min(Number(params.days || 30), 120));
  const summary = buildSummary_(days);
  const callback = sanitizeCallback_(params.callback || '');

  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(summary)});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return json_(summary);
}

function buildSummary_(days) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  const rows = values.slice(1);
  const timezone = Session.getScriptTimeZone();
  const now = new Date();
  const start = new Date(now.getTime() - ((days - 1) * 24 * 60 * 60 * 1000));
  start.setHours(0, 0, 0, 0);

  const dayKeys = [];
  const daily = {};
  for (let i = 0; i < days; i++) {
    const date = new Date(start.getTime() + (i * 24 * 60 * 60 * 1000));
    const key = Utilities.formatDate(date, timezone, 'yyyy-MM-dd');
    dayKeys.push(key);
    daily[key] = { date: key, views: 0, sessions: 0 };
  }

  const sessionsByDay = {};
  const sessions = {};
  const pages = {};
  const referrers = {};
  const languages = {};
  const devices = {};
  const campaigns = {};
  const recent = [];

  rows.forEach((row) => {
    const timestamp = parseDate_(row[0]);
    if (!timestamp || timestamp < start) return;

    const day = Utilities.formatDate(timestamp, timezone, 'yyyy-MM-dd');
    if (!daily[day]) return;

    const path = row[2] || '/';
    const referrer = row[4] || 'Direct / unknown';
    const language = row[5] || 'Unknown';
    const device = row[6] || 'Unknown';
    const sessionId = row[8] || '';
    const campaign = row[11] || row[9] || '';

    daily[day].views += 1;
    if (sessionId) {
      sessions[sessionId] = true;
      sessionsByDay[day] = sessionsByDay[day] || {};
      sessionsByDay[day][sessionId] = true;
    }

    pages[path] = (pages[path] || 0) + 1;
    referrers[referrer] = (referrers[referrer] || 0) + 1;
    languages[language] = (languages[language] || 0) + 1;
    devices[device] = (devices[device] || 0) + 1;
    if (campaign) campaigns[campaign] = (campaigns[campaign] || 0) + 1;

    recent.push({
      timestamp: timestamp.toISOString(),
      path,
      referrer,
      language,
      device
    });
  });

  dayKeys.forEach((day) => {
    daily[day].sessions = Object.keys(sessionsByDay[day] || {}).length;
  });

  const dailyRows = dayKeys.map((day) => daily[day]);
  const today = dailyRows[dailyRows.length - 1] || { views: 0, sessions: 0 };

  return {
    ok: true,
    generatedAt: now.toISOString(),
    days,
    totals: {
      views: dailyRows.reduce((sum, item) => sum + item.views, 0),
      sessions: Object.keys(sessions).length,
      todayViews: today.views,
      todaySessions: today.sessions
    },
    daily: dailyRows,
    topPages: top_(pages),
    referrers: top_(referrers),
    languages: top_(languages),
    devices: top_(devices),
    campaigns: top_(campaigns),
    recent: recent.slice(-20).reverse()
  };
}

function parseDate_(value) {
  if (value instanceof Date) return value;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

function top_(counts) {
  return Object.keys(counts)
    .map((name) => ({ name, count: counts[name] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

function sanitizeCallback_(value) {
  return /^[A-Za-z_$][0-9A-Za-z_$]*$/.test(value) ? value : '';
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
