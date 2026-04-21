const {
  attachTraderProfileMeta,
  attachPublicTradeThumbnailUrls,
  createAnonClient,
  getJsonBody,
  getUserFromRequest,
  isAdminUser,
  sendJson,
} = require("./_lib/supabase");

function getRequestView(req) {
  return String(req.query.view || req.query.action || "").trim().toLowerCase();
}

async function handleListings(res) {
  let anon;
  try {
    anon = createAnonClient();
  } catch (error) {
    return sendJson(res, 200, {
      configured: false,
      rows: [],
      message: error.message,
    });
  }

  const { data, error } = await anon
    .from("active_trade_listings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  res.setHeader("Cache-Control", "no-store");
  const withProfiles = await attachTraderProfileMeta(anon, data || []);
  return sendJson(res, 200, {
    configured: true,
    rows: attachPublicTradeThumbnailUrls(anon, withProfiles),
  });
}

async function requireAuth(req, res) {
  const auth = await getUserFromRequest(req);
  if (auth.error) {
    sendJson(res, auth.error.status, { error: auth.error.message });
    return null;
  }

  return auth;
}

async function handleMyListings(auth, res) {
  const { client, user } = auth;
  const { data, error } = await client
    .from("trade_listings")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  const withProfiles = await attachTraderProfileMeta(client, data || []);
  return sendJson(res, 200, {
    rows: attachPublicTradeThumbnailUrls(client, withProfiles),
  });
}

function getUpdateForAction(action) {
  const now = new Date().toISOString();

  if (action === "archive") {
    return {
      status: "archived",
      updated_at: now,
      archived_at: now,
    };
  }

  if (action === "activate") {
    return {
      status: "active",
      updated_at: now,
      archived_at: null,
    };
  }

  if (action === "close") {
    return {
      status: "closed",
      updated_at: now,
    };
  }

  return null;
}

async function handleUpdate(auth, req, res) {
  const { client, user } = auth;
  const body = await getJsonBody(req);
  const listingId = String(body.listingId || "").trim();
  const action = String(body.action || "").trim().toLowerCase();

  if (!listingId || !action) {
    return sendJson(res, 400, { error: "Missing listing id or action." });
  }

  const update = getUpdateForAction(action);
  if (!update) {
    return sendJson(res, 400, { error: "Unsupported update action." });
  }

  const { data: existing, error: fetchError } = await client
    .from("trade_listings")
    .select("*")
    .eq("id", listingId)
    .maybeSingle();

  if (fetchError) {
    return sendJson(res, 500, { error: fetchError.message });
  }

  if (!existing) {
    return sendJson(res, 404, { error: "Trade listing not found." });
  }

  const isOwner = existing.created_by === user.id;
  const isAdmin = await isAdminUser(client, user.id).catch(() => false);

  if (!isOwner && !isAdmin) {
    return sendJson(res, 403, { error: "You do not have permission to change this listing." });
  }

  const { data, error } = await client
    .from("trade_listings")
    .update(update)
    .eq("id", listingId)
    .select("*")
    .single();

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  const [row] = attachPublicTradeThumbnailUrls(client, await attachTraderProfileMeta(client, [data]));
  return sendJson(res, 200, { ok: true, row });
}

module.exports = async function handler(req, res) {
  const view = getRequestView(req);

  if (req.method === "GET") {
    if (view === "listings") {
      return handleListings(res);
    }

    const auth = await requireAuth(req, res);
    if (!auth) {
      return;
    }

    if (view === "my-listings") {
      return handleMyListings(auth, res);
    }

    return sendJson(res, 400, { error: "Unknown trade view." });
  }

  if (req.method === "POST") {
    const auth = await requireAuth(req, res);
    if (!auth) {
      return;
    }

    if (view === "update") {
      return handleUpdate(auth, req, res);
    }

    return sendJson(res, 400, { error: "Unknown trade action." });
  }

  return sendJson(res, 405, { error: "Method not allowed." });
};
