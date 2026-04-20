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
  const targetUserId = String(body.targetUserId || "").trim();
  const vote = Number(body.vote || 0);

  if (!targetUserId) {
    return sendJson(res, 400, { error: "Missing target user id." });
  }

  if (targetUserId === auth.user.id) {
    return sendJson(res, 400, { error: "You cannot vote on your own profile." });
  }

  if (![1, -1, 0].includes(vote)) {
    return sendJson(res, 400, { error: "Vote must be 1, -1, or 0." });
  }

  if (vote === 0) {
    const { error } = await auth.client
      .from("profile_votes")
      .delete()
      .eq("target_user_id", targetUserId)
      .eq("voter_user_id", auth.user.id);

    if (error) {
      return sendJson(res, 500, { error: error.message });
    }

    return sendJson(res, 200, { ok: true, vote: null });
  }

  const { error } = await auth.client
    .from("profile_votes")
    .upsert(
      {
        target_user_id: targetUserId,
        voter_user_id: auth.user.id,
        vote,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "target_user_id,voter_user_id",
      }
    );

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, { ok: true, vote });
};
