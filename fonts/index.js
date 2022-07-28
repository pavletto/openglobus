const { spawn } = require('child_process');
const path = require('path');

const arg1 = process.argv[2] || 'arial';

const npx = spawn(`npx`, `--yes msdf-bmfont-xml --reuse -i ${path.join(__dirname, 'charset.txt')} -m 1024,1024 -f json -o ${path.join(__dirname, arg1 + '.png')} -s 42 -r 14 -p 1 -t msdf ${path.join(__dirname, arg1)}`.split(' '));
npx.stdout.on("data", data => {
    console.log(`${data}`);
});

npx.stderr.on("data", data => {
    console.log(`stderr: ${data}`);
});

npx.on('error', (error) => {
    console.log(`error: ${error.message}`);
});

npx.on("close", code => {
    console.log(`child process exited with code ${code}`);
});