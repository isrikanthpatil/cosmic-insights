/// <reference path="../pb_data/types.d.ts" />

// Mobile OAuth2 return bridge for Astropanth.
//
// Google's Web OAuth client only permits https redirect URIs, so the mobile app
// cannot send Google straight back to its custom scheme. Instead the app points
// Google's redirect_uri at THIS route. We read the returned ?code&state (or
// ?error) and bounce the in-app browser to the app's custom scheme
// (cosmic-insights://oauth?...). That deep link makes Android close the in-app
// browser and hands the authorization code back to the React Native client,
// which then completes the PKCE exchange via authWithOAuth2Code().
//
// Deploy: copy this file to  <pocketbase>/pb_hooks/oauth_redirect.pb.js  on the
// server and restart PocketBase (systemctl restart pocketbase). Also add
//   https://api.astropanth.com/oauth-redirect
// as an Authorized redirect URI on the Google OAuth Web client.
routerAdd("GET", "/oauth-redirect", (e) => {
  const q = e.request.url.query();
  const code = q.get("code") || "";
  const state = q.get("state") || "";
  const error = q.get("error") || "";

  const enc = encodeURIComponent;
  const target = error
    ? "cosmic-insights://oauth?error=" + enc(error)
    : "cosmic-insights://oauth?code=" + enc(code) + "&state=" + enc(state);

  const html =
    '<!doctype html><html><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>Signing you in…</title>" +
    "<script>window.location.replace(" + JSON.stringify(target) + ");</script>" +
    "</head>" +
    '<body style="margin:0;background:#0B0B1A;color:#F4F1E8;' +
    'font-family:-apple-system,Segoe UI,Roboto,sans-serif;text-align:center">' +
    '<div style="padding:64px 24px">' +
    '<p style="font-size:16px">Signing you in…</p>' +
    '<p><a href="' + target + '" style="color:#E8C87E;font-weight:600;' +
    'text-decoration:none">Tap here to return to Astropanth</a></p>' +
    "</div></body></html>";

  return e.html(200, html);
});
