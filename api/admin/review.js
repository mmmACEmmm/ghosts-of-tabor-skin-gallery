const {
  getJsonBody,
  getPublicPreviewUrl,
  getSubmission,
  getUserFromRequest,
  isAdminUser,
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

  let admin;
  try {
    admin = await isAdminUser(auth.client, auth.user.id);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }

  if (!admin) {
    return sendJson(res, 403, { error: "You are not allowed to review submissions." });
  }

  let body;
  try {
    body = await getJsonBody(req);
  } catch (_error) {
    return sendJson(res, 400, { error: "Request body must be valid JSON." });
  }

  const { submissionId, action, notes } = body || {};
  if (!submissionId || !["approved", "rejected"].includes(action)) {
    return sendJson(res, 400, { error: "submissionId and a valid action are required." });
  }

  let submission;
  try {
    submission = await getSubmission(auth.client, submissionId);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }

  if (!submission) {
    return sendJson(res, 404, { error: "Submission not found." });
  }

  const update = {
    status: action,
    notes: typeof notes === "string" ? notes.trim() || null : submission.notes,
    reviewed_at: new Date().toISOString(),
    reviewed_by: auth.user.id,
  };

  if (action === "approved") {
    update.public_url =
      submission.public_url ||
      getPublicPreviewUrl(auth.client, submission.storage_path);
  } else {
    update.public_url = null;
  }

  const { error } = await auth.client
    .from("submissions")
    .update(update)
    .eq("id", submissionId);

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  res.setHeader("Cache-Control", "no-store");
  return sendJson(res, 200, {
    ok: true,
    submissionId,
    status: action,
  });
};
