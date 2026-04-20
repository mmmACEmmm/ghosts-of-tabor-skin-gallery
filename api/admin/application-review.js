const {
  getJsonBody,
  getUserFromRequest,
  isAdminUser,
  sendJson,
} = require("../_lib/supabase");

function getRoleColumn(applicationType) {
  if (applicationType === "bodyguard") {
    return "is_bodyguard";
  }

  if (applicationType === "boa") {
    return "is_boa_verified";
  }

  return "";
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const auth = await getUserFromRequest(req);
  if (auth.error) {
    return sendJson(res, auth.error.status, { error: auth.error.message });
  }

  const isAdmin = await isAdminUser(auth.client, auth.user.id).catch(() => false);
  if (!isAdmin) {
    return sendJson(res, 403, { error: "Forbidden." });
  }

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
};
