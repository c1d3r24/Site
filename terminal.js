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
    name: "SecureLogin",
    desc: "Password‑less authentication demo (Node + WebAuthn)",
    url: "https://github.com/your‑username/SecureLogin"
  },
  {
    name: "PhishSim",
    desc: "Interactive phishing‑simulation platform",
    url: "https://github.com/your‑username/PhishSim"
  },
  {
    name: "CryptoVault",
    desc: "Simple client‑side encrypted vault (AES‑GCM)",
    url: "https://github.com/your‑username/CryptoVault"
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
      println(`I'm a recent Cyber‑Security graduate passionate about secure coding,`);
      println(`red‑team tactics, and privacy‑first web design.`);
      break;
    case 'projects':
      PROJECTS.forEach(p => {
        println(`${p.name} – ${p.desc}`);
        println(`   ${p.url}`);
      });
      break;
    case 'blog':
      println('Opening my blog...');
      // Open in a new tab (works on static pages)
      window.open('https://your‑username.github.io/blog/', '_blank');
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

