const {
  attachPublicTradeThumbnailUrls,
  createAnonClient,
  sendJson,
} = require("../_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

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
  return sendJson(res, 200, {
    configured: true,
    rows: attachPublicTradeThumbnailUrls(anon, data || []),
  });
};
