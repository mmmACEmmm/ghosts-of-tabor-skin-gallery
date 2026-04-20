const { createClient } = require("@supabase/supabase-js");

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function createBaseOptions(headers = {}) {
  return {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers,
    },
  };
}

function createAnonClient() {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_ANON_KEY"),
    createBaseOptions()
  );
}

function createUserClient(accessToken) {
  return createClient(
    getRequiredEnv("SUPABASE_URL"),
    getRequiredEnv("SUPABASE_ANON_KEY"),
    createBaseOptions({
      Authorization: `Bearer ${accessToken}`,
    })
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

  let client;
  try {
    client = createUserClient(token);
  } catch (error) {
    return { error: { status: 503, message: error.message } };
  }

  return {
    token,
    user: data.user,
    client,
  };
}

async function isAdminUser(client, userId) {
  const { data, error } = await client
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.user_id);
}

async function getSkinsById(client, skinIds) {
  if (!skinIds.length) {
    return new Map();
  }

  const { data, error } = await client
    .from("skins")
    .select("id, slug, name")
    .in("id", skinIds);

  if (error) {
    throw error;
  }

  return new Map((data || []).map((row) => [row.id, row]));
}

async function addSkinMeta(client, submissions) {
  const skinIds = Array.from(new Set((submissions || []).map((row) => row.skin_id).filter(Boolean)));
  const skinsById = await getSkinsById(client, skinIds);

  return (submissions || []).map((row) => ({
    ...row,
    skin: skinsById.get(row.skin_id) || null,
  }));
}

function getPublicPreviewUrl(client, storagePath) {
  return getPublicStorageUrl(client, storagePath, "previews");
}

function getPublicStorageUrl(client, storagePath, bucket = "previews") {
  if (!storagePath || String(storagePath).startsWith("legacy:")) {
    return null;
  }

  const { data } = client.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return data?.publicUrl || null;
}

function attachPublicPreviewUrls(client, submissions) {
  return (submissions || []).map((row) => ({
    ...row,
    preview_url: row.public_url || getPublicPreviewUrl(client, row.storage_path),
  }));
}

function attachPublicTradeThumbnailUrls(client, listings) {
  return (listings || []).map((row) => ({
    ...row,
    thumbnail_url: row.thumbnail_url || getPublicStorageUrl(client, row.thumbnail_path, "previews"),
  }));
}

async function getSubmission(client, submissionId) {
  const { data, error } = await client
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
  attachPublicTradeThumbnailUrls,
  attachPublicPreviewUrls,
  createAnonClient,
  createUserClient,
  getJsonBody,
  getPublicPreviewUrl,
  getPublicStorageUrl,
  getRequiredEnv,
  getSubmission,
  getUserFromRequest,
  isAdminUser,
  sendJson,
};
