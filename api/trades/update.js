const {
  attachTraderProfileMeta,
  attachPublicTradeThumbnailUrls,
  getJsonBody,
  getUserFromRequest,
  isAdminUser,
  sendJson,
} = require("../_lib/supabase");

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

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const auth = await getUserFromRequest(req);
  if (auth.error) {
    return sendJson(res, auth.error.status, { error: auth.error.message });
  }

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
};
