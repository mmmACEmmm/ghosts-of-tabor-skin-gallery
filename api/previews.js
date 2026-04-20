const {
  createAdminClient,
  getSubmission,
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

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    return sendJson(res, 503, { error: error.message });
  }

  let submission;
  try {
    submission = await getSubmission(admin, submissionId);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }

  if (!submission || submission.status !== "approved") {
    return sendJson(res, 404, { error: "Approved preview not found." });
  }

  if (submission.public_url && !submission.public_url.startsWith("/api/previews")) {
    res.statusCode = 302;
    res.setHeader("Location", submission.public_url);
    res.end();
    return;
  }

  if (!submission.storage_path || String(submission.storage_path).startsWith("legacy:")) {
    return sendJson(res, 404, { error: "Preview file is unavailable." });
  }

  const { data, error } = await admin.storage
    .from("previews")
    .download(submission.storage_path);

  if (error || !data) {
    return sendJson(res, 404, { error: error?.message || "Preview file is unavailable." });
  }

  const arrayBuffer = await data.arrayBuffer();

  res.statusCode = 200;
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.setHeader("Content-Type", data.type || "application/octet-stream");
  res.end(Buffer.from(arrayBuffer));
};
