# Ghosts of Tabor Skin Gallery

This repo now supports a static Vercel deployment with backend-capable pieces layered in through Vercel API routes and Supabase. The public gallery stays lightweight, while Discord login, uploads, moderation, and approved preview delivery are handled through Supabase Auth, Storage, and server-side routes.

## Stack

- Vercel with the `Other` preset and no build command
- Supabase for Postgres, Auth, and Storage
- Discord OAuth2 login through Supabase Auth
- Static HTML, CSS, and JS for the frontend

## Pages

- `/` public gallery with approved previews only
- `/login` Discord sign-in entry point
- `/submit` authenticated upload form
- `/my-submissions` per-user status view
- `/admin` admin-only moderation queue

## Local data workflow

The repo still treats the local `Skins data` folder as the source of truth for static pack metadata such as:

- pack name
- slug
- source label
- compatible items
- cover image

Run the generator whenever that archive changes:

```powershell
powershell -ExecutionPolicy Bypass -File .\build-data.ps1
```

That rebuilds `data/skins.json` and generates Supabase seed files in `supabase/seed/`.

## Supabase setup

Full setup steps live in [supabase/README.md](/C:/Users/acest/Downloads/wiki%20test%20page/supabase/README.md).

At a high level:

1. Create a Supabase project.
2. Create a Discord OAuth app and connect it in Supabase Auth.
3. Run [supabase/schema.sql](/C:/Users/acest/Downloads/wiki%20test%20page/supabase/schema.sql).
4. Import [supabase/seed/skins.sql](/C:/Users/acest/Downloads/wiki%20test%20page/supabase/seed/skins.sql).
5. Add your Discord-backed auth UUID to `admin_users`.
6. Set the Vercel env vars from [.env.example](/C:/Users/acest/Downloads/wiki%20test%20page/.env.example).

## Notes

- Until Supabase env vars are configured, the gallery falls back to bundled repo previews so the site still deploys cleanly.
- Once Supabase is configured, the public preview list comes from approved database records instead of the old static preview list.
- The `previews` storage bucket is private; public approved images are served through a Vercel API route rather than exposing pending storage paths directly.
