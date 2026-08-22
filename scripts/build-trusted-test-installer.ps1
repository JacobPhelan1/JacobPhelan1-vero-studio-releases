$ErrorActionPreference = "Stop"
$signingMaterial = $null
try {
  $signingCertificate = Get-ChildItem Cert:\CurrentUser\My | Where-Object { $_.Subject -like "*CN=VERO Broadcasting LLC*" -and $_.HasPrivateKey -and $_.NotAfter -gt (Get-Date).AddDays(30) } | Select-Object -First 1
  if (-not $signingCertificate) {
    $signingMaterial = node scripts/generate-development-certificate.mjs | ConvertFrom-Json
    if ($LASTEXITCODE -ne 0) { throw "Development certificate generation failed." }
    $password = ConvertTo-SecureString $signingMaterial.password -AsPlainText -Force
    $signingCertificate = Import-PfxCertificate -FilePath $signingMaterial.pfx -Password $password -CertStoreLocation Cert:\CurrentUser\My -Exportable:$false
  }
  $publicCertificate = Join-Path $PSScriptRoot "..\release\VERO-Studio-Development.cer"
  Export-Certificate -Cert $signingCertificate -FilePath $publicCertificate -Force | Out-Null
  npm run test
  if ($LASTEXITCODE -ne 0) { throw "Tests failed." }
  npm run lint
  if ($LASTEXITCODE -ne 0) { throw "Lint failed." }
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Build failed." }
  npm run desktop:icon
  if ($LASTEXITCODE -ne 0) { throw "Icon generation failed." }
  $env:CSC_IDENTITY_AUTO_DISCOVERY = "true"
  npx electron-builder --win nsis --config electron-builder.trusted-test.yml
  if ($LASTEXITCODE -ne 0) { throw "Signed installer build failed." }
  $installer = Get-ChildItem ".\release\VERO-Studio-Setup-*.exe" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  Write-Output "SIGNED_INSTALLER=$($installer.FullName)"
  Write-Output "PUBLIC_CERTIFICATE=$publicCertificate"
}
finally {
  Remove-Item Env:CSC_IDENTITY_AUTO_DISCOVERY -ErrorAction SilentlyContinue
  if ($signingMaterial.pfx) { Remove-Item -LiteralPath $signingMaterial.pfx -Force -ErrorAction SilentlyContinue }
  Remove-Item -LiteralPath (Join-Path $PSScriptRoot "..\release\.signing\VERO-Studio-Development.pfx") -Force -ErrorAction SilentlyContinue
}
