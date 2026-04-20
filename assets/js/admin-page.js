import { fetchJson } from "/assets/js/api-client.js";
import { initAppShell, resolveAdminState } from "/assets/js/app-shell.js?v=20260419c";
import { encodeAssetPath, escapeHtml } from "/assets/js/skin-data.js";
import {
  getCurrentUser,
  isSupabaseConfigured,
  loginWithDiscord,
  onAuthStateChange,
} from "/assets/js/supabase-browser.js";

function byId(id) {
  return document.getElementById(id);
}

function setMessage(message, tone = "") {
  const status = byId("adminStatus");
  status.hidden = !message;
  status.className = `inline-message${tone ? ` ${tone}` : ""}`;
  status.textContent = message || "";
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderRows(rows) {
  const list = byId("adminSubmissionList");

  if (!rows.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No pending submissions right now.</p>
        <p>New uploads will appear here for moderation as they come in.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = rows
    .map(
      (row) => `
        <article class="submission-card panel-card" data-submission-id="${escapeHtml(row.id)}">
          <div class="submission-preview">
            ${
              row.preview_url
                ? `<img src="${encodeAssetPath(row.preview_url)}" alt="${escapeHtml(row.skin?.name || "Pending preview")}">`
                : `<div class="submission-preview placeholder">Preview unavailable</div>`
            }
          </div>

          <div class="submission-body">
            <div class="submission-header">
              <div>
                <p class="eyebrow eyebrow-muted">Pending Review</p>
                <h2>${escapeHtml(row.skin?.name || "Unknown Skin")}</h2>
              </div>
              <span class="status-pill status-pending">pending</span>
            </div>

            <p class="guide-text">Submitted by ${escapeHtml(row.submitted_discord_name || row.submitted_by || "Unknown")}</p>
            <p class="guide-text">${escapeHtml(formatDate(row.created_at))}</p>

            <label class="field textarea-field">
              <span>Moderator Notes</span>
              <textarea rows="3" data-notes>${escapeHtml(row.notes || "")}</textarea>
            </label>

            <div class="submission-actions">
              <button class="action-button" type="button" data-action="approved">Approve</button>
              <button class="action-button action-button-secondary" type="button" data-action="rejected">Reject</button>
            </div>
          </div>
        </article>
      `
    )
    .join("");
}

async function loadPendingRows() {
  const response = await fetchJson("/api/admin/pending", {
    authenticated: true,
  });

  renderRows(response.rows || []);
}

async function init() {
  const shellState = await initAppShell();
  const loginButton = byId("adminLoginButton");
  const list = byId("adminSubmissionList");

  loginButton.addEventListener("click", async function () {
    try {
      await loginWithDiscord("/admin");
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

    setMessage("Sign in with an allowed Discord account to moderate submissions.", "warning");
    return;
  }

  loginButton.hidden = true;

  const isAdmin = await resolveAdminState(user);
  if (!isAdmin) {
    setMessage("This Discord account is signed in, but it is not on the admin allowlist.", "warning");
    return;
  }

  setMessage("Loading pending submissions...");

  try {
    await loadPendingRows();
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }

  list.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-action]");
    if (!button) {
      return;
    }

    const card = button.closest("[data-submission-id]");
    if (!card) {
      return;
    }

    const submissionId = card.dataset.submissionId;
    const notes = card.querySelector("[data-notes]")?.value || "";
    const action = button.dataset.action;

    button.disabled = true;
    setMessage(`Saving ${action} review...`);

    try {
      await fetchJson("/api/admin/review", {
        method: "POST",
        authenticated: true,
        body: {
          submissionId,
          action,
          notes,
        },
      });

      await loadPendingRows();
      setMessage(`Submission ${action}.`, "success");
    } catch (error) {
      button.disabled = false;
      setMessage(error.message, "error");
    }
  });
}

init();
