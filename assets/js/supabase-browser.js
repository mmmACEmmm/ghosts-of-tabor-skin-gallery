import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

let supabaseClient;

export function getPublicEnv() {
  const env = window.PUBLIC_ENV || {};
  return {
    supabaseUrl: env.supabaseUrl || "",
    supabaseAnonKey: env.supabaseAnonKey || "",
  };
}

export function isSupabaseConfigured() {
  const env = getPublicEnv();
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseClient) {
    const env = getPublicEnv();

    supabaseClient = createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  }

  return supabaseClient;
}

export async function getCurrentUser() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }

  return data.user || null;
}

export async function getCurrentSession() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  return data.session || null;
}

export async function getAccessToken() {
  const session = await getCurrentSession();
  return session?.access_token || null;
}

export async function loginWithDiscord(redirectPath = "/submit") {
  const supabase = getSupabaseClient();
  if (!supabase) {
    throw new Error("Supabase is not configured yet.");
  }

  const redirectTo = new URL(redirectPath, window.location.origin).toString();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "discord",
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }
}

export async function logout() {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export function onAuthStateChange(callback) {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { data: { subscription: { unsubscribe() {} } } };
  }

  return supabase.auth.onAuthStateChange(callback);
}
