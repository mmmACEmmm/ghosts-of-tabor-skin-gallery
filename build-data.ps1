$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$base = Join-Path $workspace "Skins data"
$outDir = Join-Path $workspace "data"

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

function Normalize-ImportedText {
  param(
    [string]$Value
  )

  if ($null -eq $Value) {
    return $null
  }

  if ($Value -match "[Ãâ]") {
    try {
      $bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($Value)
      return [System.Text.Encoding]::UTF8.GetString($bytes)
    } catch {
      return $Value
    }
  }

  return $Value
}

if (-not (Test-Path $base)) {
  throw "Could not find the 'Skins data' folder at $base"
}

New-Item -ItemType Directory -Force -Path $outDir | Out-Null
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
    coverImage = if ($rootImages.Count -gt 0) { Get-RelativeWebPath $rootImages[0].FullName $workspace } else { $null }
    galleryImages = @($previewImages | ForEach-Object { Get-RelativeWebPath $_.FullName $workspace })
    hasGallery = $previewImages.Count -gt 0
    hasPlaceholderPreview = @($previewImages | Where-Object { $_.Name -match "placeholder" }).Count -gt 0
    infoPath = if (Test-Path $infoPath) { Get-RelativeWebPath $infoPath $workspace } else { $null }
  }
}

$json = $data | ConvertTo-Json -Depth 5
Set-Content -Path (Join-Path $outDir "skins.json") -Value $json -Encoding UTF8
Set-Content -Path (Join-Path $outDir "skins-data.js") -Value ("window.SKIN_DATA = " + $json + ";") -Encoding UTF8

Write-Output ("Rebuilt data files for {0} skin packs." -f $data.Count)
