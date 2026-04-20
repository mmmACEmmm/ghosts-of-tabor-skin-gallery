import { fetchJson } from "/assets/js/api-client.js";
import { initAppShell } from "/assets/js/app-shell.js?v=20260419c";
import { loadStaticSkinData } from "/assets/js/skin-data.js";
import {
  getCurrentUser,
  getSupabaseClient,
  isSupabaseConfigured,
  loginWithDiscord,
  onAuthStateChange,
} from "/assets/js/supabase-browser.js";

function byId(id) {
  return document.getElementById(id);
}

function setMessage(message, tone = "") {
  const status = byId("submitStatus");
  status.hidden = !message;
  status.className = `inline-message${tone ? ` ${tone}` : ""}`;
  status.textContent = message || "";
}

function setAuthGate(hidden) {
  byId("submitAuthGate").hidden = hidden;
  byId("submitFormShell").hidden = !hidden;
}

function sanitizeFilenamePart(value) {
  return String(value || "preview")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "preview";
}

async function submitPreview(file, skinId, skinSlug) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured yet.");
  }

  const user = await getCurrentUser();
  if (!user) {
    throw new Error("You need to log in first.");
  }

  const ext = String(file.name.split(".").pop() || "").toLowerCase();
  const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "png";
  const fileStub = sanitizeFilenamePart(file.name.replace(/\.[^.]+$/, "")) || sanitizeFilenamePart(skinSlug);
  const path = `pending/${user.id}/${Date.now()}-${fileStub}.${safeExt}`;

  const { error: uploadError } = await supabase.storage
    .from("previews")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/png",
    });

  if (uploadError) {
    throw uploadError;
  }

  const discordName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.preferred_username ||
    user.email ||
    "Unknown";

  const { error: insertError } = await supabase
    .from("submissions")
    .insert({
      skin_id: skinId,
      submitted_by: user.id,
      submitted_discord_name: discordName,
      storage_path: path,
      status: "pending",
    });

  if (insertError) {
    await supabase.storage.from("previews").remove([path]).catch(() => null);
    throw insertError;
  }
}

function buildSkinOptions(staticSkins, skinRows) {
  const metadataBySlug = new Map((staticSkins || []).map((row) => [row.slug, row]));

  return (skinRows || []).map((row) => {
    const meta = metadataBySlug.get(row.slug);
    return {
      ...row,
      label: meta?.sourceLabel ? `${row.name} (${meta.sourceLabel})` : row.name,
    };
  });
}

async function init() {
  const shellState = await initAppShell();

  const loginButton = byId("submitLoginButton");
  const form = byId("submitForm");
  const select = byId("skinSelect");
  const fileInput = byId("previewFile");
  const currentUserLabel = byId("currentUserLabel");

  loginButton.addEventListener("click", async function () {
    try {
      await loginWithDiscord("/submit");
    } catch (error) {
      setMessage(error.message, "error");
    }
  });

  if (!isSupabaseConfigured()) {
    setAuthGate(false);
    setMessage("Supabase is not configured yet. Finish the Vercel and Supabase setup first.", "warning");
    return;
  }

  const user = shellState.user || (await getCurrentUser().catch(() => null));
  if (!user) {
    onAuthStateChange(function (_event, session) {
      if (session?.user) {
        window.location.reload();
      }
    });

    setAuthGate(false);
    setMessage("Sign in with Discord to upload a preview image.", "warning");
    return;
  }

  setAuthGate(true);
  currentUserLabel.textContent =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.user_metadata?.preferred_username ||
    user.email ||
    "Discord user";

  const [staticSkins, skinResponse] = await Promise.all([
    loadStaticSkinData(),
    fetchJson("/api/skins"),
  ]);

  const options = buildSkinOptions(staticSkins, skinResponse.rows || []);
  if (!options.length) {
    setMessage("The Supabase skins table is empty. Import the generated skins seed first.", "warning");
    form.hidden = true;
    return;
  }

  select.innerHTML = [
    '<option value="">Choose a skin pack</option>',
    ...options.map((row) => `<option value="${row.id}" data-slug="${row.slug}">${row.label}</option>`),
  ].join("");

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const selectedOption = select.selectedOptions[0];
    const skinId = Number(select.value);
    const skinSlug = selectedOption?.dataset.slug || "";
    const file = fileInput.files?.[0];

    if (!skinId) {
      setMessage("Choose a skin before submitting.", "error");
      return;
    }

    if (!file) {
      setMessage("Choose an image file first.", "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Only image uploads are allowed.", "error");
      return;
    }

    const submitButton = byId("submitButton");
    submitButton.disabled = true;
    setMessage("Uploading your preview and saving the submission...");

    try {
      await submitPreview(file, skinId, skinSlug);
      form.reset();
      setMessage("Your preview is submitted and waiting for moderation.", "success");
    } catch (error) {
      setMessage(error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

init();
