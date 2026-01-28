@echo off
echo --- Enhanced Git Push Debugger ---
echo Attempting to push to: https://github.com/seedorftumba-dotcom/enhanced-escrow.git
echo.
git push -u origin main -f
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] The push failed with code %ERRORLEVEL%.
    echo Please look at the messages above. If it asks for a password, you must use a Personal Access Token.
) else (
    echo.
    echo [SUCCESS] The push seems to have completed successfully!
)
echo.
echo Press any key to close this window...
pause > nul
