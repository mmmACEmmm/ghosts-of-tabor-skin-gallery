const { createClient } = require("@supabase/supabase-js");

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createBaseOptions() {
  return {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  };
}

function createAdminClient() {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
    createBaseOptions()
  );
}

function createAnonClient() {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_ANON_KEY"),
    createBaseOptions()
  );
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }

  return header.slice(7).trim();
}

async function getUserFromRequest(req) {
  const token = getBearerToken(req);
  if (!token) {
    return { error: { status: 401, message: "Missing bearer token." } };
  }

  let anon;
  try {
    anon = createAnonClient();
  } catch (error) {
    return { error: { status: 503, message: error.message } };
  }

  const { data, error } = await anon.auth.getUser(token);

  if (error || !data?.user) {
    return { error: { status: 401, message: "Your session is no longer valid." } };
  }

  return { token, user: data.user };
}

async function isAdminUser(adminClient, userId) {
  const { data, error } = await adminClient
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.user_id);
}

async function getSkinsById(adminClient, skinIds) {
  if (!skinIds.length) {
    return new Map();
  }

  const { data, error } = await adminClient
    .from("skins")
    .select("id, slug, name")
    .in("id", skinIds);

  if (error) {
    throw error;
  }

  return new Map((data || []).map((row) => [row.id, row]));
}

async function addSkinMeta(adminClient, submissions) {
  const skinIds = Array.from(new Set((submissions || []).map((row) => row.skin_id).filter(Boolean)));
  const skinsById = await getSkinsById(adminClient, skinIds);

  return (submissions || []).map((row) => ({
    ...row,
    skin: skinsById.get(row.skin_id) || null,
  }));
}

async function createSignedPreviewUrl(adminClient, storagePath) {
  if (!storagePath || String(storagePath).startsWith("legacy:")) {
    return null;
  }

  const { data, error } = await adminClient.storage
    .from("previews")
    .createSignedUrl(storagePath, 60 * 60);

  if (error) {
    throw error;
  }

  return data?.signedUrl || null;
}

async function attachSignedPreviewUrls(adminClient, submissions) {
  return Promise.all(
    (submissions || []).map(async (row) => ({
      ...row,
      preview_url:
        (row.status === "approved" && row.public_url) ||
        row.public_url ||
        (await createSignedPreviewUrl(adminClient, row.storage_path)),
    }))
  );
}

async function getSubmission(adminClient, submissionId) {
  const { data, error } = await adminClient
    .from("submissions")
    .select("*")
    .eq("id", submissionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}

async function getJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  if (typeof req.body === "string" && req.body.trim()) {
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  return rawBody ? JSON.parse(rawBody) : {};
}

module.exports = {
  addSkinMeta,
  attachSignedPreviewUrls,
  createAdminClient,
  createAnonClient,
  getJsonBody,
  getRequiredEnv,
  getSubmission,
  getUserFromRequest,
  isAdminUser,
  sendJson,
};
