import { encodeAssetPath, escapeHtml } from "/assets/js/skin-data.js?v=20260419d";

export const ORB_DISCORD_INVITE = "https://discord.gg/3JmVxsZFpp";

export const TRADE_TYPES = [
  { value: "all", label: "All Trades" },
  { value: "selling", label: "Selling" },
  { value: "buying", label: "Buying" },
  { value: "trading", label: "Trading" },
];

export const TRADE_TYPES_CREATE = TRADE_TYPES.filter((entry) => entry.value !== "all");

export const SERVER_TYPES = [
  { value: "all", label: "All Servers" },
  { value: "pvp", label: "PvP" },
  { value: "pve", label: "PvE" },
  { value: "any", label: "Any" },
];

export const SERVER_TYPES_CREATE = SERVER_TYPES.filter((entry) => entry.value !== "all");

export const ITEM_TYPES = [
  { value: "all", label: "All Item Types" },
  { value: "weapon", label: "Weapon" },
  { value: "gear", label: "Gear" },
  { value: "armor", label: "Armor" },
  { value: "container", label: "Container" },
  { value: "ammo", label: "Ammo" },
  { value: "medical", label: "Medical" },
  { value: "collectible", label: "Collectible" },
  { value: "other", label: "Other" },
];

export const ITEM_TYPES_CREATE = ITEM_TYPES.filter((entry) => entry.value !== "all");

export const CURRENCY_OPTIONS = [
  { value: "korunas", label: "Korunas" },
  { value: "item-trade", label: "Item Trade" },
  { value: "mixed-offer", label: "Mixed Offer" },
];

function labelFor(collection, value, fallback = "Unknown") {
  return collection.find((entry) => entry.value === value)?.label || fallback;
}

function getInitials(value) {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function getProfileHref(userId) {
  const normalizedId = String(userId || "").trim();
  return normalizedId ? `/profile?user=${encodeURIComponent(normalizedId)}` : "/profile";
}

export function getTradeDisplayName(row) {
  return row?.profile_display_name || row?.trader_handle || row?.created_discord_name || "Operator";
}

function getTradeReputation(row) {
  const totalVotes = Number(row?.profile_total_votes || 0);
  const positivePercent = Number(row?.profile_positive_percent || 0);

  if (!totalVotes) {
    return "";
  }

  return `${positivePercent}% positive`;
}

function renderTraderSignals(row) {
  const signals = [];

  if (row?.profile_in_game_name) {
    signals.push(`<span class="meta-pill meta-pill-subtle">IGN: ${escapeHtml(row.profile_in_game_name)}</span>`);
  }

  if (row?.is_bodyguard) {
    signals.push('<span class="meta-pill meta-pill-bodyguard">Bodyguard</span>');
  }

  if (row?.is_boa_verified) {
    signals.push('<span class="meta-pill meta-pill-boa">BOA Verified</span>');
  }

  const reputation = getTradeReputation(row);
  if (reputation) {
    signals.push(`<span class="meta-pill meta-pill-reputation">${escapeHtml(reputation)}</span>`);
  }

  return signals.length ? `<div class="trade-user-signals">${signals.join("")}</div>` : "";
}

export function formatTradeDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function filterTradeListings(rows, filters) {
  const search = String(filters.search || "").trim().toLowerCase();

  return (rows || []).filter((row) => {
    const matchesType = !filters.type || filters.type === "all" || row.listing_type === filters.type;
    const matchesServer = !filters.server || filters.server === "all" || row.server_type === filters.server;
    const matchesItemType =
      !filters.itemType || filters.itemType === "all" || row.item_type === filters.itemType;
    const haystack = [
      row.item_name,
      row.description,
      row.asking_price,
      row.created_discord_name,
      row.trader_handle,
      row.profile_display_name,
      row.profile_in_game_name,
      row.profile_bio,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !search || haystack.includes(search);

    return matchesType && matchesServer && matchesItemType && matchesSearch;
  });
}

export function renderTradeCard(row, options = {}) {
  const {
    showStatus = false,
    footerHtml = "",
    actionHref = ORB_DISCORD_INVITE,
    actionLabel = "Trade in ORB Discord",
    actionTargetBlank = true,
  } = options;

  const displayName = getTradeDisplayName(row);
  const avatarUrl = row.created_discord_avatar_url || "";
  const profileHref = getProfileHref(row?.created_by);
  const statusHtml = showStatus
    ? `<span class="trade-pill trade-status-${escapeHtml(row.status || "active")}">${escapeHtml(
        String(row.status || "active")
      )}</span>`
    : "";
  const thumbnailHtml = row.thumbnail_url
    ? `<img src="${encodeAssetPath(row.thumbnail_url)}" alt="${escapeHtml(row.item_name || "Trade thumbnail")}">`
    : `<div class="trade-thumbnail-placeholder">${escapeHtml(getInitials(row.item_name || displayName))}</div>`;
  const primaryAction = actionHref
    ? `<a class="action-link action-link-secondary trade-action-link" href="${escapeHtml(
        actionHref
      )}"${actionTargetBlank ? ' target="_blank" rel="noreferrer"' : ""}>${escapeHtml(actionLabel)}</a>`
    : "";
  const quantityLabel = row.quantity === 1 ? "1 item" : `${row.quantity || 0} items`;

  return `
    <article class="trade-card panel-card" data-listing-id="${escapeHtml(row.id)}">
      <div class="trade-card-header">
          <div class="trade-user">
          <a class="trade-user-link" href="${escapeHtml(profileHref)}">
            <div class="trade-avatar-shell">
              ${
                avatarUrl
                  ? `<img class="trade-avatar" src="${encodeAssetPath(avatarUrl)}" alt="${escapeHtml(displayName)} avatar">`
                  : `<span class="trade-avatar-placeholder">${escapeHtml(getInitials(displayName))}</span>`
              }
            </div>

            <div class="trade-user-copy">
              <p class="trade-user-name">${escapeHtml(displayName)}</p>
              <p class="trade-user-date">${escapeHtml(formatTradeDate(row.created_at))}</p>
              ${renderTraderSignals(row)}
            </div>
          </a>
        </div>

        <div class="trade-badge-row">
          <span class="trade-pill trade-type-${escapeHtml(row.listing_type || "selling")}">${escapeHtml(
            labelFor(TRADE_TYPES_CREATE, row.listing_type, "Trade")
          )}</span>
          ${statusHtml}
        </div>
      </div>

      <div class="trade-card-body">
        <div class="trade-thumbnail-shell">
          ${thumbnailHtml}
        </div>

        <div class="trade-card-copy">
          <h3>${escapeHtml(row.item_name || "Unnamed Listing")}</h3>
          <div class="trade-meta-strip">
            <span class="meta-pill">${escapeHtml(labelFor(ITEM_TYPES_CREATE, row.item_type, "Other"))}</span>
            <span class="meta-pill">${escapeHtml(labelFor(SERVER_TYPES_CREATE, row.server_type, "Any"))}</span>
            <span class="meta-pill">${escapeHtml(quantityLabel)}</span>
          </div>
          <p class="trade-price">${
            row.asking_price
              ? escapeHtml(row.asking_price)
              : `Open to ${escapeHtml(labelFor(CURRENCY_OPTIONS, row.currency, "offers")).toLowerCase()}`
          }</p>
          <p class="trade-summary">${escapeHtml(row.description || "No extra trade notes were added.")}</p>
        </div>
      </div>

      <div class="trade-card-footer">
        ${primaryAction}
        ${footerHtml}
      </div>
    </article>
  `;
}
