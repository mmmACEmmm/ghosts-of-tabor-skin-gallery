import { fetchJson } from "/assets/js/api-client.js";
import { initAppShell } from "/assets/js/app-shell.js?v=20260420d";
import {
  getCurrentUser,
  isSupabaseConfigured,
  loginWithDiscord,
  onAuthStateChange,
} from "/assets/js/supabase-browser.js";
import { renderTradeCard } from "/assets/js/trade-utils.js?v=20260420d";

function byId(id) {
  return document.getElementById(id);
}

function setMessage(message, tone = "") {
  const status = byId("myTradesStatus");
  status.hidden = !message;
  status.className = `inline-message${tone ? ` ${tone}` : ""}`;
  status.textContent = message || "";
}

function getActions(row) {
  if (row.status === "active") {
    return `
      <button class="action-button action-button-secondary" type="button" data-action="archive">Archive</button>
      <button class="action-button" type="button" data-action="close">Mark Closed</button>
    `;
  }

  if (row.status === "archived") {
    return `
      <button class="action-button" type="button" data-action="activate">Relist</button>
      <button class="action-button action-button-secondary" type="button" data-action="close">Mark Closed</button>
    `;
  }

  return `
    <button class="action-button" type="button" data-action="activate">Relist</button>
  `;
}

function renderRows(rows) {
  const list = byId("myTradesList");

  if (!rows.length) {
    list.innerHTML = `
      <div class="empty-state trade-empty-state">
        <p>No trade listings yet.</p>
        <p>Create your first public listing and it will show up here.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = rows
    .map((row) =>
      renderTradeCard(row, {
        showStatus: true,
        actionHref: "/market/new",
        actionLabel: "Create Another",
        actionTargetBlank: false,
        footerHtml: `
          <div class="trade-card-actions" data-listing-actions>
            ${getActions(row)}
          </div>
        `,
      })
    )
    .join("");
}

async function loadRows() {
  const response = await fetchJson("/api/trades?view=my-listings", {
    authenticated: true,
  });

  renderRows(response.rows || []);
}

async function init() {
  const shellState = await initAppShell();
  const loginButton = byId("myTradesLoginButton");
  const list = byId("myTradesList");

  loginButton.addEventListener("click", async function () {
    try {
      await loginWithDiscord("/my-trades");
    } catch (error) {
      setMessage(error.message, "error");
    }
  });

  if (!isSupabaseConfigured()) {
    loginButton.hidden = true;
    setMessage("Supabase is not configured yet. Finish setup first.", "warning");
    return;
  }

  const user = shellState.user || (await getCurrentUser().catch(() => null));
  if (!user) {
    onAuthStateChange(function (_event, session) {
      if (session?.user) {
        window.location.reload();
      }
    });

    setMessage("Sign in with Discord to manage your trade listings.", "warning");
    return;
  }

  loginButton.hidden = true;
  setMessage("Loading your trade listings...");

  try {
    await loadRows();
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }

  list.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const card = button.closest("[data-listing-id]");
    if (!card) {
      return;
    }

    const listingId = card.dataset.listingId;
    const action = button.dataset.action;

    button.disabled = true;
    setMessage(`Updating listing...`);

    try {
      await fetchJson("/api/trades?action=update", {
        method: "POST",
        authenticated: true,
        body: {
          listingId,
          action,
        },
      });

      await loadRows();
      setMessage("Trade listing updated.", "success");
    } catch (error) {
      button.disabled = false;
      setMessage(error.message, "error");
    }
  });
}

init();
