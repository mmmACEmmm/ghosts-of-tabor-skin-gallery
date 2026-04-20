const {
  attachPublicTradeThumbnailUrls,
  getUserFromRequest,
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

  const { client, user } = auth;
  const { data, error } = await client
    .from("trade_listings")
    .select("*")
    .eq("created_by", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, {
    rows: attachPublicTradeThumbnailUrls(client, data || []),
  });
};
