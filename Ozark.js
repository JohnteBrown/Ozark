/*
THE FOLLOWING SCRIPT IS PROPERTY OF RAINSOFTWARE's BREAKINGRAIN CYBERSECURITY & RAINSOFTWARE's DUSK & RAIN STUDIO's
REDISTRIBUTION IS STRICTLY FORBIDDEN.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.

(C) Copyright 2024 RAINSOFTWARE LLC. All rights reserved.
*/

/*
 ________  ________  ________  ________  ___  __       
|\   __  \|\_____  \|\   __  \|\   __  \|\  \|\  \     
\ \  \|\  \\|___/  /\ \  \|\  \ \  \|\  \ \  \/  /|_   
 \ \  \\\  \   /  / /\ \   __  \ \   _  _\ \   ___  \  
  \ \  \\\  \ /  /_/__\ \  \ \  \ \  \\  \\ \  \\ \  \ 
   \ \_______\\________\ \__\ \__\ \__\\ _\\ \__\\ \__\
    \|_______|\|_______|\|__|\|__|\|__|\|__|\|__| \|__|

    Ozark Access Gateway is a web-based interface for executing proxied javascript in a secure manner for debugging or testing purposes.
    Ozark is developed by Rain Software LLC and released under a proprietary license.
*/

(function() {
  const base_html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Ozark Access Gateway</title>
      <style>
        body {
          background-color: black;
          color: white;
          margin: 0;
          height: 100vh;
          display: flex;
          flex-direction: column;
        }
        #terminal-container {
          flex: 1;
          padding: 10px;
          overflow: hidden;
        }
      </style>
    </head>
    <body>
      <div id="terminal-container"></div>
    </body>
    </html>
  `;

  const popup = window.open("", "", "width=800,height=400");
  popup.document.write(base_html);
  popup.document.close();

  const loadCSS = (href) => {
    const link = popup.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    popup.document.head.appendChild(link);
  };

  const loadScript = (src, callback) => {
    const script = popup.document.createElement('script');
    script.src = src;
    script.onload = callback;
    popup.document.head.appendChild(script);
  };

  const initializeTerminal = () => {
    const term = new popup.Terminal();
    const fitAddon = new popup.FitAddon.FitAddon();
    term.loadAddon(fitAddon);
    const terminalContainer = popup.document.getElementById('terminal-container');
    term.open(terminalContainer);
    fitAddon.fit();

    popup.window.addEventListener('resize', () => fitAddon.fit());

    handleTerminalInput(term);
    initWebSocket(term);
  };

  const handleTerminalInput = (term) => {
    let inputBuffer = '';
    term.onData((data) => {
      if (data === '\r') { 
        const command = inputBuffer.trim();
        term.writeln('$ ' + command);
        inputBuffer = ''; 

        if (command.startsWith('javascript:')) {
          try {
            const scriptContent = command.slice('javascript:'.length);
            eval(scriptContent);
            term.writeln('Bookmarklet executed successfully.');
          } catch (err) {
            term.writeln('Error executing bookmarklet: ' + err.message);
          }
        } else if (command.startsWith('http') && command.endsWith('.js')) {
          fetch('https://cors-anywhere.herokuapp.com/' + command)
            .then(response => response.text())
            .then(script => {
              try {
                const wrappedScript = new Function(script);
                wrappedScript();
                term.writeln('Script executed successfully.');
              } catch (err) {
                term.writeln('Error executing script: ' + err.message);
              }
            })
            .catch(err => term.writeln('Error fetching script: ' + err.message));
        } else {
          term.writeln('Command not recognized.');
        }
      } else if (data === '\u007F') {
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          term.write('\b \b');
        }
      } else {
        inputBuffer += data; 
        term.write(data); 
      }
    });
  };

  const initWebSocket = (term) => {
    const ws = new WebSocket('wss://ws-server-production-2134.up.railway.app');
    console.warn(`
 ________  ________  ________  ________  ___  __       
|\   __  \|\_____  \|\   __  \|\   __  \|\  \|\  \     
\ \  \|\  \\|___/  /\ \  \|\  \ \  \|\  \ \  \/  /|_   
 \ \  \\\  \   /  / /\ \   __  \ \   _  _\ \   ___  \  
  \ \  \\\  \ /  /_/__\ \  \ \  \ \  \\  \\ \  \\ \  \ 
   \ \_______\\________\ \__\ \__\ \__\\ _\\ \__\\ \__\
    \|_______|\|_______|\|__|\|__|\|__|\|__|\|__| \|__|
 `);
    ws.onopen = () => term.writeln('WebSocket connection established.');
    ws.onmessage = (event) => term.writeln('Server: ' + event.data);
    ws.onerror = (error) => term.writeln('WebSocket Error: ' + error.message);
    ws.onclose = () => term.writeln('WebSocket connection closed.');
  };

  loadCSS('https://cdn.jsdelivr.net/npm/xterm/css/xterm.css');
  loadScript('https://cdn.jsdelivr.net/npm/xterm/lib/xterm.js', () => {
    loadScript('https://cdn.jsdelivr.net/npm/xterm-addon-fit/lib/xterm-addon-fit.js', () => {
      initializeTerminal();
    });
  });
})();