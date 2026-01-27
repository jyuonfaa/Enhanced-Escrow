const { execSync } = require('child_process');
const fs = require('fs');

const logFile = 'git_node_log.txt';

function run(cmd) {
    console.log(`Running: ${cmd}`);
    fs.appendFileSync(logFile, `\n--- RUNNING: ${cmd} ---\n`);
    try {
        const output = execSync(cmd, { stdio: 'pipe' }).toString();
        fs.appendFileSync(logFile, output);
        return output;
    } catch (e) {
        fs.appendFileSync(logFile, `ERROR: ${e.message}\n${e.stderr ? e.stderr.toString() : ''}\n`);
        return null;
    }
}

fs.writeFileSync(logFile, 'Starting Git Push via Node\n');

run('git init');
run('git config user.name "seedorftumba-dotcom"');
run('git config user.email "seedorftumba@gmail.com"');
run('git add .');
run('git commit -m "Initial commit: Enhanced Escrow system"');
run('git branch -m main');
run('git remote add origin https://github.com/seedorftumba-dotcom/Advanced-Escrow.git');
run('git push -u origin main');

console.log('Done. Check git_node_log.txt');
