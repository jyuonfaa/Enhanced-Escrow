@echo off
echo --- Fixing GitHub Credential Conflict ---
echo Your system is currently trying to use the account "allansey".
echo We will now switch it to "seedorftumba-dotcom".
echo.

:: Update the remote URL to include the username
git remote set-url origin https://seedorftumba-dotcom@github.com/seedorftumba-dotcom/enhanced-escrow.git

echo A login window or prompt should appear now. 
echo IMPORTANT: If it asks for a "Password", use your GitHub Personal Access Token (PAT).
echo.
git push -u origin main -f

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [STILL FAILING?] If it still says denied, you may need to clear "allansey" 
    echo from your Windows Credential Manager:
    echo 1. Search for "Credential Manager" in Windows.
    echo 2. Go to "Windows Credentials".
    echo 3. Find "git:https://github.com" and remove it.
    echo 4. Run this script again.
) else (
    echo.
    echo [SUCCESS] Push completed!
)

pause
