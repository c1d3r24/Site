// ==== INITIALIZE XTERM ======================================================
const term = new Terminal({
  cursorBlink: true,
  cursorStyle: 'block',

  theme: {
    background: '#141b1e',   
    foreground: '#ECEFF1',  
    cursor: '#00E676',     
    selection: '#80CBC4', 
  },

  fontFamily: `"JetBrains Mono", "Fira Code", monospace`,
  fontSize: 14,               // keep the size you like
  lineHeight: 1.2,            // a touch of breathing room
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
    colour: '\x1b[93m',   // keep the yellow you used before
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
  about           Who I am
  projects        List my open‑source projects
  blog            Open my technical blog
  clear           Clear the screen
  echo <msg>      Echo back a message`;

const COMMANDS = [
  'help',
  'about',
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
      showAbout();
      break;
    case 'projects':
      PROJECTS.forEach(p => {
        println(`\x1b[96m${p.name}\x1b[0m – ${p.desc}`);
        if (p.url) {
		styledPrintLink('Link: ', p.url, {
		});
	} else {
		term.writeln(`\x1b[30;43m  coming soon  \x1b[0m`);
	}
      });
      break;
    case 'blog':
      println('\nOpening my blog...');
      // Open in a new tab (works on static pages)
      window.open('https://nikcarlberg.com/blog/', '_blank');
      break;
    case 'clear':
      clearScreen();
      break;
    case 'echo':
      println(args.join(' '));
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

const PROMPT = 'nik@portfolio:~$ ';

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
term.writeln('Welcome to myConsole – a terminal‑styled portfolio.');
term.writeln('Type "help" for a list of commands.');
term.prompt();

