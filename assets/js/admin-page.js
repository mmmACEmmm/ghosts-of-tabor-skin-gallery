import { fetchJson } from "/assets/js/api-client.js";
import { initAppShell, resolveAdminState } from "/assets/js/app-shell.js?v=20260420d";
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

function setSectionMessage(id, message, tone = "") {
  const status = byId(id);
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

function getApplicantName(row) {
  return (
    row?.profile?.display_name ||
    row?.profile?.in_game_name ||
    row?.applicant_user_id ||
    "Unknown"
  );
}

function renderApplicationRows(rows) {
  const list = byId("adminApplicationsList");

  if (!rows.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p>No pending role requests right now.</p>
        <p>New Bodyguard or BOA applications will appear here.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = rows
    .map((row) => {
      const badges = [];

      if (row?.profile?.in_game_name) {
        badges.push(`<span class="profile-badge profile-badge-subtle">IGN: ${escapeHtml(row.profile.in_game_name)}</span>`);
      }

      if (row?.profile?.is_bodyguard) {
        badges.push('<span class="profile-badge profile-badge-bodyguard">Bodyguard</span>');
      }

      if (row?.profile?.is_boa_verified) {
        badges.push('<span class="profile-badge profile-badge-boa">BOA Verified</span>');
      }

      if (Number(row?.profile?.total_votes || 0) > 0) {
        badges.push(
          `<span class="profile-badge profile-badge-reputation">${escapeHtml(
            `${Number(row.profile.positive_percent || 0)}% positive`
          )}</span>`
        );
      }

      return `
        <article class="application-review-card panel-card" data-application-id="${escapeHtml(row.id)}">
          <div class="application-review-header">
            <div>
              <p class="eyebrow eyebrow-muted">${escapeHtml(row.application_type === "boa" ? "BOA Verification" : "Bodyguard Request")}</p>
              <h2>${escapeHtml(getApplicantName(row))}</h2>
            </div>
            <span class="status-pill status-pending">pending</span>
          </div>

          <div class="profile-badge-row">${badges.join("")}</div>
          <p class="guide-text">${escapeHtml(formatDate(row.created_at))}</p>
          <p class="guide-text">${escapeHtml(row.message || "No application note added.")}</p>

          <label class="field textarea-field">
            <span>Review Notes</span>
            <textarea rows="3" data-application-notes>${escapeHtml(row.review_notes || "")}</textarea>
          </label>

          <div class="submission-actions">
            <button class="action-button" type="button" data-application-action="approved">Approve & Grant</button>
            <button class="action-button action-button-secondary" type="button" data-application-action="rejected">Reject</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadPendingRows() {
  const response = await fetchJson("/api/admin/pending", {
    authenticated: true,
  });

  renderRows(response.rows || []);
}

async function loadApplications() {
  const response = await fetchJson("/api/admin/applications", {
    authenticated: true,
  });

  renderApplicationRows(response.rows || []);
}

async function init() {
  const shellState = await initAppShell();
  const loginButton = byId("adminLoginButton");
  const list = byId("adminSubmissionList");
  const applicationList = byId("adminApplicationsList");

  loginButton.addEventListener("click", async function () {
    try {
      await loginWithDiscord("/admin");
    } catch (error) {
      setSectionMessage("adminStatus", error.message, "error");
    }
  });

  if (!isSupabaseConfigured()) {
    loginButton.hidden = true;
    setSectionMessage("adminStatus", "Supabase is not configured yet. Finish setup first.", "warning");
    return;
  }

  const user = shellState.user || (await getCurrentUser().catch(() => null));
  if (!user) {
    onAuthStateChange(function (_event, session) {
      if (session?.user) {
        window.location.reload();
      }
    });

    setSectionMessage("adminStatus", "Sign in with an allowed Discord account to moderate submissions.", "warning");
    return;
  }

  loginButton.hidden = true;

  const isAdmin = await resolveAdminState(user);
  if (!isAdmin) {
    setSectionMessage("adminStatus", "This Discord account is signed in, but it is not on the admin allowlist.", "warning");
    return;
  }

  setSectionMessage("adminStatus", "Loading pending submissions...");
  setSectionMessage("adminApplicationsStatus", "Loading role applications...");

  try {
    await loadPendingRows();
    setSectionMessage("adminStatus", "");
  } catch (error) {
    setSectionMessage("adminStatus", error.message, "error");
  }

  try {
    await loadApplications();
    setSectionMessage("adminApplicationsStatus", "");
  } catch (error) {
    setSectionMessage("adminApplicationsStatus", error.message, "error");
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
    setSectionMessage("adminStatus", `Saving ${action} review...`);

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
      setSectionMessage("adminStatus", `Submission ${action}.`, "success");
    } catch (error) {
      button.disabled = false;
      setSectionMessage("adminStatus", error.message, "error");
    }
  });

  applicationList.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-application-action]");
    if (!button) {
      return;
    }

    const card = button.closest("[data-application-id]");
    if (!card) {
      return;
    }

    const applicationId = card.dataset.applicationId;
    const reviewNotes = card.querySelector("[data-application-notes]")?.value || "";
    const action = button.dataset.applicationAction;

    button.disabled = true;
    setSectionMessage("adminApplicationsStatus", `Saving ${action} review...`);

    try {
      await fetchJson("/api/admin/application-review", {
        method: "POST",
        authenticated: true,
        body: {
          applicationId,
          action,
          reviewNotes,
        },
      });

      await loadApplications();
      setSectionMessage(
        "adminApplicationsStatus",
        action === "approved" ? "Application approved and role granted." : "Application rejected.",
        "success"
      );
    } catch (error) {
      button.disabled = false;
      setSectionMessage("adminApplicationsStatus", error.message, "error");
    }
  });
}

init();
