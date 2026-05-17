[CmdletBinding()]
param(
  [string]$SiteUrl = 'https://dreamexpressbd.com.bd/',
  [string]$StatePath = '',
  [switch]$ResetState,
  [switch]$NoUpdateState
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($StatePath)) {
  $StatePath = Join-Path $PSScriptRoot '..\.live-deploy-snapshot.json'
}

function Get-NormalizedSiteUrl {
  param([string]$Url)

  $uri = [System.Uri]$Url
  return $uri.AbsoluteUri.TrimEnd('/') + '/'
}

function Invoke-WebRequestSafe {
  param(
    [string]$Uri,
    [string]$Method = 'Get'
  )

  return Invoke-WebRequest -UseBasicParsing -Uri $Uri -Method $Method -Headers @{ 'Cache-Control' = 'no-cache' }
}

function Join-SiteAssetUrl {
  param(
    [string]$BaseUrl,
    [string]$AssetName
  )

  return [System.Uri]::new($BaseUrl, $AssetName).AbsoluteUri
}

function Get-FirstRegexMatchValue {
  param(
    [string]$Content,
    [string]$Pattern
  )

  $match = [regex]::Match($Content, $Pattern)
  if ($match.Success) {
    return $match.Value
  }

  return ''
}

function Get-FirstChunkReference {
  param(
    [string]$IndexHtml,
    [string]$MainContent
  )

  $fromMain = Get-FirstRegexMatchValue -Content $MainContent -Pattern 'chunk-[A-Z0-9]+\.js'
  if (-not [string]::IsNullOrWhiteSpace($fromMain)) {
    return $fromMain
  }

  return Get-FirstRegexMatchValue -Content $IndexHtml -Pattern 'chunk-[A-Z0-9]+\.js'
}

function Get-LiveSnapshot {
  param([string]$NormalizedSiteUrl)

  $indexResponse = Invoke-WebRequestSafe -Uri $NormalizedSiteUrl
  $main = Get-FirstRegexMatchValue -Content $indexResponse.Content -Pattern 'main-[A-Z0-9]+\.js'
  if ([string]::IsNullOrWhiteSpace($main)) {
    throw "Could not find a hashed main bundle in $NormalizedSiteUrl"
  }

  $mainResponse = Invoke-WebRequestSafe -Uri (Join-SiteAssetUrl -BaseUrl $NormalizedSiteUrl -AssetName $main)
  $sampleChunk = Get-FirstChunkReference -IndexHtml $indexResponse.Content -MainContent $mainResponse.Content

  return [pscustomobject]@{
    capturedAt          = [datetime]::UtcNow.ToString('o')
    siteUrl             = $NormalizedSiteUrl
    main                = $main
    sampleChunk         = $sampleChunk
    cacheControl        = $indexResponse.Headers['Cache-Control']
    contentType         = $indexResponse.Headers['Content-Type']
  }
}

function Get-AssetStatusCode {
  param(
    [string]$BaseUrl,
    [string]$AssetName
  )

  if ([string]::IsNullOrWhiteSpace($AssetName)) {
    return ''
  }

  try {
    return (Invoke-WebRequestSafe -Uri (Join-SiteAssetUrl -BaseUrl $BaseUrl -AssetName $AssetName) -Method 'Head').StatusCode
  }
  catch {
    if ($_.Exception.Response) {
      return $_.Exception.Response.StatusCode.value__
    }

    return $_.Exception.Message
  }
}

function Read-StateFile {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    return $null
  }

  return Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json
}

function Write-StateFile {
  param(
    [string]$Path,
    [object]$Snapshot
  )

  $directory = Split-Path -Path $Path -Parent
  if (-not [string]::IsNullOrWhiteSpace($directory) -and -not (Test-Path -LiteralPath $directory)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
  }

  $Snapshot | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath $Path -Encoding utf8
}

$normalizedSiteUrl = Get-NormalizedSiteUrl $SiteUrl

if ($ResetState -and (Test-Path -LiteralPath $StatePath)) {
  Remove-Item -LiteralPath $StatePath -Force
}

$previousSnapshot = Read-StateFile $StatePath
$currentSnapshot = Get-LiveSnapshot $normalizedSiteUrl

if ($null -eq $previousSnapshot) {
  Write-StateFile -Path $StatePath -Snapshot $currentSnapshot

  [pscustomobject]@{
    Mode                = 'Initialized'
    SiteUrl             = $currentSnapshot.siteUrl
    CurrentMain         = $currentSnapshot.main
    CurrentSampleChunk  = $currentSnapshot.sampleChunk
    CacheControl        = $currentSnapshot.cacheControl
    StatePath           = $StatePath
  } | Format-List

  return
}

$previousMainStatus = Get-AssetStatusCode -BaseUrl $normalizedSiteUrl -AssetName $previousSnapshot.main
$previousChunkStatus = Get-AssetStatusCode -BaseUrl $normalizedSiteUrl -AssetName $previousSnapshot.sampleChunk
$currentMainChanged = $currentSnapshot.main -ne $previousSnapshot.main

if (-not $NoUpdateState) {
  Write-StateFile -Path $StatePath -Snapshot $currentSnapshot
}

[pscustomobject]@{
  Mode                      = 'Verified'
  SiteUrl                   = $currentSnapshot.siteUrl
  PreviousMain              = $previousSnapshot.main
  CurrentMain               = $currentSnapshot.main
  CurrentMainChanged        = $currentMainChanged
  PreviousMainStatus        = $previousMainStatus
  PreviousSampleChunk       = $previousSnapshot.sampleChunk
  PreviousSampleChunkStatus = $previousChunkStatus
  CacheControl              = $currentSnapshot.cacheControl
  ContentType               = $currentSnapshot.contentType
  StateUpdated              = (-not $NoUpdateState)
  StatePath                 = $StatePath
} | Format-List
