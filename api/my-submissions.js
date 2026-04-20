const {
  addSkinMeta,
  attachSignedPreviewUrls,
  createAdminClient,
  getUserFromRequest,
  sendJson,
} = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const auth = await getUserFromRequest(req);
  if (auth.error) {
    return sendJson(res, auth.error.status, { error: auth.error.message });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return sendJson(res, 503, { error: error.message });
  }

  const { data, error } = await admin
    .from("submissions")
    .select("id, skin_id, submitted_discord_name, storage_path, public_url, status, notes, created_at, reviewed_at")
    .eq("submitted_by", auth.user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  let rows;
  try {
    const withSkin = await addSkinMeta(admin, data || []);
    rows = await attachSignedPreviewUrls(admin, withSkin);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }

  res.setHeader("Cache-Control", "no-store");
  return sendJson(res, 200, { rows });
};
