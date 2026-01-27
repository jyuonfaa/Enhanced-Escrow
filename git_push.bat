@echo off
echo --- GIT INIT --- > git_log.txt
git init >> git_log.txt 2>&1
echo --- GIT CONFIG --- >> git_log.txt
git config user.name "seedorftumba-dotcom" >> git_log.txt 2>&1
git config user.email "seedorftumba@gmail.com" >> git_log.txt 2>&1
echo --- GIT ADD --- >> git_log.txt
git add . >> git_log.txt 2>&1
echo --- GIT COMMIT --- >> git_log.txt
git commit -m "Initial commit: Enhanced Escrow system" >> git_log.txt 2>&1
echo --- GIT BRANCH --- >> git_log.txt
git branch -m main >> git_log.txt 2>&1
echo --- GIT REMOTE --- >> git_log.txt
git remote add origin https://github.com/seedorftumba-dotcom/Advanced-Escrow.git >> git_log.txt 2>&1
echo --- GIT PUSH --- >> git_log.txt
git push -u origin main >> git_log.txt 2>&1
echo --- DONE --- >> git_log.txt
