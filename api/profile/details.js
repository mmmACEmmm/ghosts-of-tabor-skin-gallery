const {
  attachTraderProfileMeta,
  attachPublicTradeThumbnailUrls,
  createAnonClient,
  getOptionalUserFromRequest,
  sendJson,
} = require("../_lib/supabase");

async function getOwnVote(client, viewerId, targetUserId) {
  if (!viewerId || !targetUserId || viewerId === targetUserId) {
    return null;
  }

  const { data, error } = await client
    .from("profile_votes")
    .select("vote")
    .eq("target_user_id", targetUserId)
    .eq("voter_user_id", viewerId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data?.vote || null;
}

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

  const optionalAuth = await getOptionalUserFromRequest(req);
  const queryUserId = String(req.query.userId || "").trim();
  const targetUserId = queryUserId || optionalAuth?.user?.id || "";

  if (!targetUserId) {
    return sendJson(res, 400, { error: "Missing profile user id." });
  }

  const { data: profileRow, error: profileError } = await anon
    .from("public_trader_profiles")
    .select("*")
    .eq("user_id", targetUserId)
    .maybeSingle();

  if (profileError) {
    return sendJson(res, 500, { error: profileError.message });
  }

  const { data: listingRows, error: listingError } = await anon
    .from("active_trade_listings")
    .select("*")
    .eq("created_by", targetUserId)
    .order("created_at", { ascending: false })
    .limit(8);

  if (listingError) {
    return sendJson(res, 500, { error: listingError.message });
  }

  const listings = await attachTraderProfileMeta(
    anon,
    attachPublicTradeThumbnailUrls(anon, listingRows || [])
  );
  const latestListing = listings[0] || null;

  let ownVote = null;
  let applications = [];
  let isSelf = false;

  if (optionalAuth?.user) {
    isSelf = optionalAuth.user.id === targetUserId;

    try {
      ownVote = await getOwnVote(optionalAuth.client, optionalAuth.user.id, targetUserId);
    } catch (error) {
      return sendJson(res, 500, { error: error.message });
    }

    if (isSelf) {
      const { data, error } = await optionalAuth.client
        .from("role_applications")
        .select("*")
        .eq("applicant_user_id", targetUserId)
        .order("created_at", { ascending: false });

      if (error) {
        return sendJson(res, 500, { error: error.message });
      }

      applications = data || [];
    }
  }

  return sendJson(res, 200, {
    profile: {
      user_id: targetUserId,
      display_name: profileRow?.display_name || null,
      in_game_name: profileRow?.in_game_name || null,
      bio: profileRow?.bio || null,
      is_bodyguard: Boolean(profileRow?.is_bodyguard),
      is_boa_verified: Boolean(profileRow?.is_boa_verified),
      upvotes: Number(profileRow?.upvotes || 0),
      downvotes: Number(profileRow?.downvotes || 0),
      total_votes: Number(profileRow?.total_votes || 0),
      positive_percent: Number(profileRow?.positive_percent || 0),
      fallback_name:
        latestListing?.profile_display_name ||
        latestListing?.trader_handle ||
        latestListing?.created_discord_name ||
        null,
      avatar_url: latestListing?.created_discord_avatar_url || null,
    },
    listings,
    viewer: {
      isAuthenticated: Boolean(optionalAuth?.user),
      isSelf,
      ownVote,
      userId: optionalAuth?.user?.id || null,
    },
    applications,
  });
};
