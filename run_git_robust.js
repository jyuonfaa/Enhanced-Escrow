const { spawnSync } = require('child_process');
const fs = require('fs');

const GIT_PATH = 'C:\\Program Files\\Git\\cmd\\git.exe';
const LOG_FILE = 'git_execution_log.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

function runGit(args) {
    log(`> git ${args.join(' ')}`);
    const result = spawnSync(GIT_PATH, args, {
        cwd: 'c:\\Users\\hp\\Desktop\\enhanced-escrow',
        env: process.env,
        encoding: 'utf-8'
    });

    if (result.stdout) log(result.stdout);
    if (result.stderr) log('STDERR: ' + result.stderr);
    if (result.status !== 0) log(`Exited with code ${result.status}`);
    return result.status === 0;
}

fs.writeFileSync(LOG_FILE, '--- Starting Git Execution ---\n');

runGit(['init']);
runGit(['config', 'user.name', 'seedorftumba-dotcom']);
runGit(['config', 'user.email', 'seedorftumba@gmail.com']);
runGit(['add', '.']);
runGit(['commit', '-m', 'Initial commit: Enhanced Escrow system']);
runGit(['branch', '-m', 'main']);
runGit(['remote', 'remove', 'origin']); // Clean up any old ones
runGit(['remote', 'add', 'origin', 'https://github.com/seedorftumba-dotcom/enhanced-escrow.git']);
runGit(['push', '-u', 'origin', 'main', '-f']);

log('--- Done ---');
