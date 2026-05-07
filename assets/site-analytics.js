(function () {
  const config = window.OKALIK_ANALYTICS || {};
  const endpoint = String(config.endpoint || "").trim();
  if (!endpoint || endpoint.includes("PASTE_")) return;

  const sessionKey = "okalik_analytics_session";
  let sessionId = "";
  try {
    sessionId = sessionStorage.getItem(sessionKey) || "";
    if (!sessionId) {
      sessionId = (crypto && crypto.randomUUID)
        ? crypto.randomUUID()
        : `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem(sessionKey, sessionId);
    }
  } catch (error) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  const params = new URLSearchParams(window.location.search);
  const allowedParams = ["lang", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const campaign = allowedParams.reduce((memo, key) => {
    memo[key] = params.get(key) || "";
    return memo;
  }, {});

  function referrerHost(value) {
    if (!value) return "";
    try {
      const url = new URL(value);
      return url.hostname;
    } catch (error) {
      return "";
    }
  }

  const width = window.innerWidth || document.documentElement.clientWidth || 0;
  const payload = {
    type: "pageview",
    site: config.site || "okalik-nti-president",
    timestamp: new Date().toISOString(),
    path: window.location.pathname.replace(/\/index\.html$/, "/"),
    title: document.title,
    referrerHost: referrerHost(document.referrer),
    language: document.documentElement.lang || navigator.language || "",
    device: width < 700 ? "Mobile" : width < 1080 ? "Tablet" : "Desktop",
    viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
    sessionId,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
    campaign
  };

  const body = JSON.stringify(payload);
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "text/plain" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }
  } catch (error) {
    // Fall back to fetch below.
  }

  try {
    fetch(endpoint, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      body
    });
  } catch (error) {
    // Analytics should never block the page.
  }
})();
