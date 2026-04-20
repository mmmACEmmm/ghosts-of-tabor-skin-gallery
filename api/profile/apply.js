const {
  getJsonBody,
  getUserFromRequest,
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

  const body = await getJsonBody(req);
  const applicationType = String(body.applicationType || "").trim().toLowerCase();
  const message = String(body.message || "").trim();

  if (!["bodyguard", "boa"].includes(applicationType)) {
    return sendJson(res, 400, { error: "Unsupported application type." });
  }

  if (!message) {
    return sendJson(res, 400, { error: "Write a short application message first." });
  }

  if (message.length > 1200) {
    return sendJson(res, 400, { error: "Application message must stay under 1200 characters." });
  }

  const { data, error } = await auth.client
    .from("role_applications")
    .insert({
      applicant_user_id: auth.user.id,
      application_type: applicationType,
      message,
    })
    .select("*")
    .single();

  if (error) {
    if (String(error.message || "").toLowerCase().includes("role_applications_one_pending_idx")) {
      return sendJson(res, 400, { error: "You already have a pending application for that role." });
    }

    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, { ok: true, row: data });
};
