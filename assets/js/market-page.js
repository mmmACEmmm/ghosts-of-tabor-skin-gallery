import { fetchJson } from "/assets/js/api-client.js";
import { initAppShell } from "/assets/js/app-shell.js?v=20260420d";
import { escapeHtml } from "/assets/js/skin-data.js?v=20260419d";
import {
  filterTradeListings,
  ITEM_TYPES,
  renderTradeCard,
  SERVER_TYPES,
  TRADE_TYPES,
} from "/assets/js/trade-utils.js?v=20260420d";

const state = {
  rows: [],
  search: "",
  type: "all",
  server: "all",
  itemType: "all",
};

function byId(id) {
  return document.getElementById(id);
}

function setMessage(message, tone = "") {
  const status = byId("marketStatus");
  status.hidden = !message;
  status.className = `inline-message${tone ? ` ${tone}` : ""}`;
  status.textContent = message || "";
}

function renderSelectOptions(selectId, options) {
  const node = byId(selectId);
  node.innerHTML = options
    .map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`)
    .join("");
}

function renderEmptyState(title, copy) {
  return `
    <div class="empty-state trade-empty-state">
      <p>${escapeHtml(title)}</p>
      <p>${escapeHtml(copy)}</p>
    </div>
  `;
}

function renderListings() {
  const filtered = filterTradeListings(state.rows, state);
  const sellRows = filtered.filter((row) => row.listing_type === "selling");
  const requestRows = filtered.filter((row) => row.listing_type !== "selling");

  byId("sellCount").textContent = String(sellRows.length);
  byId("requestCount").textContent = String(requestRows.length);

  byId("sellListings").innerHTML = sellRows.length
    ? sellRows.map((row) => renderTradeCard(row)).join("")
    : renderEmptyState("No sell orders yet.", "Post a listing or widen your filters.");

  byId("requestListings").innerHTML = requestRows.length
    ? requestRows.map((row) => renderTradeCard(row)).join("")
    : renderEmptyState("No buy or swap listings yet.", "Try clearing a filter or create the first one.");
}

async function init() {
  await initAppShell();

  renderSelectOptions("tradeTypeFilter", TRADE_TYPES);
  renderSelectOptions("serverFilter", SERVER_TYPES);
  renderSelectOptions("itemTypeFilter", ITEM_TYPES);

  byId("marketSearch").addEventListener("input", function (event) {
    state.search = event.target.value;
    renderListings();
  });

  byId("tradeTypeFilter").addEventListener("change", function (event) {
    state.type = event.target.value;
    renderListings();
  });

  byId("serverFilter").addEventListener("change", function (event) {
    state.server = event.target.value;
    renderListings();
  });

  byId("itemTypeFilter").addEventListener("change", function (event) {
    state.itemType = event.target.value;
    renderListings();
  });

  setMessage("Loading active trades...");

  try {
    const response = await fetchJson("/api/trades?view=listings");

    if (response.configured === false) {
      byId("sellListings").innerHTML = renderEmptyState(
        "Market setup still needs finishing.",
        "Add the trade listing tables in Supabase before public listings can load."
      );
      byId("requestListings").innerHTML = renderEmptyState(
        "Market setup still needs finishing.",
        "Add the trade listing tables in Supabase before public listings can load."
      );
      setMessage(response.message || "Market setup is not finished yet.", "warning");
      return;
    }

    state.rows = response.rows || [];
    renderListings();

    if (!state.rows.length) {
      setMessage("The market is live, but nobody has posted a public listing yet.", "warning");
      return;
    }

    setMessage("");
  } catch (error) {
    byId("sellListings").innerHTML = renderEmptyState("Market unavailable right now.", error.message);
    byId("requestListings").innerHTML = renderEmptyState("Market unavailable right now.", error.message);
    setMessage("The market tables still need to be added in Supabase before listings can load.", "warning");
  }
}

init();
