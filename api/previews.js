const {
  createAnonClient,
  getPublicPreviewUrl,
  sendJson,
} = require("./_lib/supabase");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const submissionId = req.query.submissionId;
  if (!submissionId) {
    return sendJson(res, 400, { error: "submissionId is required." });
  }

  let anon;
  try {
    anon = createAnonClient();
  } catch (error) {
    return sendJson(res, 503, { error: error.message });
  }

  const { data, error } = await anon
    .from("approved_previews")
    .select("id, storage_path, public_url")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  if (!data) {
    return sendJson(res, 404, { error: "Approved preview not found." });
  }

  const publicUrl = data.public_url || getPublicPreviewUrl(anon, data.storage_path);
  if (!publicUrl) {
    return sendJson(res, 404, { error: "Preview file is unavailable." });
  }

  res.statusCode = 302;
  res.setHeader("Location", publicUrl);
  res.end();
};
