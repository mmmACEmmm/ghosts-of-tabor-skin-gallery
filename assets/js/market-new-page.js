import { initAppShell } from "/assets/js/app-shell.js?v=20260420d";
import {
  getCurrentUser,
  getSupabaseClient,
  isSupabaseConfigured,
  loginWithDiscord,
  onAuthStateChange,
} from "/assets/js/supabase-browser.js";
import {
  CURRENCY_OPTIONS,
  ITEM_TYPES_CREATE,
  SERVER_TYPES_CREATE,
  TRADE_TYPES_CREATE,
} from "/assets/js/trade-utils.js?v=20260420d";

function byId(id) {
  return document.getElementById(id);
}

function setMessage(message, tone = "") {
  const status = byId("marketCreateStatus");
  status.hidden = !message;
  status.className = `inline-message${tone ? ` ${tone}` : ""}`;
  status.textContent = message || "";
}

function setAuthGate(hidden) {
  byId("marketAuthGate").hidden = hidden;
  byId("marketCreateShell").hidden = !hidden;
}

function sanitizeFilenamePart(value) {
  return String(value || "trade")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "trade";
}

function getDiscordName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.user_metadata?.preferred_username ||
    user?.email ||
    "Discord user"
  );
}

function getDiscordAvatar(user) {
  return (
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.profile_image ||
    user?.identities?.[0]?.identity_data?.avatar_url ||
    ""
  );
}

function fillSelect(selectId, options) {
  const node = byId(selectId);
  node.innerHTML = options
    .map((option) => `<option value="${option.value}">${option.label}</option>`)
    .join("");
}

function activateSegment(groupId, value) {
  const group = byId(groupId);
  if (!group) {
    return;
  }

  const targetInput = byId(group.dataset.target);
  targetInput.value = value;

  group.querySelectorAll("[data-value]").forEach((button) => {
    button.classList.toggle("active", button.dataset.value === value);
  });
}

function wireSegment(groupId) {
  const group = byId(groupId);
  if (!group) {
    return;
  }

  group.addEventListener("click", function (event) {
    const button = event.target.closest("[data-value]");
    if (!button) {
      return;
    }

    activateSegment(groupId, button.dataset.value || "");
  });

  const firstValue = group.querySelector("[data-value]")?.dataset.value || "";
  activateSegment(groupId, firstValue);
}

async function uploadTradeThumbnail(file, user, itemName) {
  const supabase = getSupabaseClient();
  if (!supabase || !file) {
    return null;
  }

  const ext = String(file.name.split(".").pop() || "").toLowerCase();
  const safeExt = ["png", "jpg", "jpeg", "webp"].includes(ext) ? ext : "png";
  const path = `trades/${user.id}/${Date.now()}-${sanitizeFilenamePart(itemName || file.name)}.${safeExt}`;

  const { error } = await supabase.storage
    .from("previews")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type || "image/png",
    });

  if (error) {
    throw error;
  }

  return path;
}

async function createListing(user) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured yet.");
  }

  const itemName = byId("itemName").value.trim();
  const traderHandle = byId("traderHandle").value.trim();
  const askingPrice = byId("askingPrice").value.trim();
  const quantity = Number(byId("tradeQuantity").value || 0);
  const description = byId("tradeDescription").value.trim();
  const itemType = byId("itemType").value;
  const currency = byId("tradeCurrency").value;
  const listingType = byId("tradeTypeValue").value;
  const serverType = byId("serverTypeValue").value;
  const thumbnailFile = byId("tradeThumbnail").files?.[0] || null;
  const rmtConfirmed = byId("rmtConfirm").checked;

  if (!itemName) {
    throw new Error("Add an item name first.");
  }

  if (!quantity || quantity < 1) {
    throw new Error("Stock must be at least 1.");
  }

  if (!rmtConfirmed) {
    throw new Error("You need to confirm the in-game-only trade policy.");
  }

  if (thumbnailFile && thumbnailFile.size > 2 * 1024 * 1024) {
    throw new Error("Trade thumbnails must stay under 2MB.");
  }

  const thumbnailPath = await uploadTradeThumbnail(thumbnailFile, user, itemName);

  const { error } = await supabase
    .from("trade_listings")
    .insert({
      created_by: user.id,
      created_discord_name: getDiscordName(user),
      created_discord_avatar_url: getDiscordAvatar(user),
      trader_handle: traderHandle || null,
      listing_type: listingType,
      item_name: itemName,
      item_type: itemType,
      server_type: serverType,
      currency,
      quantity,
      asking_price: askingPrice || null,
      description: description || null,
      thumbnail_path: thumbnailPath,
      status: "active",
      rmt_confirmed: true,
      updated_at: new Date().toISOString(),
    });

  if (error) {
    if (thumbnailPath) {
      await supabase.storage.from("previews").remove([thumbnailPath]).catch(() => null);
    }

    throw error;
  }
}

async function init() {
  const shellState = await initAppShell();
  const loginButton = byId("marketLoginButton");
  const form = byId("marketCreateForm");

  fillSelect("tradeCurrency", CURRENCY_OPTIONS);
  fillSelect("itemType", ITEM_TYPES_CREATE);
  wireSegment("tradeTypeButtons");
  wireSegment("serverTypeButtons");

  loginButton.addEventListener("click", async function () {
    try {
      await loginWithDiscord("/market/new");
    } catch (error) {
      setMessage(error.message, "error");
    }
  });

  if (!isSupabaseConfigured()) {
    setAuthGate(false);
    setMessage("Supabase is not configured yet. Finish the setup before creating listings.", "warning");
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
    setMessage("Sign in with Discord to post a public trade listing.", "warning");
    return;
  }

  setAuthGate(true);
  byId("traderIdentity").textContent = getDiscordName(user);

  form.addEventListener("submit", async function (event) {
    event.preventDefault();

    const submitButton = byId("postTradeButton");
    submitButton.disabled = true;
    setMessage("Posting your trade listing...");

    try {
      await createListing(user);
      form.reset();
      activateSegment("tradeTypeButtons", TRADE_TYPES_CREATE[0].value);
      activateSegment("serverTypeButtons", SERVER_TYPES_CREATE[0].value);
      setMessage("Your trade listing is live in the market.", "success");
    } catch (error) {
      setMessage(error.message, "error");
    } finally {
      submitButton.disabled = false;
    }
  });
}

init();
