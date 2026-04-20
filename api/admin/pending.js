const {
  addSkinMeta,
  attachSignedPreviewUrls,
  createAdminClient,
  getUserFromRequest,
  isAdminUser,
  sendJson,
} = require("../_lib/supabase");

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

  if (!(await isAdminUser(admin, auth.user.id))) {
    return sendJson(res, 403, { error: "You are not allowed to review submissions." });
  }

  const { data, error } = await admin
    .from("submissions")
    .select("id, skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, notes, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

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
