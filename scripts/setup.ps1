$ErrorActionPreference = "Stop"

if (!(Get-Command volta -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Volta..."

    winget install Volta.Volta -s winget

    $env:PATH += ";$env:LOCALAPPDATA\Volta\bin"
}

volta install node@22.15.1
volta install pnpm@10.3.0

pnpm install

Write-Host "Setup completed."