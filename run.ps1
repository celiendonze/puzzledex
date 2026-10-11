Write-Host "==========================================" -ForegroundColor DarkYellow
Write-Host "       Lancement de PuzzleDex             " -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor DarkYellow

# Verifier si dist existe dans frontend
if (-not (Test-Path "frontend\dist")) {
    Write-Host "`nCompilation du frontend React..." -ForegroundColor Cyan
    Set-Location frontend
    npm.cmd run build
    Set-Location ..
}

Write-Host "`nDemarrage du serveur PuzzleDex sur http://localhost:8080..." -ForegroundColor Green
Write-Host "Appuyez sur Ctrl+C pour arreter le serveur.`n" -ForegroundColor DarkGray

Set-Location backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8080
Set-Location ..
