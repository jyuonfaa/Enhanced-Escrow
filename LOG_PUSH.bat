@echo off
echo Running git push at %TIME% > push_error_log.txt
git push -u origin main -f >> push_error_log.txt 2>&1
echo Exit Code: %ERRORLEVEL% >> push_error_log.txt
