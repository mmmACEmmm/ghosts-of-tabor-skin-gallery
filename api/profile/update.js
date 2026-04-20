const {
  getJsonBody,
  getUserFromRequest,
  sendJson,
} = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const auth = await getUserFromRequest(req);
  if (auth.error) {
    return sendJson(res, auth.error.status, { error: auth.error.message });
  }

  const body = await getJsonBody(req);
  const displayName = String(body.displayName || "").trim() || null;
  const inGameName = String(body.inGameName || "").trim() || null;
  const bio = String(body.bio || "").trim() || null;

  if (displayName && displayName.length > 40) {
    return sendJson(res, 400, { error: "Display name must stay under 40 characters." });
  }

  if (inGameName && inGameName.length > 40) {
    return sendJson(res, 400, { error: "In-game name must stay under 40 characters." });
  }

  if (bio && bio.length > 600) {
    return sendJson(res, 400, { error: "Bio must stay under 600 characters." });
  }

  const payload = {
    user_id: auth.user.id,
    display_name: displayName,
    in_game_name: inGameName,
    bio,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await auth.client
    .from("trader_profiles")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, { ok: true, row: data });
};
