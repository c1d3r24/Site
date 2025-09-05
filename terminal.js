// ==== INITIALIZE XTERM ======================================================
const COLORS = {
  asciiArt: '\x1b[38;2;0;255;106m',   // Neon Green (changed to green as you wanted)
  welcome: '\x1b[38;2;77;166;255m',   // Electric Blue
  info: '\x1b[38;2;255;209;102m',     // Warm Yellow
  prompt: '\x1b[38;2;0;230;118m',     // Neon Green (same as asciiArt green)
  error: '\x1b[38;2;255;85;85m',      // Bright Red
  reset: '\x1b[0m',

projectName: '\x1b[38;2;70;130;180m', // Steel Blue (not the same as prompt or welcome)
  linkLabel:   '\x1b[38;2;160;160;160m', // Neutral Gray
  linkUrl:     '\x1b[38;2;0;191;255m',   // Deep Sky Blue

};


const term = new Terminal({
  cursorBlink: true,
  cursorStyle: 'block',

theme: {
  background: '#0A0B12',    // Almost Black with a hint of blue — deeper than navy for less eye strain
  foreground: '#C7D0D9',    // Soft Light Gray with subtle cool tint — easier on eyes than pure white
  cursor: '#39FF14',        // Neon Lime Green — brighter and more vivid for visibility
  selection: '#084B49',     // Dark Teal — elegant and not too harsh for text selection
  black: '#12151E',         // Dark slate gray for bold text or background highlights
  red: '#FF4C4C',           // Vivid red for errors and alerts
  green: '#00FF6A',         // Neon green for success messages or highlights
  yellow: '#FFC75F',        // Warm amber for warnings or info accents
  blue: '#00D1FF',          // Bright cyan for links or commands
  magenta: '#FF6AC1',       // Soft pink for highlights, but subtle (avoid purple overload)
  cyan: '#00FFF7',          // Electric cyan for cool techy vibes
  white: '#E0E6F0',         // Off-white for standard bright text
  brightBlack: '#5C6773',   // Medium gray for disabled or less important text
  brightWhite: '#F5F7FA',   // Almost white for bold or important text
},

  fontFamily: `"JetBrains Mono", "Fira Code", monospace`,
  fontSize: 16,
  lineHeight: 1.2,
});

const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);

// Attach to DOM
term.open(document.getElementById('terminal-container'));
fitAddon.fit();               // size to container
window.addEventListener('resize', () => fitAddon.fit());
term.focus();
term.element?.addEventListener('click', () => term.focus());


// ==== EXTRA FUNCTIONS =======================================================

function printCenteredWrapped(text, options = {}) {
  // ──────── Options ────────────────────────────────────────────────
  const {
    colour = '\x1b[93m',   // bright yellow (same as before)
    maxLineLength = 60,    // <-- hard‑wrap width you control
    terminalCols = term.cols || 80   // fallback if term.cols is undefined
  } = options;

  // ──────── Split into words ───────────────────────────────────────
  const words = text.split(/\s+/);

  // ──────── Build lines that never exceed maxLineLength ─────────────
  const lines = [];
  let curLine = [];

  for (const w of words) {
    const tentative = curLine.concat(w).join(' ');
    if (tentative.length > maxLineLength) {
      // Flush the current line and start a new one
      lines.push(curLine.join(' '));
      curLine = [w];
    } else {
      curLine.push(w);
    }
  }
  if (curLine.length) lines.push(curLine.join(' '));

  // ──────── Write each line centred inside the *actual* terminal width
  for (const line of lines) {
    const padding = Math.max(
      0,
      Math.floor((terminalCols - line.length) / 2)
    );
    const paddedLine = ' '.repeat(padding) + line;
    term.write(colour + paddedLine + '\x1b[0m\r\n');
  }
}

/* ------------------------------------------------------------------
   3️⃣  SHOW‑ABOUT WRAPPER (calls the helper)
   ------------------------------------------------------------------ */
function showAbout() {
  // Optional blank line before the block – makes it look cleaner
  term.write('\r\n');

  // Call the formatter – you can change maxLineLength here if you wish
  printCenteredWrapped(ABOUT_TEXT, {
    colour: '\x1b[37m',  
    maxLineLength: 150     // <-- tweak this number to any width you like
  });

  // Optional blank line after the block so the prompt isn’t glued
  term.write('\r\n');
}



function clearScreen() {
term.reset();                 // clears screen & homes cursor (no scroll‑back clear)
  term.write('\x1b[3J');       // now wipe the scroll‑back
  commandBuffer = '';
  historyIndex = commandHistory.length;
}

function error(msg) {
  println(`\x1b[31m✖ ${msg}\x1b[0m`);
}

function replaceCurrentLine(text) {
  //  \x1b[2K  → erase the entire line
  //  \r       → carriage return (back to column 0)
  //  PROMPT   → write the prompt again
  term.write('\x1b[2K\r' + PROMPT + text);
  commandBuffer = text;   // keep the internal buffer identical
}

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
  whoami          About me
  ls              List my social media links
  projects        My open‑source projects
  blog            Open my technical blog
  clear           Clear the screen
  echo <msg>      Echo back a message`;

const COMMANDS = [
  'help',
  'whoami',
  'ls',
  'projects',
  'blog',
  'clear',
  'echo',
];

const ABOUT_TEXT = `
I’m a recent Cybersecurity graduate (B.S.) from Oregon Tech with a minor in Business. My studies focused on Network Security and Ethical Hacking, giving me solid hands‑on experience with firewalls, intrusion detection, penetration testing, and secure network design.

I’m a problem‑solver who thrives on dissecting complex challenges and turning them into actionable solutions. Working on group projects and labs sharpened my teamwork skills, so I’m comfortable collaborating in fast‑paced environments and communicating technical concepts to both technical and non‑technical stakeholders.

Combining a strong security foundation with business insight, I aim to protect organizations while aligning security initiatives with broader strategic goals.
`.trim();

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


const SOCIAL_LINKS = [
  {
    name: 'GitHub',
    url: 'https://github.com/c1d3r24',
  },
  {
    name: 'LinkedIn',
    url: 'https://www.linkedin.com/in/nik-carlberg-148945355',
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

    case 'whoami':
      showAbout();
      break;

case 'projects':
  PROJECTS.forEach(p => {
    println(`${COLORS.projectName}${p.name}${COLORS.reset} – ${p.desc}`);
    if (p.url) {
      styledPrintLink('Link:', p.url, {
        labelColor: '#FFD166',   // warm yellow (matches COLORS.info)
        urlColor: '#4DA6FF'      // electric blue (matches COLORS.welcome)
      });
    } else {
      term.writeln('\x1b[30;43m  coming soon  \x1b[0m');
    }
  });
  break;

    case 'blog':
      println('\nOpening my blog...');
      window.open('https://nikcarlberg.com/blog/', '_blank');
      break;

case 'ls':
  const links = SOCIAL_LINKS
    .filter(link => link.url) // skip empty ones
    .map(link => {
      const label = `\x1b[38;2;0;191;255m${link.name}\x1b[0m`; // color: Deep Sky Blue
      return `\x1b]8;;${link.url}\x07${label}\x1b]8;;\x07`;   // OSC 8 format
    });

  term.writeln('\r\n' + links.join('     ') + '\r\n'); // space between items
  break;

    case 'clear':
      clearScreen();
      break;

    case 'echo':
      println(args.join(' '));
      break;

	case 'sudo':
      println("🛑 Nice try. You're not root here!");
      break;

    case 'exit':
     println("👋 Thanks for stopping by!");
     break;



    case '':
      // empty line – do nothing
      break;

    default:
      error(`command not found: ${cmd}`);
  }
}

// ==== INPUT HANDLING =======================================================
let commandBuffer = '';

const PROMPT = '\x1b[32mnik@portfolio:~$ \x1b[0m';

term.prompt = () => {
  term.write('\r\n' + PROMPT);
};



const commandHistory = [];
let historyIndex = commandHistory.length;

term.onKey(({ key, domEvent }) => {
  const printable =
    !domEvent.ctrlKey &&
    !domEvent.altKey &&
    !domEvent.metaKey &&
    domEvent.key.length === 1;   // a normal character (letter, number, symbol)

  /* -------------------------------------------------------------
     ENTER – run the command
     ------------------------------------------------------------- */
  if (domEvent.key === 'Enter') {
    const trimmed = commandBuffer.trim();

    execCommand(trimmed);                     // your existing dispatcher

    // Store non‑empty commands in history
    if (trimmed !== '') {
      commandHistory.push(trimmed);
    }
    // Reset history pointer and buffer
    historyIndex = commandHistory.length;
    commandBuffer = '';
    term.write('\r\n' + PROMPT);              // fresh prompt
    return;
  }

  /* -------------------------------------------------------------
     BACKSPACE – delete one character
     ------------------------------------------------------------- */
  if (domEvent.key === 'Backspace') {
    if (commandBuffer.length > 0) {
      term.write('\b \b');                    // erase on screen
      commandBuffer = commandBuffer.slice(0, -1);
    }
    return;
  }

  /* -------------------------------------------------------------
     ARROW UP – previous command
     ------------------------------------------------------------- */
  if (domEvent.key === 'ArrowUp') {
    if (historyIndex > 0) {
      historyIndex--;
      replaceCurrentLine(commandHistory[historyIndex] ?? '');
    }
    return;
  }

  /* -------------------------------------------------------------
     ARROW DOWN – next command (or clear line)
     ------------------------------------------------------------- */
  if (domEvent.key === 'ArrowDown') {
    if (historyIndex < commandHistory.length - 1) {
      historyIndex++;
      replaceCurrentLine(commandHistory[historyIndex] ?? '');
    } else {
      // Past the newest entry → clear the line
      historyIndex = commandHistory.length;
      replaceCurrentLine('');
    }
    return;
  }

  /* -------------------------------------------------------------
     TAB – auto‑completion
     ------------------------------------------------------------- */
  if (domEvent.key === 'Tab') {
    domEvent.preventDefault();               // stop the browser from moving focus

    const matches = COMMANDS.filter(cmd =>
      cmd.startsWith(commandBuffer)
    );

    if (matches.length === 1) {
      // Exactly one match → fill the rest of the command
      const remainder = matches[0].slice(commandBuffer.length);
      term.write(remainder);
      commandBuffer += remainder;
    } else if (matches.length > 1) {
      // Multiple possibilities → show them on a new line
      term.write('\r\n');
      println(matches.join('   '));          // space‑separated list
      term.write(PROMPT + commandBuffer);    // redraw prompt + what user typed
    }
    // If no matches → silently ignore
    return;
  }

  /* -------------------------------------------------------------
     PRINTABLE characters – just add them to the buffer
     ------------------------------------------------------------- */
  if (printable) {
    commandBuffer += key;
    term.write(key);
  }
});



// ==== STARTUP MESSAGE ======================================================

const asciiArt = `
  _   _ _ _    _        _____                             _____ _          _ _ \r\n | \\ | (_) |  ( )      \/ ____|                           \/ ____| |        | | |\r\n |  \\| |_| | _|\/ ___  | (___   ___  ___ _   _ _ __ ___  | (___ | |__   ___| | |\r\n | . \` | | |\/ \/ \/ __|  \\___ \\ \/ _ \\\/ __| | | | \'__\/ _ \\  \\___ \\| \'_ \\ \/ _ \\ | |\r\n | |\\  | |   <  \\__ \\  ____) |  __\/ (__| |_| | | |  __\/  ____) | | | |  __\/ | |\r\n |_| \\_|_|_|\\_\\ |___\/ |_____\/ \\___|\\___|\\__,_|_|  \\___| |_____\/|_| |_|\\___|_|_|\r\n                                                                               \r\n
`;

term.writeln(`${COLORS.asciiArt}${asciiArt}${COLORS.reset}`);

term.writeln(`${COLORS.welcome}Welcome to nikcarlberg.com – a terminal‑styled portfolio.${COLORS.reset}`);
term.writeln(`${COLORS.info}Type "help" for a list of commands.${COLORS.reset}`);

term.prompt();

