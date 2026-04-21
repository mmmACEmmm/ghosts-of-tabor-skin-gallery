const {
  addSkinMeta,
  attachPublicPreviewUrls,
  getJsonBody,
  getPublicPreviewUrl,
  getSubmission,
  getUserFromRequest,
  isAdminUser,
  sendJson,
} = require("./_lib/supabase");

function getRequestView(req) {
  return String(req.query.view || req.query.action || "").trim().toLowerCase();
}

async function requireAdmin(req, res) {
  const auth = await getUserFromRequest(req);
  if (auth.error) {
    sendJson(res, auth.error.status, { error: auth.error.message });
    return null;
  }

  const allowed = await isAdminUser(auth.client, auth.user.id).catch((error) => {
    throw error;
  });

  if (!allowed) {
    sendJson(res, 403, { error: "You are not allowed to review admin queues." });
    return null;
  }

  return auth;
}

async function handlePending(auth, res) {
  const { data, error } = await auth.client
    .from("submissions")
    .select("id, skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, notes, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  try {
    const withSkin = await addSkinMeta(auth.client, data || []);
    const rows = attachPublicPreviewUrls(auth.client, withSkin);
    res.setHeader("Cache-Control", "no-store");
    return sendJson(res, 200, { rows });
  } catch (readError) {
    return sendJson(res, 500, { error: readError.message });
  }
}

async function handleApplications(auth, res) {
  const { data, error } = await auth.client
    .from("role_applications")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  const applicantIds = Array.from(new Set((data || []).map((row) => row.applicant_user_id).filter(Boolean)));
  if (!applicantIds.length) {
    return sendJson(res, 200, { rows: [] });
  }

  const { data: profiles, error: profileError } = await auth.client
    .from("public_trader_profiles")
    .select("*")
    .in("user_id", applicantIds);

  if (profileError) {
    return sendJson(res, 500, { error: profileError.message });
  }

  const profileById = new Map((profiles || []).map((row) => [row.user_id, row]));
  const rows = (data || []).map((row) => ({
    ...row,
    profile: profileById.get(row.applicant_user_id) || null,
  }));

  return sendJson(res, 200, { rows });
}

async function handleSubmissionReview(auth, req, res) {
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
    update.public_url = submission.public_url || getPublicPreviewUrl(auth.client, submission.storage_path);
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
}

function getRoleColumn(applicationType) {
  if (applicationType === "bodyguard") {
    return "is_bodyguard";
  }

  if (applicationType === "boa") {
    return "is_boa_verified";
  }

  return "";
}

async function handleApplicationReview(auth, req, res) {
  const body = await getJsonBody(req);
  const applicationId = String(body.applicationId || "").trim();
  const action = String(body.action || "").trim().toLowerCase();
  const reviewNotes = String(body.reviewNotes || "").trim() || null;

  if (!applicationId || !["approved", "rejected"].includes(action)) {
    return sendJson(res, 400, { error: "Bad request." });
  }

  const { data: application, error: fetchError } = await auth.client
    .from("role_applications")
    .select("*")
    .eq("id", applicationId)
    .maybeSingle();

  if (fetchError) {
    return sendJson(res, 500, { error: fetchError.message });
  }

  if (!application) {
    return sendJson(res, 404, { error: "Application not found." });
  }

  const { error: updateError } = await auth.client
    .from("role_applications")
    .update({
      status: action,
      review_notes: reviewNotes,
      reviewed_at: new Date().toISOString(),
      reviewed_by: auth.user.id,
    })
    .eq("id", applicationId);

  if (updateError) {
    return sendJson(res, 500, { error: updateError.message });
  }

  if (action === "approved") {
    const roleColumn = getRoleColumn(application.application_type);
    if (!roleColumn) {
      return sendJson(res, 400, { error: "Unsupported application type." });
    }

    const { error: profileError } = await auth.client
      .from("trader_profiles")
      .upsert(
        {
          user_id: application.applicant_user_id,
          [roleColumn]: true,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (profileError) {
      return sendJson(res, 500, { error: profileError.message });
    }
  }

  return sendJson(res, 200, { ok: true });
}

module.exports = async function handler(req, res) {
  const view = getRequestView(req);

  let auth;
  try {
    auth = await requireAdmin(req, res);
  } catch (error) {
    return sendJson(res, 500, { error: error.message });
  }

  if (!auth) {
    return;
  }

  if (req.method === "GET") {
    if (view === "pending") {
      return handlePending(auth, res);
    }

    if (view === "applications") {
      return handleApplications(auth, res);
    }

    return sendJson(res, 400, { error: "Unknown admin view." });
  }

  if (req.method === "POST") {
    if (view === "review") {
      return handleSubmissionReview(auth, req, res);
    }

    if (view === "application-review") {
      return handleApplicationReview(auth, req, res);
    }

    return sendJson(res, 400, { error: "Unknown admin action." });
  }

  return sendJson(res, 405, { error: "Method not allowed." });
};
