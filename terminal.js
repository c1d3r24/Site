// ==== INITIALIZE XTERM ======================================================
const term = new Terminal({
  cursorBlink: true,
  theme: {
    background: '#000',
    foreground: '#0f0',
    cursor: '#0f0'
  },
  fontFamily: '"Fira Code", monospace',
  fontSize: 14,
});
const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

// Attach to DOM
term.open(document.getElementById('terminal-container'));
fitAddon.fit();               // size to container
window.addEventListener('resize', () => fitAddon.fit());

// ==== COMMAND DEFINITIONS ===================================================
const HELP_TEXT = `
Available commands:
  help            Show this help
  about           Who I am
  projects        List my open‑source projects
  blog            Open my technical blog
  clear           Clear the screen
  echo <msg>      Echo back a message
`;

const PROJECTS = [
  {
    name: "Python IDS/IPS",
    desc: "An IDS/IPS build entirely in python",
    //url: "https://github.com/c1d3r24/python-ids"
  }
];

// Simple helper to print a line with a trailing newline
function println(text = '') {
  term.writeln(text);
}

// Command dispatcher
function execCommand(raw) {
  const args = raw.trim().split(/\s+/);
  const cmd = args.shift()?.toLowerCase();

  switch (cmd) {
    case 'help':
      println(HELP_TEXT);
      break;
    case 'about':
      println(`\nI'm a recent Cyber‑Security graduate passionate about secure coding, red‑team tactics, and privacy‑first web design.`);
      break;
    case 'projects':
      PROJECTS.forEach(p => {
        println(`\n\n\x1b[96m${p.name}\x1b[0m – ${p.desc}`);
        if (p.url) {
		println(`\x1b[92m${p.url}\x1b[0m`);
	} else {
		println(`\x1b[30;43m  coming soon  \x1b[0m`);
	}
      });
      break;
    case 'blog':
      println('\nOpening my blog...');
      // Open in a new tab (works on static pages)
      window.open('https://nikcarlberg.com/blog/', '_blank');
      break;
    case 'clear':
      term.clear();
      break;
    case 'echo':
      println(args.join(' '));
      break;
    case '':
      // empty line – do nothing
      break;
    default:
      println(`command not found: ${cmd}`);
  }
}

// ==== INPUT HANDLING =======================================================
let commandBuffer = '';

term.prompt = () => {
  term.write('\r\n> ');
};

term.onData(e => {
  const printable = e.charCodeAt(0) >= 32 && e.charCodeAt(0) !== 127;

  if (e === '\r') {                // Enter
    execCommand(commandBuffer);
    commandBuffer = '';
    term.prompt();
  } else if (e === '\u007F') {    // Backspace (DEL)
    // Do not delete beyond the prompt
    if (commandBuffer.length > 0) {
      commandBuffer = commandBuffer.slice(0, -1);
      term.write('\b \b'); // erase char on screen
    }
  } else if (printable) {
    commandBuffer += e;
    term.write(e);
  }
});

// ==== STARTUP MESSAGE ======================================================
term.writeln('Welcome to myConsole – a terminal‑styled portfolio.');
term.writeln('Type "help" for a list of commands.');
term.prompt();

