@echo off
echo --- Adding modified files ---
git add frontend/package.json frontend/src/main.tsx frontend/vercel.json
echo --- Committing changes ---
git commit -m "Fix: build issue and 404 refresh error"
echo --- Pushing to GitHub ---
git push origin main
echo --- Done! ---
pause
