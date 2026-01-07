const graphBase = "https://graph.microsoft.com/v1.0";

async function getToken() {
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token error: ${resp.status} ${text}`);
  }

  return (await resp.json()).access_token;
}

module.exports = async function (context, req) {
  try {
    const hostname = process.env.SP_HOSTNAME;
    const sitePath = process.env.SP_SITE_PATH;

    const token = await getToken();

    // 1) Resolve site by path
    const siteResp = await fetch(
      `${graphBase}/sites/${hostname}:${sitePath}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!siteResp.ok) throw new Error(`Site lookup failed: ${siteResp.status} ${await siteResp.text()}`);
    const site = await siteResp.json();

    // 2) List items in the site's default drive root
    const itemsResp = await fetch(
      `${graphBase}/sites/${site.id}/drive/root/children`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!itemsResp.ok) throw new Error(`Drive list failed: ${itemsResp.status} ${await itemsResp.text()}`);
    const items = await itemsResp.json();

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: {
        site: { id: site.id, name: site.name, webUrl: site.webUrl },
        files: (items.value || []).map(x => ({
          id: x.id,
          name: x.name,
          webUrl: x.webUrl,
          size: x.size
        }))
      }
    };
  } catch (e) {
    context.res = { status: 500, body: { error: String(e) } };
  }
};
