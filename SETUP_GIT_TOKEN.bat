@echo off
echo.
echo ===========================================
echo       GitHub Authentication Setup
echo ===========================================
echo.
echo Please enter your GitHub Personal Access Token (PAT).
echo (You can get one from: https://github.com/settings/tokens)
echo.

set /p TOKEN="Enter Token: "

if "%TOKEN%"=="" (
    echo Error: Token cannot be empty.
    pause
    exit /b
)

echo.
echo --- Updating Git Remote URL ---
git remote set-url origin https://%TOKEN%@github.com/seedorftumba-dotcom/enhanced-escrow.git

echo --- Attempting to Push ---
git push origin main

echo.
echo --- Done! ---
echo If the push was successful, check Vercel for the build status.
echo.
pause
