# MediKiosk Seed Script
Write-Host "Seeding MediKiosk demo data..." -ForegroundColor Cyan
Set-Location "C:\Users\HP\.gemini\antigravity\scratch\medikiosk\server"
node seedData.js
