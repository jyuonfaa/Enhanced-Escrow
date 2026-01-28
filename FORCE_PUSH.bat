@echo off
echo --- Force Updating GitHub ---
git add .
git commit -m "Fix: Remove Windows-specific dependencies and lock file"
git push origin main -f
echo --- Done! Please check Vercel now ---
pause
