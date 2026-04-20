import { fetchJson } from "/assets/js/api-client.js";
import { initAppShell } from "/assets/js/app-shell.js?v=20260420a";
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
  const status = byId("mySubmissionsStatus");
  status.hidden = !message;
  status.className = `inline-message${tone ? ` ${tone}` : ""}`;
  status.textContent = message || "";
}

function formatDate(value) {
  if (!value) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderRows(rows) {
  const list = byId("submissionList");

  if (!rows.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No submissions yet.</p>
        <p>Once you upload a preview, it will show up here with its moderation status.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = rows
    .map(
      (row) => `
        <article class="submission-card panel-card">
          <div class="submission-preview">
            ${
              row.preview_url
                ? `<img src="${encodeAssetPath(row.preview_url)}" alt="${escapeHtml(row.skin?.name || "Skin preview")}">`
                : `<div class="submission-preview placeholder">Preview unavailable</div>`
            }
          </div>

          <div class="submission-body">
            <div class="submission-header">
              <div>
                <p class="eyebrow eyebrow-muted">Submission</p>
                <h2>${escapeHtml(row.skin?.name || "Unknown Skin")}</h2>
              </div>
              <span class="status-pill status-${escapeHtml(row.status)}">${escapeHtml(row.status)}</span>
            </div>

            <p class="guide-text">Submitted ${escapeHtml(formatDate(row.created_at))}</p>
            ${
              row.reviewed_at
                ? `<p class="guide-text">Reviewed ${escapeHtml(formatDate(row.reviewed_at))}</p>`
                : ""
            }
            ${
              row.notes
                ? `<p class="submission-notes">${escapeHtml(row.notes)}</p>`
                : `<p class="submission-notes submission-notes-muted">No moderator notes yet.</p>`
            }
          </div>
        </article>
      `
    )
    .join("");
}

async function init() {
  const shellState = await initAppShell();
  const loginButton = byId("mySubmissionsLoginButton");

  loginButton.addEventListener("click", async function () {
    try {
      await loginWithDiscord("/my-submissions");
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

    setMessage("Sign in with Discord to see your submissions.", "warning");
    return;
  }

  loginButton.hidden = true;
  setMessage("Loading your submissions...");

  try {
    const response = await fetchJson("/api/my-submissions", {
      authenticated: true,
    });

    renderRows(response.rows || []);
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }
}

init();
