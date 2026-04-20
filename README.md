# Taboreo

Taboreo is a static Vercel deployment backed by Supabase for Discord login, preview moderation, and public player trade listings. It keeps the skin gallery lightweight while layering in authenticated submissions, admin review, and a marketplace without moving away from plain HTML, CSS, and JS.

## Stack

- Vercel with the `Other` preset and no build command
- Supabase for Postgres, Auth, and Storage
- Discord OAuth2 login through Supabase Auth
- Static HTML, CSS, and JS for the frontend
- Operational Raid Brigade (ORB) branding and Discord community links

## Pages

- `/` public skin gallery
- `/market` public trade listings
- `/market/new` authenticated create-listing form
- `/login` Discord sign-in entry point
- `/submit` authenticated upload form
- `/my-submissions` per-user status view
- `/my-trades` per-user trade management
- `/admin` admin-only moderation queue
- `/privacy` plain-language privacy policy

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
5. Re-run [supabase/schema.sql](/C:/Users/acest/Downloads/wiki%20test%20page/supabase/schema.sql) whenever you add new Supabase-backed features such as trade listings.
6. Add your Discord-backed auth UUID to `admin_users`.
7. Set the Vercel env vars from [.env.example](/C:/Users/acest/Downloads/wiki%20test%20page/.env.example).

## Notes

- Until `SUPABASE_URL` and `SUPABASE_ANON_KEY` are configured, the gallery falls back to bundled repo previews so the site still deploys cleanly.
- Once Supabase is configured, the public preview list comes from approved database records instead of the old static preview list.
- The public gallery no longer depends on a service-role secret just to load approved previews.
- The public market depends on the `trade_listings` table and related policies in [supabase/schema.sql](/C:/Users/acest/Downloads/wiki%20test%20page/supabase/schema.sql).
