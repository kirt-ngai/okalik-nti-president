# Okalik Eegeesiak for NTI President

Static GitHub Pages landing page for Okalik Eegeesiak's NTI President campaign.

## Files

- `index.html` - the public landing page
- `analytics.html` - staff traffic dashboard
- `analytics-logger.gs` - Google Apps Script collector for anonymous pageviews
- `assets/analytics-config.js` - analytics endpoint configuration
- `assets/site-analytics.js` - lightweight pageview tracker
- `assets/okalik-portrait.jpg` - hero portrait
- `assets/tattooed-fist.jpeg` - slogan illustration
- `assets/Okalik_Eegeesiak_Campaign_Bio.docx` - downloadable campaign bio
- `.nojekyll` - tells GitHub Pages to serve files as plain static assets

## Live Site

GitHub Pages URL:

https://kirt-ngai.github.io/okalik-nti-president/

Analytics page:

https://kirt-ngai.github.io/okalik-nti-president/analytics.html

## Analytics Setup

The dashboard starts collecting new visits only after the Google Apps Script endpoint is connected.

1. Create a Google Sheet named `Okalik Site Analytics`.
2. Open **Extensions -> Apps Script**.
3. Paste in `analytics-logger.gs`.
4. Deploy it as a web app:
   - Execute as: `Me`
   - Who has access: `Anyone`
5. Copy the Web App URL.
6. Paste it into `assets/analytics-config.js`:

```javascript
window.OKALIK_ANALYTICS = {
  site: "okalik-nti-president",
  endpoint: "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
};
```

The tracker logs anonymous pageviews and sessions. It does not write names, emails, IP addresses, or user-agent strings to the Sheet.
