const {
  attachPublicTradeThumbnailUrls,
  attachTraderProfileMeta,
  createAnonClient,
  getJsonBody,
  getOptionalUserFromRequest,
  getUserFromRequest,
  sendJson,
} = require("./_lib/supabase");

function getRequestView(req) {
  return String(req.query.view || req.query.action || "").trim().toLowerCase();
}

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

async function handleDetails(req, res) {
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
}

async function requireAuth(req, res) {
  const auth = await getUserFromRequest(req);
  if (auth.error) {
    sendJson(res, auth.error.status, { error: auth.error.message });
    return null;
  }

  return auth;
}

async function handleUpdate(auth, req, res) {
  const body = await getJsonBody(req);
  const displayName = String(body.displayName || "").trim() || null;
  const inGameName = String(body.inGameName || "").trim() || null;
  const bio = String(body.bio || "").trim() || null;

  if (displayName && displayName.length > 40) {
    return sendJson(res, 400, { error: "Display name must stay under 40 characters." });
  }

  if (inGameName && inGameName.length > 40) {
    return sendJson(res, 400, { error: "In-game name must stay under 40 characters." });
  }

  if (bio && bio.length > 600) {
    return sendJson(res, 400, { error: "Bio must stay under 600 characters." });
  }

  const payload = {
    user_id: auth.user.id,
    display_name: displayName,
    in_game_name: inGameName,
    bio,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await auth.client
    .from("trader_profiles")
    .upsert(payload, {
      onConflict: "user_id",
    })
    .select("*")
    .single();

  if (error) {
    return sendJson(res, 500, { error: error.message });
  }

  return sendJson(res, 200, { ok: true, row: data });
}

async function handleVote(auth, req, res) {
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
}

async function handleApply(auth, req, res) {
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
}

module.exports = async function handler(req, res) {
  const view = getRequestView(req);

  if (req.method === "GET") {
    if (view === "details") {
      return handleDetails(req, res);
    }

    return sendJson(res, 400, { error: "Unknown profile view." });
  }

  if (req.method === "POST") {
    const auth = await requireAuth(req, res);
    if (!auth) {
      return;
    }

    if (view === "update") {
      return handleUpdate(auth, req, res);
    }

    if (view === "vote") {
      return handleVote(auth, req, res);
    }

    if (view === "apply") {
      return handleApply(auth, req, res);
    }

    return sendJson(res, 400, { error: "Unknown profile action." });
  }

  return sendJson(res, 405, { error: "Method not allowed." });
};
