const {
  getUserFromRequest,
  isAdminUser,
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

  const isAdmin = await isAdminUser(auth.client, auth.user.id).catch(() => false);
  if (!isAdmin) {
    return sendJson(res, 403, { error: "Forbidden." });
  }

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
};
