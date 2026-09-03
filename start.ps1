# MediKiosk Startup Script
Write-Host "Starting MediKiosk..." -ForegroundColor Cyan
Write-Host "Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\HP\.gemini\antigravity\scratch\medikiosk\server'; node index.js"
Start-Sleep -Seconds 3
Write-Host "Starting Frontend Client..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\HP\.gemini\antigravity\scratch\medikiosk\client'; npm run dev"
Write-Host ""
Write-Host "MediKiosk is starting up!" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host "Backend:  http://localhost:5000" -ForegroundColor Yellow
Write-Host ""
Write-Host "Demo Login Credentials:" -ForegroundColor Cyan
Write-Host "  Patient: patient@medikiosk.com / Patient@123" -ForegroundColor White
Write-Host "  Doctor:  doctor@medikiosk.com / Doctor@123" -ForegroundColor White
Write-Host "  Admin:   admin@medikiosk.com / Admin@123" -ForegroundColor White
