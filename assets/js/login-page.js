import { initAppShell } from "/assets/js/app-shell.js";
import {
  getCurrentUser,
  isSupabaseConfigured,
  loginWithDiscord,
} from "/assets/js/supabase-browser.js";

function setMessage(message, tone = "") {
  const status = document.getElementById("loginStatus");
  if (!status) {
    return;
  }

  status.hidden = !message;
  status.className = `inline-message${tone ? ` ${tone}` : ""}`;
  status.textContent = message || "";
}

async function init() {
  await initAppShell();

  const loginButton = document.getElementById("loginButton");
  const continueLink = document.getElementById("continueLink");

  if (!isSupabaseConfigured()) {
    setMessage("Supabase env vars are missing. Add them in Vercel before Discord login will work.", "warning");
    loginButton.disabled = true;
    return;
  }

  const user = await getCurrentUser().catch(() => null);
  if (user) {
    setMessage("Your Discord session is already active. You can head straight to submissions.", "success");
    continueLink.hidden = false;
    loginButton.hidden = true;
  }

  loginButton.addEventListener("click", async function () {
    loginButton.disabled = true;
    setMessage("Redirecting you to Discord...");

    try {
      await loginWithDiscord("/submit");
    } catch (error) {
      loginButton.disabled = false;
      setMessage(error.message, "error");
    }
  });
}

init();
