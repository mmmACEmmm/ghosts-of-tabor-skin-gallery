# Supabase Setup

Run the app on Vercel with the `Other` preset and no build command. The frontend stays static, and the moderation/public-preview logic lives in Vercel API routes plus Supabase Auth and Storage.

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
- a `previews` storage bucket
- RLS and storage policies for user uploads and admin moderation
- explicit grants so the public gallery can read only the approved view

This version uses the simpler public-approved-preview flow: uploads still land under `pending/<user-id>/...`, and the public site only reads approved rows from the database.

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
```

The current implementation does not require `SUPABASE_SERVICE_ROLE_KEY`, which makes deployment simpler and avoids depending on a server-side secret for the public gallery.

## 6. Deploy behavior

- `/` shows approved previews from Supabase once the public env vars are configured.
- Until then, the gallery falls back to bundled repo previews so the site still works during setup.
- `/submit` uploads to `previews/pending/<user-id>/...`
- `/my-submissions` shows the user's own rows
- `/admin` reads pending rows and reviews them through the consolidated `/api/admin` handler
- Approved uploads store a `public_url`, and the public gallery reads only approved database rows rather than scanning the storage bucket directly
