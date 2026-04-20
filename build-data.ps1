$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$base = Join-Path $workspace "Skins data"
$outDir = Join-Path $workspace "data"
$supabaseDir = Join-Path $workspace "supabase"
$seedDir = Join-Path $supabaseDir "seed"

function Get-RelativeWebPath {
  param(
    [string]$FullPath,
    [string]$Root
  )

  if (-not $FullPath) {
    return $null
  }

  $relative = $FullPath.Substring($Root.Length).TrimStart("\")
  return ($relative -replace "\\", "/")
}

function Get-RelativeWebAssetPath {
  param(
    [System.IO.FileInfo]$File,
    [string]$Root
  )

  if ($null -eq $File) {
    return $null
  }

  $relative = Get-RelativeWebPath -FullPath $File.FullName -Root $Root
  $stamp = [DateTimeOffset]::new($File.LastWriteTimeUtc).ToUnixTimeSeconds()
  return "${relative}?v=$stamp-$($File.Length)"
}

function ConvertTo-EncodedPublicUrl {
  param(
    [string]$RelativePath
  )

  if (-not $RelativePath) {
    return $null
  }

  $queryIndex = $RelativePath.IndexOf("?")
  $basePath = if ($queryIndex -ge 0) { $RelativePath.Substring(0, $queryIndex) } else { $RelativePath }
  $query = if ($queryIndex -ge 0) { $RelativePath.Substring($queryIndex) } else { "" }

  $encodedPath = ($basePath -split "/") | ForEach-Object {
    [System.Uri]::EscapeDataString($_)
  }

  return "/" + (($encodedPath -join "/") + $query)
}

function Normalize-ImportedText {
  param(
    [string]$Value
  )

  if ($null -eq $Value) {
    return $null
  }

  if ($Value -match "[\xC3\xC2]") {
    try {
      $bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($Value)
      return [System.Text.Encoding]::UTF8.GetString($bytes)
    } catch {
      return $Value
    }
  }

  return $Value
}

function ConvertTo-SqlLiteral {
  param(
    [AllowNull()]
    [object]$Value
  )

  if ($null -eq $Value) {
    return "null"
  }

  $text = [string]$Value
  $escaped = $text -replace "'", "''"
  return "'$escaped'"
}

if (-not (Test-Path $base)) {
  throw "Could not find the 'Skins data' folder at $base"
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
New-Item -ItemType Directory -Force -Path $seedDir | Out-Null
$folders = Get-ChildItem $base -Directory | Sort-Object Name

$data = foreach ($folder in $folders) {
  $infoPath = Join-Path $folder.FullName "Information.txt"
  $rootImages = @(Get-ChildItem $folder.FullName -File | Where-Object { $_.Extension -match "^\.(png|jpe?g|webp)$" } | Sort-Object Name)
  $previewDir = Join-Path $folder.FullName "preview"
  $previewImages = if (Test-Path $previewDir) {
    @(Get-ChildItem $previewDir -File | Where-Object { $_.Extension -match "^\.(png|jpe?g|webp)$" } | Sort-Object Name)
  } else {
    @()
  }

  $rawLines = if (Test-Path $infoPath) { @(Get-Content $infoPath -Encoding utf8) } else { @() }
  $lines = @($rawLines | ForEach-Object { (Normalize-ImportedText $_).Trim() })
  $nonEmpty = @($lines | Where-Object { $_ -ne "" })

  $sourceType = $null
  $sourceValue = $null

  if ($nonEmpty.Count -gt 0 -and $nonEmpty[0] -match "^(?<key>[^:]+):\s*(?<value>.*)$") {
    $sourceType = $matches["key"].Trim()
    $sourceValue = $matches["value"].Trim()
  }

  $compatibleItems = @()
  $compatIndex = -1
  for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "^Compatible Items\b") {
      $compatIndex = $i
      break
    }
  }

  if ($compatIndex -ge 0 -and $compatIndex + 1 -lt $lines.Count) {
    $compatibleItems = @($lines[($compatIndex + 1)..($lines.Count - 1)] | Where-Object { $_ -ne "" })
  }

  [PSCustomObject]@{
    name = $folder.Name
    slug = ($folder.Name.ToLower() -replace "[^a-z0-9]+", "-").Trim("-")
    sourceType = $sourceType
    sourceValue = $sourceValue
    sourceLabel = if ($sourceType -and $sourceValue) { "${sourceType}: $sourceValue" } elseif ($sourceType) { $sourceType } else { "Unknown source" }
    compatibleItems = $compatibleItems
    itemCount = $compatibleItems.Count
    coverImage = if ($rootImages.Count -gt 0) { Get-RelativeWebAssetPath -File $rootImages[0] -Root $workspace } else { $null }
    galleryImages = @($previewImages | ForEach-Object { Get-RelativeWebAssetPath -File $_ -Root $workspace })
    hasGallery = $previewImages.Count -gt 0
    hasPlaceholderPreview = @($previewImages | Where-Object { $_.Name -match "placeholder" }).Count -gt 0
    infoPath = if (Test-Path $infoPath) { Get-RelativeWebPath $infoPath $workspace } else { $null }
  }
}

$json = $data | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $outDir "skins.json") -Value $json -Encoding UTF8
Set-Content -Path (Join-Path $outDir "skins-data.js") -Value ("window.SKIN_DATA = " + $json + ";") -Encoding UTF8

$skinSeedLines = @(
  "-- Seed the public.skins table from the local static metadata."
  "insert into public.skins (slug, name)"
  "values"
)

$skinValueLines = @()
foreach ($entry in $data) {
  $skinValueLines += "  (" + (ConvertTo-SqlLiteral $entry.slug) + ", " + (ConvertTo-SqlLiteral $entry.name) + ")"
}

$skinSeedLines += ($skinValueLines -join ",`n")
$skinSeedLines += "on conflict (slug) do update"
$skinSeedLines += "set name = excluded.name;"
$skinSeedLines += ""
Set-Content -Path (Join-Path $seedDir "skins.sql") -Value ($skinSeedLines -join "`n") -Encoding UTF8

$legacyOwnerPlaceholder = "__LEGACY_OWNER_USER_ID__"
$legacyManifest = @()
$legacySqlLines = @(
  "-- Replace __LEGACY_OWNER_USER_ID__ with a real Supabase auth user id after your first Discord login."
  "-- These rows keep the existing repo-hosted preview images and register them as already-approved submissions."
  ""
)

foreach ($entry in $data) {
  $usableGallery = @($entry.galleryImages | Where-Object { $_ -and $_ -notmatch "placeholder" })

  foreach ($galleryImage in $usableGallery) {
    $publicUrl = ConvertTo-EncodedPublicUrl -RelativePath $galleryImage
    $storagePath = "legacy:$galleryImage"

    $legacyManifest += [PSCustomObject]@{
      skin_slug = $entry.slug
      skin_name = $entry.name
      storage_path = $storagePath
      public_url = $publicUrl
      submitted_discord_name = "Legacy Archive"
      status = "approved"
    }

    $legacySqlLines += @(
      "insert into public.submissions (skin_id, submitted_by, submitted_discord_name, storage_path, public_url, status, reviewed_at, reviewed_by)"
      "select"
      "  k.id,"
      "  '$legacyOwnerPlaceholder'::uuid,"
      "  'Legacy Archive',"
      "  " + (ConvertTo-SqlLiteral $storagePath) + ","
      "  " + (ConvertTo-SqlLiteral $publicUrl) + ","
      "  'approved',"
      "  now(),"
      "  '$legacyOwnerPlaceholder'::uuid"
      "from public.skins k"
      "where k.slug = " + (ConvertTo-SqlLiteral $entry.slug)
      "  and not exists ("
      "    select 1"
      "    from public.submissions s"
      "    where s.storage_path = " + (ConvertTo-SqlLiteral $storagePath)
      "  );"
      ""
    )
  }
}

Set-Content -Path (Join-Path $seedDir "legacy-approved-previews.template.sql") -Value ($legacySqlLines -join "`n") -Encoding UTF8
Set-Content -Path (Join-Path $seedDir "legacy-preview-manifest.json") -Value (($legacyManifest | ConvertTo-Json -Depth 4)) -Encoding UTF8

Write-Output ("Rebuilt data files for {0} skin packs, plus Supabase seed files." -f $data.Count)
