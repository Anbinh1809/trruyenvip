@echo off
title TruyenVip System Launcher
cd /d c:\truyenvip
echo Dang khoi dong TruyenVip...

start "Titan Crawler Backend" cmd /c "npm run crawler:worker"
start "TruyenVip Web" cmd /k "npm run dev"

echo Da khoi dong ca Frontend Web lan Backend Crawler!
pause
