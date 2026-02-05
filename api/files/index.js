// Lists items in the SharePoint site's *default document library* root,
// or (if parentId is provided) lists children of that folder item.
//
// Env vars required:
//   TENANT_ID, CLIENT_ID, CLIENT_SECRET, SP_HOSTNAME, SP_SITE_PATH

const graphBase = "https://graph.microsoft.com/v1.0";

async function getFetch() {
  if (typeof fetch === "function") return fetch;
  const mod = await import("node-fetch");
  return mod.default;
}

function normalizeSitePath(p) {
  if (!p) return "";
  return p.startsWith("/") ? p : `/${p}`;
}

async function getToken() {
  const tenantId = process.env.TENANT_ID;
  const clientId = process.env.CLIENT_ID;
  const clientSecret = process.env.CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("Missing TENANT_ID / CLIENT_ID / CLIENT_SECRET env vars.");
  }

  const url = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default",
  });

  const _fetch = await getFetch();
  const resp = await _fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Token error: ${resp.status} ${text}`);
  }

  const json = await resp.json();
  if (!json.access_token) throw new Error("Token response missing access_token.");
  return json.access_token;
}

async function graphGet(url, token) {
  const _fetch = await getFetch();
  const resp = await _fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Graph error ${resp.status} for ${url}: ${text}`);
  }
  return resp.json();
}

/** Handle paging via @odata.nextLink */
async function graphGetAll(url, token) {
  const out = [];
  let next = url;

  while (next) {
    const data = await graphGet(next, token);
    out.push(...(data.value || []));
    next = data["@odata.nextLink"] || null;
  }

  return out;
}

async function resolveSite({ hostname, sitePath }, token) {
  if (!hostname || !sitePath) {
    throw new Error("Missing SP_HOSTNAME and/or SP_SITE_PATH env vars.");
  }
  const path = normalizeSitePath(sitePath);
  // Example: /sites/{hostname}:/sites/MySite
  return graphGet(`${graphBase}/sites/${hostname}:${path}`, token);
}

/** Set siteId to get a non-default document library */
async function resolveDriveId(siteId, token) {
  const explicit = process.env.SP_DRIVE_ID;
  if (explicit) return explicit;

  const drive = await graphGet(`${graphBase}/sites/${siteId}/drive`, token);
  return drive.id;
}

function identityToSimple(identitySet) {
  if (!identitySet) return null;
  const u = identitySet.user;
  const a = identitySet.application;

  if (u) {
    return {
      type: "user",
      id: u.id || null,
      displayName: u.displayName || null,
      email: u.email || null,
    };
  }
  if (a) {
    return {
      type: "application",
      id: a.id || null,
      displayName: a.displayName || null,
    };
  }
  return identitySet;
}

function mapDriveItem(x) {
  const isFolder = !!x.folder;
  const isFile = !!x.file;

  return {
    id: x.id,
    name: x.name,
    webUrl: x.webUrl,
    size: x.size ?? null,

    type: isFolder ? "folder" : isFile ? "file" : "item",

    createdDateTime: x.createdDateTime || null,
    lastModifiedDateTime: x.lastModifiedDateTime || null,

    createdBy: identityToSimple(x.createdBy),
    lastModifiedBy: identityToSimple(x.lastModifiedBy),

    file: x.file
      ? {
          mimeType: x.file.mimeType || null,
          hashes: x.file.hashes || null,
        }
      : null,
    folder: x.folder
      ? {
          childCount: x.folder.childCount ?? null,
        }
      : null,
  };
}

function buildChildrenUrl({ driveId, parentId }) {
  const select = [
    "id",
    "name",
    "webUrl",
    "size",
    "createdDateTime",
    "lastModifiedDateTime",
    "createdBy",
    "lastModifiedBy",
    "file",
    "folder",
    "parentReference",
    "thumbnails",
  ].join(",");

  const base =
    parentId && parentId !== "root"
      ? `${graphBase}/drives/${driveId}/items/${parentId}/children`
      : `${graphBase}/drives/${driveId}/root/children`;

  return `${base}?$select=${encodeURIComponent(select)}&$expand=thumbnails&$top=200`;
}

function escapeSearchQuery(s) {
  // Escape single quotes for search(q='...')
  return String(s).replace(/'/g, "''");
}

function buildSearchUrl({ driveId, parentId, q }) {
  const select = [
    "id",
    "name",
    "webUrl",
    "size",
    "createdDateTime",
    "lastModifiedDateTime",
    "createdBy",
    "lastModifiedBy",
    "file",
    "folder",
    "parentReference",
  ].join(",");

  const safeQ = encodeURIComponent(escapeSearchQuery(q));

  const base =
    parentId && parentId !== "root"
      ? `${graphBase}/drives/${driveId}/items/${parentId}/search(q='${safeQ}')`
      : `${graphBase}/drives/${driveId}/root/search(q='${safeQ}')`;

  return `${base}?$select=${encodeURIComponent(select)}&$top=200`;
}

module.exports = async function (context, req) {
  try {
    const hostname = process.env.SP_HOSTNAME;
    const sitePath = process.env.SP_SITE_PATH;

    const parentId =
      (req.query && (req.query.parentId || req.query.itemId)) ||
      (req.params && (req.params.parentId || req.params.itemId)) ||
      null;

    // ✅ DEFINE q HERE
    const q =
      (req.query && (req.query.q || req.query.search)) ||
      (req.params && (req.params.q || req.params.search)) ||
      null;

    const token = await getToken();
    const site = await resolveSite({ hostname, sitePath }, token);
    const driveId = await resolveDriveId(site.id, token);

    const url = q
      ? buildSearchUrl({ driveId, parentId, q })
      : buildChildrenUrl({ driveId, parentId });

    const items = await graphGetAll(url, token);

    context.res = {
      status: 200,
      headers: { "content-type": "application/json" },
      body: {
        site: { id: site.id, name: site.name, webUrl: site.webUrl },
        drive: { id: driveId },
        parentId: parentId || "root",
        q: q || null,
        count: items.length,
        items: items.map(mapDriveItem),
      },
    };
  } catch (e) {
    context.res = {
      status: 500,
      headers: { "content-type": "application/json" },
      body: { error: String(e && e.message ? e.message : e) },
    };
  }
};
