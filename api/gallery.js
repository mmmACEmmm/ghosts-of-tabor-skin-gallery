const {
  createAdminClient,
  sendJson,
} = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return sendJson(res, 200, {
      configured: false,
      rows: null,
      message: error.message,
    });
  }

  const { data, error } = await admin
    .from("approved_previews")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  const rows = (data || []).map((row) => ({
    ...row,
    public_url: row.public_url || `/api/previews?submissionId=${encodeURIComponent(row.id)}`,
  }));

  res.setHeader("Cache-Control", "no-store");
  return sendJson(res, 200, {
    configured: true,
    rows,
  });
};
