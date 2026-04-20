const {
  createAnonClient,
  sendJson,
} = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  let anon;
  try {
    anon = createAnonClient();
  } catch (error) {
    return sendJson(res, 503, { error: error.message });
  }

  const { data, error } = await anon
    .from("skins")
    .select("id, slug, name")
    .order("name", { ascending: true });

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  res.setHeader("Cache-Control", "no-store");
  return sendJson(res, 200, {
    rows: data || [],
  });
};
