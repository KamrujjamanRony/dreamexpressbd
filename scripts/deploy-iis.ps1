[CmdletBinding()]
param(
  [string]$SourcePath = (Join-Path $PSScriptRoot '..\dist\dreamexpressbd\browser'),
  [Parameter(Mandatory = $true)]
  [string]$DestinationPath,
  [int]$RetentionHours = 168,
  [int]$MaxGenerations = 30
)

$ErrorActionPreference = 'Stop'

function Resolve-ExistingPath {
  param([string]$Path)

  return (Resolve-Path -LiteralPath $Path).Path
}

function Ensure-Directory {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    New-Item -ItemType Directory -Path $Path -Force | Out-Null
  }
}

function Get-AssetFileName {
  param([string]$AssetUrl)

  if ([string]::IsNullOrWhiteSpace($AssetUrl)) {
    return ''
  }

  try {
    return [System.IO.Path]::GetFileName(([System.Uri]$AssetUrl).AbsolutePath)
  }
  catch {
    $cleanPath = $AssetUrl.Split('?')[0]
    return [System.IO.Path]::GetFileName($cleanPath)
  }
}

function Get-HashedAssetNamesFromHtml {
  param([string]$Html)

  if ([string]::IsNullOrWhiteSpace($Html)) {
    return @()
  }

  $matches = [System.Text.RegularExpressions.Regex]::Matches(
    $Html,
    '(?:src|href)=["'']([^"'']+\.(?:js|css)(?:\?[^"'']*)?)["'']',
    [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
  )

  $assetNames = foreach ($match in $matches) {
    $assetName = Get-AssetFileName $match.Groups[1].Value
    if ($assetName -match '^(?:main|styles|chunk)-.+\.(?:js|css)$') {
      $assetName
    }
  }

  if (@($assetNames).Count -eq 0) {
    $assetNames = foreach ($match in [System.Text.RegularExpressions.Regex]::Matches(
        $Html,
        '(?:main|styles|chunk)-[A-Z0-9]+\.(?:js|css)',
        [System.Text.RegularExpressions.RegexOptions]::IgnoreCase
      )) {
      $match.Value
    }
  }

  return @($assetNames | Sort-Object -Unique)
}

function New-GenerationEntry {
  param(
    [string[]]$Assets,
    [string]$DeployedAt
  )

  $normalizedAssets = @($Assets | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Sort-Object -Unique)
  if ($normalizedAssets.Count -eq 0) {
    return $null
  }

  return [pscustomobject]@{
    deployedAt = $DeployedAt
    assets     = $normalizedAssets
    signature  = ($normalizedAssets -join '|')
  }
}

function Get-ManifestEntries {
  param([string]$ManifestPath)

  if (-not (Test-Path -LiteralPath $ManifestPath)) {
    return @()
  }

  $manifest = Get-Content -LiteralPath $ManifestPath -Raw | ConvertFrom-Json
  $entries = @()

  foreach ($entry in @($manifest.generations)) {
    $normalized = New-GenerationEntry -Assets @($entry.assets) -DeployedAt $entry.deployedAt
    if ($null -ne $normalized) {
      $entries += $normalized
    }
  }

  return $entries
}

function Merge-GenerationEntries {
  param(
    [object[]]$Entries,
    [int]$MaxCount
  )

  $merged = @()
  $seen = @{}

  foreach ($entry in $Entries) {
    if ($null -eq $entry -or [string]::IsNullOrWhiteSpace($entry.signature)) {
      continue
    }

    if ($seen.ContainsKey($entry.signature)) {
      continue
    }

    $seen[$entry.signature] = $true
    $merged += $entry

    if ($merged.Count -ge $MaxCount) {
      break
    }
  }

  return $merged
}

function Invoke-Robocopy {
  param(
    [string]$From,
    [string]$To,
    [string[]]$Arguments
  )

  & robocopy $From $To @Arguments | Out-Host

  if ($LASTEXITCODE -gt 7) {
    throw "robocopy failed with exit code $LASTEXITCODE"
  }
}

function Get-ProtectedAssets {
  param(
    [object[]]$Entries,
    [datetime]$CutoffUtc
  )

  $protected = @{}

  foreach ($entry in $Entries) {
    if ($null -eq $entry) {
      continue
    }

    $deployedAtUtc = ([datetimeoffset]$entry.deployedAt).UtcDateTime
    if ($deployedAtUtc -lt $CutoffUtc) {
      continue
    }

    foreach ($asset in @($entry.assets)) {
      $protected[$asset.ToLowerInvariant()] = $true
    }
  }

  return $protected
}

function Remove-StaleHashedAssets {
  param(
    [string]$Path,
    [hashtable]$ProtectedAssets,
    [datetime]$CutoffUtc
  )

  $removed = @()

  $files = Get-ChildItem -LiteralPath $Path -File | Where-Object {
    $_.Name -match '^(?:main|styles|chunk)-.+\.(?:js|css)$'
  }

  foreach ($file in $files) {
    $key = $file.Name.ToLowerInvariant()
    if ($ProtectedAssets.ContainsKey($key)) {
      continue
    }

    if ($file.LastWriteTimeUtc -ge $CutoffUtc) {
      continue
    }

    Remove-Item -LiteralPath $file.FullName -Force
    $removed += $file.Name
  }

  return $removed
}

$resolvedSourcePath = Resolve-ExistingPath $SourcePath
Ensure-Directory $DestinationPath
$resolvedDestinationPath = Resolve-ExistingPath $DestinationPath

$sourceIndexPath = Join-Path $resolvedSourcePath 'index.html'
if (-not (Test-Path -LiteralPath $sourceIndexPath)) {
  throw "Source index.html was not found at $sourceIndexPath"
}

$manifestPath = Join-Path $resolvedDestinationPath '.deploy-asset-generations.json'
$currentTimestamp = [datetime]::UtcNow.ToString('o')
$currentGeneration = New-GenerationEntry -Assets (Get-HashedAssetNamesFromHtml (Get-Content -LiteralPath $sourceIndexPath -Raw)) -DeployedAt $currentTimestamp
if ($null -eq $currentGeneration) {
  throw 'Could not determine the current hashed asset set from the source index.html.'
}

$existingEntries = Get-ManifestEntries $manifestPath
$destinationIndexPath = Join-Path $resolvedDestinationPath 'index.html'
$bootstrapEntries = @($currentGeneration)

if ($existingEntries.Count -eq 0 -and (Test-Path -LiteralPath $destinationIndexPath)) {
  $destinationIndex = Get-Content -LiteralPath $destinationIndexPath -Raw
  $existingIndexGeneration = New-GenerationEntry -Assets (Get-HashedAssetNamesFromHtml $destinationIndex) -DeployedAt ((Get-Item -LiteralPath $destinationIndexPath).LastWriteTimeUtc.ToString('o'))
  if ($null -ne $existingIndexGeneration) {
    $bootstrapEntries += $existingIndexGeneration
  }
}

$manifestEntries = Merge-GenerationEntries -Entries ($bootstrapEntries + $existingEntries) -MaxCount $MaxGenerations
$cleanupCutoffUtc = [datetime]::UtcNow.AddHours(-1 * $RetentionHours)

Invoke-Robocopy -From $resolvedSourcePath -To $resolvedDestinationPath -Arguments @('/E', '/R:2', '/W:2', '/NFL', '/NDL', '/NP', '/XF', 'index.html', 'web.config')
Invoke-Robocopy -From $resolvedSourcePath -To $resolvedDestinationPath -Arguments @('/R:2', '/W:2', '/NFL', '/NDL', '/NP', 'index.html', 'web.config')

$manifestContent = [pscustomobject]@{
  updatedAt      = $currentTimestamp
  retentionHours = $RetentionHours
  generations    = $manifestEntries
} | ConvertTo-Json -Depth 6

Set-Content -LiteralPath $manifestPath -Value $manifestContent -Encoding utf8

$protectedAssets = Get-ProtectedAssets -Entries $manifestEntries -CutoffUtc $cleanupCutoffUtc
foreach ($asset in @($currentGeneration.assets)) {
  $protectedAssets[$asset.ToLowerInvariant()] = $true
}

$removedAssets = Remove-StaleHashedAssets -Path $resolvedDestinationPath -ProtectedAssets $protectedAssets -CutoffUtc $cleanupCutoffUtc

Write-Host ''
Write-Host "Deployed assets from $resolvedSourcePath to $resolvedDestinationPath"
Write-Host "Protected hashed assets: $($protectedAssets.Count)"
Write-Host "Removed stale hashed assets: $($removedAssets.Count)"
if ($removedAssets.Count -gt 0) {
  Write-Host ($removedAssets -join [Environment]::NewLine)
}
