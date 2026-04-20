-- Replace __LEGACY_OWNER_USER_ID__ with a real Supabase auth user id after your first Discord login.
-- These rows keep the existing repo-hosted preview images and register them as already-approved submissions.

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/AK74 WIPE REWARD/preview/AK74_wipe_reward_skin.png?v=1776501981-549365',
  '/Skins%20data/AK74%20WIPE%20REWARD/preview/AK74_wipe_reward_skin.png?v=1776501981-549365',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'ak74-wipe-reward'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/AK74 WIPE REWARD/preview/AK74_wipe_reward_skin.png?v=1776501981-549365'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/BLACK OPS/preview/USPSamurai45_BLACK OPS.png?v=1776497430-327538',
  '/Skins%20data/BLACK%20OPS/preview/USPSamurai45_BLACK%20OPS.png?v=1776497430-327538',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'black-ops'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/BLACK OPS/preview/USPSamurai45_BLACK OPS.png?v=1776497430-327538'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/BOA/preview/GLOCK_17_BOAg.png?v=1776641354-1038935',
  '/Skins%20data/BOA/preview/GLOCK_17_BOAg.png?v=1776641354-1038935',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'boa'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/BOA/preview/GLOCK_17_BOAg.png?v=1776641354-1038935'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/BOA/preview/MP5K_BOA.png?v=1776502003-574368',
  '/Skins%20data/BOA/preview/MP5K_BOA.png?v=1776502003-574368',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'boa'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/BOA/preview/MP5K_BOA.png?v=1776502003-574368'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/Club80/preview/Barrett_M107A1_Club80.png?v=1776486671-396213',
  '/Skins%20data/Club80/preview/Barrett_M107A1_Club80.png?v=1776486671-396213',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'club80'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/Club80/preview/Barrett_M107A1_Club80.png?v=1776486671-396213'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/Club80/preview/Desert_Eagle_Club80.png?v=1776486864-439708',
  '/Skins%20data/Club80/preview/Desert_Eagle_Club80.png?v=1776486864-439708',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'club80'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/Club80/preview/Desert_Eagle_Club80.png?v=1776486864-439708'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/EASTER/preview/Glock_17_Easter.png?v=1776503817-902823',
  '/Skins%20data/EASTER/preview/Glock_17_Easter.png?v=1776503817-902823',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'easter'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/EASTER/preview/Glock_17_Easter.png?v=1776503817-902823'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/FOUNDING FATHERS/preview/AK_109_Alpha_Founding_Father.png?v=1776500314-668812',
  '/Skins%20data/FOUNDING%20FATHERS/preview/AK_109_Alpha_Founding_Father.png?v=1776500314-668812',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'founding-fathers'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/FOUNDING FATHERS/preview/AK_109_Alpha_Founding_Father.png?v=1776500314-668812'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/GRIM GUN/preview/USP45_GRIM GUN.png?v=1776496777-547422',
  '/Skins%20data/GRIM%20GUN/preview/USP45_GRIM%20GUN.png?v=1776496777-547422',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'grim-gun'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/GRIM GUN/preview/USP45_GRIM GUN.png?v=1776496777-547422'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/GRIM RESKIN 2/preview/USP45_GRIM RESKIN 2.png?v=1776496801-432482',
  '/Skins%20data/GRIM%20RESKIN%202/preview/USP45_GRIM%20RESKIN%202.png?v=1776496801-432482',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'grim-reskin-2'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/GRIM RESKIN 2/preview/USP45_GRIM RESKIN 2.png?v=1776496801-432482'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/INDEPENDENCE/preview/M4_Carbine_INDEPENDENC.png?v=1776496871-543649',
  '/Skins%20data/INDEPENDENCE/preview/M4_Carbine_INDEPENDENC.png?v=1776496871-543649',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'independence'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/INDEPENDENCE/preview/M4_Carbine_INDEPENDENC.png?v=1776496871-543649'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/LUTY WIPE REWARD/preview/Luty_wipe_reward_skin.png?v=1776499363-643962',
  '/Skins%20data/LUTY%20WIPE%20REWARD/preview/Luty_wipe_reward_skin.png?v=1776499363-643962',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'luty-wipe-reward'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/LUTY WIPE REWARD/preview/Luty_wipe_reward_skin.png?v=1776499363-643962'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/META REVIEW/preview/AKM_Metareview.png?v=1776504642-701565',
  '/Skins%20data/META%20REVIEW/preview/AKM_Metareview.png?v=1776504642-701565',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'meta-review'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/META REVIEW/preview/AKM_Metareview.png?v=1776504642-701565'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/NUCLEAR NIGHT/preview/M4_Carbine_Nuclear_Night.png?v=1776496830-508733',
  '/Skins%20data/NUCLEAR%20NIGHT/preview/M4_Carbine_Nuclear_Night.png?v=1776496830-508733',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'nuclear-night'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/NUCLEAR NIGHT/preview/M4_Carbine_Nuclear_Night.png?v=1776496830-508733'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/ONE SHOT/preview/M1A_SASS_ONE_SHOT.png?v=1776496854-348237',
  '/Skins%20data/ONE%20SHOT/preview/M1A_SASS_ONE_SHOT.png?v=1776496854-348237',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'one-shot'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/ONE SHOT/preview/M1A_SASS_ONE_SHOT.png?v=1776496854-348237'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/ONE SHOT/preview/M4_Carbine_ONE_SHOT.png?v=1776496896-407829',
  '/Skins%20data/ONE%20SHOT/preview/M4_Carbine_ONE_SHOT.png?v=1776496896-407829',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'one-shot'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/ONE SHOT/preview/M4_Carbine_ONE_SHOT.png?v=1776496896-407829'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/ONE SHOT/preview/Ruger_MK4_ONE_SHOT.png?v=1776497496-527203',
  '/Skins%20data/ONE%20SHOT/preview/Ruger_MK4_ONE_SHOT.png?v=1776497496-527203',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'one-shot'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/ONE SHOT/preview/Ruger_MK4_ONE_SHOT.png?v=1776497496-527203'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/OwO TOO/preview/MCX_Spear_OwO_too.png?v=1776504269-875021',
  '/Skins%20data/OwO%20TOO/preview/MCX_Spear_OwO_too.png?v=1776504269-875021',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'owo-too'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/OwO TOO/preview/MCX_Spear_OwO_too.png?v=1776504269-875021'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/OwO TOO/preview/MP_40_OwO_too.png?v=1776503342-610106',
  '/Skins%20data/OwO%20TOO/preview/MP_40_OwO_too.png?v=1776503342-610106',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'owo-too'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/OwO TOO/preview/MP_40_OwO_too.png?v=1776503342-610106'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/PSVR 2 LAUNCH/preview/FAMAS_PSVR_2_LAUNCH.png?v=1776490817-509570',
  '/Skins%20data/PSVR%202%20LAUNCH/preview/FAMAS_PSVR_2_LAUNCH.png?v=1776490817-509570',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'psvr-2-launch'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/PSVR 2 LAUNCH/preview/FAMAS_PSVR_2_LAUNCH.png?v=1776490817-509570'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/PVE TEAM TACTICS/preview/Tapco SKS PVE TEAM TACTICS.png?v=1776496977-215253',
  '/Skins%20data/PVE%20TEAM%20TACTICS/preview/Tapco%20SKS%20PVE%20TEAM%20TACTICS.png?v=1776496977-215253',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'pve-team-tactics'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/PVE TEAM TACTICS/preview/Tapco SKS PVE TEAM TACTICS.png?v=1776496977-215253'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/SAMURAI WEAPON PACK/preview/MP_5_Samurai.png?v=1776502371-1000860',
  '/Skins%20data/SAMURAI%20WEAPON%20PACK/preview/MP_5_Samurai.png?v=1776502371-1000860',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'samurai-weapon-pack'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/SAMURAI WEAPON PACK/preview/MP_5_Samurai.png?v=1776502371-1000860'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/SKIN TOO SOFT/preview/M16_SKIN_TOO_SOFT.png?v=1776491320-167868',
  '/Skins%20data/SKIN%20TOO%20SOFT/preview/M16_SKIN_TOO_SOFT.png?v=1776491320-167868',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'skin-too-soft'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/SKIN TOO SOFT/preview/M16_SKIN_TOO_SOFT.png?v=1776491320-167868'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/SKS TAPCO CHRISTMAS SPECIAL/preview/SKS_TAPCO_CHRISTMAS_SPECIAL.png?v=1776492030-321643',
  '/Skins%20data/SKS%20TAPCO%20CHRISTMAS%20SPECIAL/preview/SKS_TAPCO_CHRISTMAS_SPECIAL.png?v=1776492030-321643',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'sks-tapco-christmas-special'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/SKS TAPCO CHRISTMAS SPECIAL/preview/SKS_TAPCO_CHRISTMAS_SPECIAL.png?v=1776492030-321643'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/STEAM GOTY/preview/Desert_Eagle_STEAM_GOTY.png?v=1776518660-108072',
  '/Skins%20data/STEAM%20GOTY/preview/Desert_Eagle_STEAM_GOTY.png?v=1776518660-108072',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'steam-goty'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/STEAM GOTY/preview/Desert_Eagle_STEAM_GOTY.png?v=1776518660-108072'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/UwU/preview/Adventure_Backpack_Uwu.png?v=1776515326-643024',
  '/Skins%20data/UwU/preview/Adventure_Backpack_Uwu.png?v=1776515326-643024',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'uwu'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/UwU/preview/Adventure_Backpack_Uwu.png?v=1776515326-643024'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/UwU/preview/AKM_Uwu.png?v=1776503767-790189',
  '/Skins%20data/UwU/preview/AKM_Uwu.png?v=1776503767-790189',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'uwu'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/UwU/preview/AKM_Uwu.png?v=1776503767-790189'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/UwU/preview/Alpha_Secure_Container_Uwu.png?v=1776515771-204792',
  '/Skins%20data/UwU/preview/Alpha_Secure_Container_Uwu.png?v=1776515771-204792',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'uwu'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/UwU/preview/Alpha_Secure_Container_Uwu.png?v=1776515771-204792'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/UwU/preview/Altyn_Face_Mask_Uwu.png?v=1776515364-429334',
  '/Skins%20data/UwU/preview/Altyn_Face_Mask_Uwu.png?v=1776515364-429334',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'uwu'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/UwU/preview/Altyn_Face_Mask_Uwu.png?v=1776515364-429334'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/UwU/preview/ALTYN_Uwu.png?v=1776515344-314333',
  '/Skins%20data/UwU/preview/ALTYN_Uwu.png?v=1776515344-314333',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'uwu'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/UwU/preview/ALTYN_Uwu.png?v=1776515344-314333'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/UwU/preview/C1911_Uwu.png?v=1776501911-653681',
  '/Skins%20data/UwU/preview/C1911_Uwu.png?v=1776501911-653681',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'uwu'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/UwU/preview/C1911_Uwu.png?v=1776501911-653681'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/UwU/preview/Glock_17_Uwu.png?v=1776501964-564114',
  '/Skins%20data/UwU/preview/Glock_17_Uwu.png?v=1776501964-564114',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'uwu'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/UwU/preview/Glock_17_Uwu.png?v=1776501964-564114'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/UwU/preview/MP9_Uwu.png?v=1776501929-780523',
  '/Skins%20data/UwU/preview/MP9_Uwu.png?v=1776501929-780523',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'uwu'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/UwU/preview/MP9_Uwu.png?v=1776501929-780523'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/UwU/preview/Omega_Secure_Container_Uwu.png?v=1776515570-432409',
  '/Skins%20data/UwU/preview/Omega_Secure_Container_Uwu.png?v=1776515570-432409',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'uwu'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/UwU/preview/Omega_Secure_Container_Uwu.png?v=1776515570-432409'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/VALENTINE DAY SPECIAL/preview/AKIM_Valentineday.png?v=1776502916-688739',
  '/Skins%20data/VALENTINE%20DAY%20SPECIAL/preview/AKIM_Valentineday.png?v=1776502916-688739',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'valentine-day-special'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/VALENTINE DAY SPECIAL/preview/AKIM_Valentineday.png?v=1776502916-688739'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/X11 CAMO – BLUE TIGER/preview/Desert_Eagle_X11_Camo_Blue_Tiger.png?v=1776518495-121108',
  '/Skins%20data/X11%20CAMO%20%E2%80%93%20BLUE%20TIGER/preview/Desert_Eagle_X11_Camo_Blue_Tiger.png?v=1776518495-121108',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'x11-camo-blue-tiger'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/X11 CAMO – BLUE TIGER/preview/Desert_Eagle_X11_Camo_Blue_Tiger.png?v=1776518495-121108'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/X11 CAMO – GRASSLAND/preview/Desert_Eagle_X11_Camo_Grassland.png?v=1776518452-95166',
  '/Skins%20data/X11%20CAMO%20%E2%80%93%20GRASSLAND/preview/Desert_Eagle_X11_Camo_Grassland.png?v=1776518452-95166',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'x11-camo-grassland'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/X11 CAMO – GRASSLAND/preview/Desert_Eagle_X11_Camo_Grassland.png?v=1776518452-95166'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/X11 CAMO – HORNET/preview/Desert_Eagle_X11_Camo_Hornet.png?v=1776518410-133056',
  '/Skins%20data/X11%20CAMO%20%E2%80%93%20HORNET/preview/Desert_Eagle_X11_Camo_Hornet.png?v=1776518410-133056',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'x11-camo-hornet'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/X11 CAMO – HORNET/preview/Desert_Eagle_X11_Camo_Hornet.png?v=1776518410-133056'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/X11 CAMO – MILTECH/preview/Desert_Eagle_X11_Camo_Miltech.png?v=1776518479-98386',
  '/Skins%20data/X11%20CAMO%20%E2%80%93%20MILTECH/preview/Desert_Eagle_X11_Camo_Miltech.png?v=1776518479-98386',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'x11-camo-miltech'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/X11 CAMO – MILTECH/preview/Desert_Eagle_X11_Camo_Miltech.png?v=1776518479-98386'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/X11 CAMO – RED URBAN/preview/Desert_Eagle_X11_Camo_Red_Urban.png?v=1776518432-119588',
  '/Skins%20data/X11%20CAMO%20%E2%80%93%20RED%20URBAN/preview/Desert_Eagle_X11_Camo_Red_Urban.png?v=1776518432-119588',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'x11-camo-red-urban'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/X11 CAMO – RED URBAN/preview/Desert_Eagle_X11_Camo_Red_Urban.png?v=1776518432-119588'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/X11 CAMO – SHATTERED/preview/Desert_Eagle_X11_Camo_Shattered.png?v=1776519093-138846',
  '/Skins%20data/X11%20CAMO%20%E2%80%93%20SHATTERED/preview/Desert_Eagle_X11_Camo_Shattered.png?v=1776519093-138846',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'x11-camo-shattered'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/X11 CAMO – SHATTERED/preview/Desert_Eagle_X11_Camo_Shattered.png?v=1776519093-138846'
  );

insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)
select
  k.id,
  '__LEGACY_OWNER_USER_ID__'::uuid,
  'Legacy Archive',
  'legacy:Skins data/X11 CAMO – WASP/preview/Desert_Eagle_X11_Camo_Wasp.png?v=1776518466-122036',
  '/Skins%20data/X11%20CAMO%20%E2%80%93%20WASP/preview/Desert_Eagle_X11_Camo_Wasp.png?v=1776518466-122036',
  'approved',
  now(),
  '__LEGACY_OWNER_USER_ID__'::uuid
from public.skins k
where k.slug = 'x11-camo-wasp'
  and not exists (
    select 1
    from public.submissions s
    where s.storage_path = 'legacy:Skins data/X11 CAMO – WASP/preview/Desert_Eagle_X11_Camo_Wasp.png?v=1776518466-122036'
  );

