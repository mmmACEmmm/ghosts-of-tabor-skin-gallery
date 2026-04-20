import {
  getCurrentUser,
  getSupabaseClient,
  isSupabaseConfigured,
  logout,
  onAuthStateChange,
} from "/assets/js/supabase-browser.js";

const shellState = {
  configured: false,
  user: null,
  isAdmin: false,
  profile: null,
};

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

async function getTraderProfile(user) {
  if (!user?.id) {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("public_trader_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("Could not resolve trader profile.", error);
    return null;
  }

  return data || null;
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

export async function resolveAdminState(user) {
  if (!user) {
    return false;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return false;
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.warn("Could not resolve admin status.", error);
    return false;
  }

  return Boolean(data?.user_id);
}

function applyNavState(state) {
  const currentPath = window.location.pathname.replace(/\/$/, "") || "/";
  const displayName = state.profile?.display_name || getDiscordName(state.user);
  const avatarUrl = getDiscordAvatar(state.user);
  const initialText = getInitials(displayName);
  const roleLabels = [];

  if (state.user && state.isAdmin) {
    roleLabels.push("Admin");
  }

  if (state.profile?.is_bodyguard) {
    roleLabels.push("Bodyguard");
  }

  if (state.profile?.is_boa_verified) {
    roleLabels.push("BOA Verified");
  }

  document.querySelectorAll("[data-nav-link]").forEach((link) => {
    const target = link.getAttribute("href")?.replace(/\/$/, "") || "/";
    link.classList.toggle("active", target === currentPath);
  });

  document.querySelectorAll("[data-auth='login']").forEach((node) => {
    node.hidden = !state.configured || Boolean(state.user);
  });

  document.querySelectorAll("[data-auth='logout']").forEach((node) => {
    node.hidden = !state.user;
  });

  document.querySelectorAll("[data-auth='submit']").forEach((node) => {
    node.hidden = !state.user;
  });

  document.querySelectorAll("[data-auth='my-submissions']").forEach((node) => {
    node.hidden = !state.user;
  });

  document.querySelectorAll("[data-auth='my-trades']").forEach((node) => {
    node.hidden = !state.user;
  });

  document.querySelectorAll("[data-auth='admin']").forEach((node) => {
    node.hidden = !state.user || !state.isAdmin;
  });

  document.querySelectorAll("[data-user-card]").forEach((node) => {
    node.hidden = !state.user;
    node.classList.toggle("is-clickable", Boolean(state.user));
    node.tabIndex = state.user ? 0 : -1;
    node.setAttribute("role", state.user ? "link" : "presentation");
    node.setAttribute("aria-label", state.user ? "Open your profile" : "");
  });

  document.querySelectorAll("[data-user-name]").forEach((node) => {
    node.textContent = state.user ? displayName : "";
  });

  document.querySelectorAll("[data-user-role]").forEach((node) => {
    const roleText = roleLabels.join(" · ");
    const showRole = Boolean(state.user && roleText);
    node.hidden = !showRole;
    node.textContent = showRole ? roleText : "";
    node.classList.toggle("is-admin", Boolean(state.user && state.isAdmin));
  });

  document.querySelectorAll("[data-user-avatar]").forEach((node) => {
    if (state.user && avatarUrl) {
      node.hidden = false;
      node.src = avatarUrl;
      node.alt = `${displayName} avatar`;
      return;
    }

    node.hidden = true;
    node.removeAttribute("src");
    node.alt = "";
  });

  document.querySelectorAll("[data-user-initial]").forEach((node) => {
    node.hidden = !state.user || Boolean(avatarUrl);
    node.textContent = state.user ? initialText : "";
  });
}

function openProfileFromShell() {
  if (!shellState.user) {
    return;
  }

  window.location.href = "/profile";
}

function bindUserCardNavigation() {
  document.querySelectorAll("[data-user-card]").forEach((node) => {
    if (node.dataset.profileBound === "true") {
      return;
    }

    node.dataset.profileBound = "true";
    node.addEventListener("click", function () {
      openProfileFromShell();
    });
    node.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }

      event.preventDefault();
      openProfileFromShell();
    });
  });
}

export async function initAppShell() {
  const configured = isSupabaseConfigured();
  let user = null;
  let isAdmin = false;
  let profile = null;

  if (configured) {
    try {
      user = await getCurrentUser();
      isAdmin = await resolveAdminState(user);
      profile = await getTraderProfile(user);
    } catch (error) {
      console.warn("Could not restore the current session.", error);
    }
  }

  const state = { configured, user, isAdmin, profile };
  Object.assign(shellState, state);
  bindUserCardNavigation();
  applyNavState(state);

  document.querySelectorAll("[data-auth='logout']").forEach((button) => {
    button.addEventListener("click", async function () {
      try {
        await logout();
        window.location.href = "/";
      } catch (error) {
        alert(error.message);
      }
    });
  });

  if (configured) {
    onAuthStateChange(async function (_event, session) {
      const nextUser = session?.user || null;
      const nextState = {
        configured: true,
        user: nextUser,
        isAdmin: await resolveAdminState(nextUser),
        profile: await getTraderProfile(nextUser),
      };

      Object.assign(shellState, nextState);
      applyNavState(nextState);
    });
  }

  return state;
}
