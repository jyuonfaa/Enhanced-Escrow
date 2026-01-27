@echo off
echo --- Starting Enhanced Escrow Git Push ---
git init
git config user.name "seedorftumba-dotcom"
git config user.email "seedorftumba@gmail.com"
git add .
git commit -m "Initial commit: Enhanced Escrow system"
git branch -m main
git remote add origin https://github.com/seedorftumba-dotcom/enhanced-escrow.git
git push -u origin main -f
echo --- Done! Please check your GitHub repository ---
pause
