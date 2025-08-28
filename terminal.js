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

// ==== EXTRA FUNCTIONS =======================================================

/**
 * Emit an OSC 8 hyperlink that XTerm.js renders as a clickable <a>.
 *
 * @param {string} label   Visible text for the link.
 * @param {string} url     Destination URL.
 */
function writeLinkOSC(label, url) {
  // ESC ]8;;URL BEL LABEL ESC ]8;; BEL
  const esc = '\x1b]8;;' + url + '\x07' + label + '\x1b]8;;\x07';
  term.write(esc);
}

/**
 * Inject raw HTML into the *last* terminal row (fallback).
 *
 * @param {string} html   Safe HTML (no inline style – use CSS classes).
 */
function injectIntoLastRow(html) {
  term.writeln('');                 // ensure a new <div> exists
  setTimeout(() => {
    const rows = document.querySelectorAll('.xterm .xterm-rows div');
    const last = rows[rows.length - 1];
    if (last) last.innerHTML = html;
  }, 0);
}

/**
 * Print a coloured label followed by a clickable URL.
 *
 * @param {string} label          Text that appears *before* the link
 *                                 (e.g. "Link:", "🔗 View repo").
 * @param {string} url            Destination URL.
 * @param {Object} [opts]         Optional styling options.
 * @param {string} [opts.labelColor]   CSS colour name or hex for the label
 *                                      (defaults to a neutral gray).
 * @param {string} [opts.urlColor]     CSS colour name or hex for the clickable URL
 *                                      (defaults to the theme’s accent blue).
 *
 * @example
 * // Simple usage – defaults (gray label, blue link)
 * styledPrintLink('Link:', 'https://github.com/me/project');
 *
 * // Custom colours
 * styledPrintLink('Docs →', 'https://my.site/docs', {
 *   labelColor: '#777',   // dark‑gray label
 *   urlColor:   '#ff6600' // orange link
 * });
 */
function styledPrintLink(label, url, opts = {}) {
  const {
    labelColor = '#777777',   // default gray for the label
    urlColor   = '#4da6ff'    // default bright‑blue for the link
  } = opts;

  // 1️⃣  Print the label (with ANSI colour)
  const labelEsc = `\x1b[38;2;${hexToRgb(labelColor)}m${label}\x1b[0m`;
  term.write(labelEsc + ' '); // space separates label from link

  // 2️⃣  Print the clickable URL.
  //    We want the *visible* part of the link to have the colour we chose.
  //    Because OSC 8 does not carry colour information, we wrap the
  //    label for the link in ANSI colour codes ourselves.
  const urlLabelEsc = `\x1b[38;2;${hexToRgb(urlColor)}m${url}\x1b[0m`;
  // Use the low‑level helper – it will emit the OSC 8 sequence.
  // The visible label we give it is already colour‑styled.
  try {
    // Some terminals (including XTerm.js) will honour the colour
    // codes that sit *inside* the OSC 8 payload.
    writeLinkOSC(urlLabelEsc, url);
  } catch (_) {
    // Fallback – inject a real <a> element with a CSS class.
    // The class will give it the desired colour.
    const html = `<a class="term-link" href="${url}" target="_blank"
                    style="color:${urlColor};text-decoration:none;">${url}</a>`;
    injectIntoLastRow(html);
  }

  // 3️⃣  Finish the line so the next output starts on a new line.
  term.write('\r\n');
}

/**
 * Convert a hex colour (e.g. "#4da6ff") to the three decimal components
 * required for the ANSI 24‑bit colour escape sequence.
 *
 * @param {string} hex  Hex colour, with or without leading "#".
 * @returns {string}   "R;G;B" (e.g. "77;166;255")
 */
function hexToRgb(hex) {
  // Remove leading #
  hex = hex.replace(/^#/, '');

  // Expand shorthand form (#abc -> #aabbcc)
  if (hex.length === 3) {
    hex = hex.split('').map(ch => ch + ch).join('');
  }

  const intVal = parseInt(hex, 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `${r};${g};${b}`;
}

// ==== COMMAND DEFINITIONS ===================================================
const HELP_TEXT = `Available commands:
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
  },
  {
    name: "Terminal Styled Portfolio",
    desc: "The code for this website",
    url: "https://github.com/c1d3r24/Site"
  }
];

// Simple helper to print a line with a trailing newline
function println(text = '') {
  term.write('\r\n');
  text.split('\n').forEach(line => {
    term.write(line + '\r\n');
  });
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
      println(`\x1b[93mI'm a recent Cyber‑Security graduate passionate about secure coding, red‑team tactics, and privacy‑first web design.\x1b[0m`);
      break;
    case 'projects':
      PROJECTS.forEach(p => {
        println(`\n\x1b[96m${p.name}\x1b[0m – ${p.desc}`);
        if (p.url) {
		styledPrintLink('Link: ', p.url, {
		});
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
  term.write('\r\nnik@portfolio:~$ ');
};


const commandHistory = [];
let historyIndex = -1;

term.onKey(({ key, domEvent }) => {
  const printable = !domEvent.ctrlKey && !domEvent.altKey && !domEvent.metaKey && domEvent.key.length === 1;

  if (domEvent.key === 'Enter') {
    execCommand(commandBuffer);
    if (commandBuffer.trim() !== '') {
      commandHistory.push(commandBuffer);
    }
    historyIndex = commandHistory.length;
    commandBuffer = '';
    term.prompt();
  } else if (domEvent.key === 'Backspace') {
    if (commandBuffer.length > 0) {
      commandBuffer = commandBuffer.slice(0, -1);
      term.write('\b \b');
    }
  } else if (domEvent.key === 'ArrowUp') {
    if (historyIndex > 0) {
      term.write('\x1b[2K\r> ');
      historyIndex--;
      commandBuffer = commandHistory[historyIndex];
      term.write(commandBuffer);
    }
  } else if (domEvent.key === 'ArrowDown') {
    if (historyIndex < commandHistory.length - 1) {
      term.write('\x1b[2K\r> ');
      historyIndex++;
      commandBuffer = commandHistory[historyIndex];
      term.write(commandBuffer);
    } else {
      term.write('\x1b[2K\r> ');
      historyIndex = commandHistory.length;
      commandBuffer = '';
    }
  } else if (printable) {
    commandBuffer += key;
    term.write(key);
  }
});



// ==== STARTUP MESSAGE ======================================================
term.writeln('Welcome to myConsole – a terminal‑styled portfolio.');
term.writeln('Type "help" for a list of commands.');
term.prompt();

