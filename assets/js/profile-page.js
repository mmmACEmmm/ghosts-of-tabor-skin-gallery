import { fetchJson } from "/assets/js/api-client.js";
import { initAppShell } from "/assets/js/app-shell.js?v=20260420d";
import { escapeHtml } from "/assets/js/skin-data.js?v=20260419d";
import { renderTradeCard } from "/assets/js/trade-utils.js?v=20260420d";
import {
  isSupabaseConfigured,
  loginWithDiscord,
  onAuthStateChange,
} from "/assets/js/supabase-browser.js";

const state = {
  shell: null,
  targetUserId: "",
  response: null,
};

function byId(id) {
  return document.getElementById(id);
}

function setMessage(message, tone = "") {
  const status = byId("profileStatus");
  status.hidden = !message;
  status.className = `inline-message${tone ? ` ${tone}` : ""}`;
  status.textContent = message || "";
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

function getInitials(value) {
  return String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";
}

function getProfileData() {
  return state.response?.profile || {
    user_id: state.targetUserId || "",
    display_name: null,
    in_game_name: null,
    bio: null,
    is_bodyguard: false,
    is_boa_verified: false,
    upvotes: 0,
    downvotes: 0,
    total_votes: 0,
    positive_percent: 0,
    fallback_name: null,
    avatar_url: null,
  };
}

function getViewerData() {
  return state.response?.viewer || {
    isAuthenticated: Boolean(state.shell?.user),
    isSelf: false,
    ownVote: null,
    userId: state.shell?.user?.id || null,
  };
}

function getDisplayName() {
  const profile = getProfileData();
  const viewer = getViewerData();

  if (profile.display_name) {
    return profile.display_name;
  }

  if (viewer.isSelf && state.shell?.user) {
    return getDiscordName(state.shell.user);
  }

  return profile.fallback_name || "Operator";
}

function getAvatarUrl() {
  const viewer = getViewerData();
  if (viewer.isSelf && state.shell?.user) {
    return getDiscordAvatar(state.shell.user);
  }

  return getProfileData().avatar_url || "";
}

function buildBadgeList(profile) {
  const badges = [];

  if (profile.in_game_name) {
    badges.push({ label: `IGN: ${profile.in_game_name}`, className: "profile-badge-subtle" });
  }

  if (profile.is_bodyguard) {
    badges.push({ label: "Bodyguard", className: "profile-badge-bodyguard" });
  }

  if (profile.is_boa_verified) {
    badges.push({ label: "BOA Verified", className: "profile-badge-boa" });
  }

  if (Number(profile.total_votes || 0) > 0) {
    badges.push({
      label: `${Number(profile.positive_percent || 0)}% positive`,
      className: "profile-badge-reputation",
    });
  }

  return badges;
}

function renderBadges(profile) {
  const row = byId("profileBadgeRow");
  const badges = buildBadgeList(profile);

  row.innerHTML = badges
    .map((badge) => `<span class="profile-badge ${badge.className}">${escapeHtml(badge.label)}</span>`)
    .join("");
}

function renderAvatar() {
  const displayName = getDisplayName();
  const avatarUrl = getAvatarUrl();
  const image = byId("profileAvatarImage");
  const initial = byId("profileAvatarInitial");

  if (avatarUrl) {
    image.hidden = false;
    image.src = avatarUrl;
    image.alt = `${displayName} avatar`;
    initial.hidden = true;
    initial.textContent = "";
    return;
  }

  image.hidden = true;
  image.removeAttribute("src");
  image.alt = "";
  initial.hidden = false;
  initial.textContent = getInitials(displayName);
}

function renderSummary() {
  const profile = getProfileData();
  const viewer = getViewerData();
  const displayName = getDisplayName();

  byId("profileDisplayName").textContent = displayName;
  byId("profileSubline").textContent = viewer.isSelf
    ? "This is your public trader card. Other players will see these details before they decide whether to trade with you."
    : "Public trader profile for Taboreo market deals and ORB trade coordination.";

  renderAvatar();
  renderBadges(profile);

  const totalVotes = Number(profile.total_votes || 0);
  byId("profilePositivePercent").textContent = totalVotes
    ? `${Number(profile.positive_percent || 0)}%`
    : "New";
  byId("profileUpvotes").textContent = String(Number(profile.upvotes || 0));
  byId("profileDownvotes").textContent = String(Number(profile.downvotes || 0));

  const bioCopy = profile.bio || (viewer.isSelf
    ? "You have not added a public bio yet. Add what you trade, how you coordinate, and anything people should know before messaging you."
    : "This trader has not added a public bio yet.");
  byId("profileBioCopy").textContent = bioCopy;

  byId("profileVoteSummary").textContent = totalVotes
    ? `${Number(profile.upvotes || 0)} thumbs up, ${Number(profile.downvotes || 0)} thumbs down, and ${Number(
        profile.positive_percent || 0
      )}% positive overall.`
    : "No ratings yet. Early trades will set the tone.";
}

function renderVoting() {
  const viewer = getViewerData();
  const actions = byId("profileVoteActions");

  actions.hidden = !viewer.isAuthenticated || viewer.isSelf;

  actions.querySelectorAll("[data-vote-button]").forEach((button) => {
    const vote = Number(button.dataset.voteButton || 0);
    button.classList.toggle("active", viewer.ownVote === vote);
  });
}

function renderEditor() {
  const viewer = getViewerData();
  const profile = getProfileData();
  const editorCard = byId("profileEditorCard");

  editorCard.hidden = !viewer.isSelf;
  if (!viewer.isSelf) {
    return;
  }

  byId("profileDisplayNameInput").value = profile.display_name || "";
  byId("profileInGameNameInput").value = profile.in_game_name || "";
  byId("profileBioInput").value = profile.bio || "";
}

function applicationStatusLabel(status) {
  return status === "approved" ? "Approved" : status === "rejected" ? "Rejected" : "Pending";
}

function applicationTypeLabel(value) {
  return value === "boa" ? "BOA Verification" : "Bodyguard";
}

function renderApplications() {
  const viewer = getViewerData();
  const profile = getProfileData();
  const card = byId("profileApplicationsCard");
  const history = byId("applicationHistory");
  const typeInput = byId("applicationTypeInput");
  const messageInput = byId("applicationMessageInput");
  const submitButton = byId("applicationSubmitButton");
  const rows = state.response?.applications || [];

  card.hidden = !viewer.isSelf;
  if (!viewer.isSelf) {
    return;
  }

  const hasPendingBodyguard = rows.some(
    (row) => row.application_type === "bodyguard" && row.status === "pending"
  );
  const hasPendingBoa = rows.some((row) => row.application_type === "boa" && row.status === "pending");
  const selectedType = typeInput.value;
  const disabledForSelectedType =
    (selectedType === "bodyguard" && (profile.is_bodyguard || hasPendingBodyguard)) ||
    (selectedType === "boa" && (profile.is_boa_verified || hasPendingBoa));

  submitButton.disabled = disabledForSelectedType;

  if (selectedType === "bodyguard" && profile.is_bodyguard) {
    submitButton.textContent = "Bodyguard already granted";
  } else if (selectedType === "boa" && profile.is_boa_verified) {
    submitButton.textContent = "BOA already granted";
  } else if (selectedType === "bodyguard" && hasPendingBodyguard) {
    submitButton.textContent = "Bodyguard request pending";
  } else if (selectedType === "boa" && hasPendingBoa) {
    submitButton.textContent = "BOA request pending";
  } else {
    submitButton.textContent = "Send Application";
  }

  if (!rows.length) {
    history.innerHTML = `
      <div class="empty-state">
        <p>No role applications yet.</p>
        <p>Apply here if you want the Bodyguard or BOA badge added to your public profile.</p>
      </div>
    `;
    return;
  }

  history.innerHTML = rows
    .map(
      (row) => `
        <article class="application-card">
          <div class="application-card-header">
            <div>
              <p class="eyebrow eyebrow-muted">${applicationTypeLabel(row.application_type)}</p>
              <h3>${applicationStatusLabel(row.status)}</h3>
            </div>
            <span class="status-pill status-${row.status}">${applicationStatusLabel(row.status).toLowerCase()}</span>
          </div>

          <p class="guide-text">${escapeHtml(row.message || "No application message added.")}</p>
          ${
            row.review_notes
              ? `<p class="submission-notes">${escapeHtml(row.review_notes)}</p>`
              : ""
          }
        </article>
      `
    )
    .join("");

  if (disabledForSelectedType && !messageInput.value.trim()) {
    messageInput.value = "";
  }
}

function renderListings() {
  const list = byId("profileListings");
  const rows = state.response?.listings || [];

  if (!rows.length) {
    list.innerHTML = `
      <div class="empty-state trade-empty-state">
        <p>No active listings right now.</p>
        <p>This trader does not have any live market posts at the moment.</p>
      </div>
    `;
    return;
  }

  list.innerHTML = rows.map((row) => renderTradeCard(row)).join("");
}

function syncHeaderProfileCard() {
  const viewer = getViewerData();
  if (!viewer.isSelf) {
    return;
  }

  const profile = getProfileData();
  const roleLabels = [];

  if (state.shell?.isAdmin) {
    roleLabels.push("Admin");
  }

  if (profile.is_bodyguard) {
    roleLabels.push("Bodyguard");
  }

  if (profile.is_boa_verified) {
    roleLabels.push("BOA Verified");
  }

  document.querySelectorAll("[data-user-name]").forEach((node) => {
    node.textContent = getDisplayName();
  });

  document.querySelectorAll("[data-user-role]").forEach((node) => {
    const text = roleLabels.join(" · ");
    node.hidden = !text;
    node.textContent = text;
    node.classList.toggle("is-admin", Boolean(state.shell?.isAdmin));
  });
}

function renderPage() {
  renderSummary();
  renderVoting();
  renderEditor();
  renderApplications();
  renderListings();
  syncHeaderProfileCard();
}

async function loadProfile() {
  const url = new URL("/api/profile", window.location.origin);
  url.searchParams.set("view", "details");
  if (state.targetUserId) {
    url.searchParams.set("userId", state.targetUserId);
  }

  state.response = state.shell?.user
    ? await fetchJson(`${url.pathname}${url.search}`, { authenticated: true })
    : await fetchJson(`${url.pathname}${url.search}`);

  renderPage();
}

async function handleVote(nextVote) {
  const viewer = getViewerData();
  const targetUserId = getProfileData().user_id;
  const vote = viewer.ownVote === nextVote ? 0 : nextVote;

  setMessage("Saving your trader rating...");

  await fetchJson("/api/profile?action=vote", {
    method: "POST",
    authenticated: true,
    body: {
      targetUserId,
      vote,
    },
  });

  await loadProfile();
  setMessage("Trader rating updated.", "success");
}

async function handleProfileSave(event) {
  event.preventDefault();

  setMessage("Saving your profile...");

  await fetchJson("/api/profile?action=update", {
    method: "POST",
    authenticated: true,
    body: {
      displayName: byId("profileDisplayNameInput").value,
      inGameName: byId("profileInGameNameInput").value,
      bio: byId("profileBioInput").value,
    },
  });

  await loadProfile();
  setMessage("Profile saved.", "success");
}

async function handleApplicationSubmit(event) {
  event.preventDefault();

  setMessage("Sending your application...");

  await fetchJson("/api/profile?action=apply", {
    method: "POST",
    authenticated: true,
    body: {
      applicationType: byId("applicationTypeInput").value,
      message: byId("applicationMessageInput").value,
    },
  });

  byId("applicationMessageInput").value = "";
  await loadProfile();
  setMessage("Application submitted for review.", "success");
}

async function init() {
  const loginButton = byId("profileLoginButton");
  state.shell = await initAppShell();

  loginButton.addEventListener("click", async function () {
    try {
      await loginWithDiscord(`${window.location.pathname}${window.location.search}`);
    } catch (error) {
      setMessage(error.message, "error");
    }
  });

  byId("profileForm").addEventListener("submit", function (event) {
    handleProfileSave(event).catch((error) => setMessage(error.message, "error"));
  });

  byId("applicationForm").addEventListener("submit", function (event) {
    handleApplicationSubmit(event).catch((error) => setMessage(error.message, "error"));
  });

  byId("applicationTypeInput").addEventListener("change", function () {
    renderApplications();
  });

  byId("profileVoteActions").addEventListener("click", function (event) {
    const button = event.target.closest("[data-vote-button]");
    if (!button) {
      return;
    }

    handleVote(Number(button.dataset.voteButton || 0)).catch((error) => setMessage(error.message, "error"));
  });

  if (!isSupabaseConfigured()) {
    loginButton.hidden = true;
    setMessage("Supabase is not configured yet. Finish setup first.", "warning");
    return;
  }

  const queryUserId = String(new URLSearchParams(window.location.search).get("user") || "").trim();
  state.targetUserId = queryUserId || state.shell?.user?.id || "";

  if (!state.targetUserId) {
    onAuthStateChange(function (_event, session) {
      if (session?.user) {
        window.location.reload();
      }
    });

    setMessage("Login with Discord to open and customize your trader profile.", "warning");
    renderPage();
    return;
  }

  loginButton.hidden = Boolean(state.shell?.user);
  setMessage("Loading profile...");

  try {
    await loadProfile();
    setMessage("");
  } catch (error) {
    setMessage(error.message, "error");
  }

  if (!state.shell?.user) {
    onAuthStateChange(function (_event, session) {
      if (session?.user) {
        window.location.reload();
      }
    });
  }
}

init();
