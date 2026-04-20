# Supabase Setup

Run the app on Vercel with the `Other` preset and no build command. The frontend stays static, and the moderation/public-preview logic lives in Vercel API routes.

## 1. Create Supabase + Discord auth

1. Create a Supabase project.
2. Create a Discord application in the Discord Developer Portal.
3. In Discord OAuth2, use the authorization code flow for user login.
4. Add your Supabase callback URL as the Discord redirect:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
5. In Supabase Auth providers, enable Discord and paste the Discord client ID and client secret.

## 2. Apply schema and policies

Run [schema.sql](/C:/Users/acest/Downloads/wiki%20test%20page/supabase/schema.sql) in the Supabase SQL editor. It creates:

- `skins`
- `submissions`
- `admin_users`
- `approved_previews`
- a private `previews` storage bucket
- RLS and storage policies for user uploads and admin moderation

## 3. Seed the current skin archive

Run this locally whenever the `Skins data` folder changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\build-data.ps1
```

That generates:

- [skins.sql](/C:/Users/acest/Downloads/wiki%20test%20page/supabase/seed/skins.sql)
- [legacy-approved-previews.template.sql](/C:/Users/acest/Downloads/wiki%20test%20page/supabase/seed/legacy-approved-previews.template.sql)
- [legacy-preview-manifest.json](/C:/Users/acest/Downloads/wiki%20test%20page/supabase/seed/legacy-preview-manifest.json)

Import `skins.sql` first.

If you want the existing repo-hosted preview images to keep showing immediately, replace `__LEGACY_OWNER_USER_ID__` in `legacy-approved-previews.template.sql` with your real Supabase auth user UUID, then run that SQL too. Those rows keep using the current repo image files as approved previews until you decide to move them into Supabase Storage.

## 4. Add your admin account

After your first Discord login, get your Supabase auth UUID and insert it:

```sql
insert into public.admin_users (user_id)
values ('<your-auth-user-uuid>')
on conflict (user_id) do nothing;
```

Add more Discord users to `admin_users` if you want an allowlist.

## 5. Configure Vercel env vars

Add these project env vars in Vercel:

```text
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY` is only used in Vercel API routes. Never expose it client-side.

## 6. Deploy behavior

- `/` shows public approved previews only once Supabase is configured.
- Until then, the gallery falls back to bundled repo previews so the site still works during setup.
- `/submit` uploads to `previews/pending/<user-id>/...`
- `/my-submissions` shows the user's own rows
- `/admin` reads pending rows and reviews them through `/api/admin/review`
- Public approved images are served through `/api/previews?submissionId=...`, so the raw pending storage paths stay private.
