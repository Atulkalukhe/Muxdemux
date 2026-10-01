# MUX / DEMUX Lab

An interactive digital-logic simulator for learning how multiplexers and demultiplexers route binary data. It is built with HTML5, CSS3, and vanilla JavaScript. The project has no framework, backend, package installation, or external JavaScript library.

## Features

- Switch between 2:1, 4:1, 8:1, and 16:1 MUX circuits and 1:2, 1:4, 1:8, and 1:16 DEMUX circuits.
- Flip accessible 0/1 data and select-line switches. Select lines are shown MSB to LSB, so **S0 is always the rightmost, least significant bit**.
- Follow a live block diagram with a highlighted selected wire, signal animation when the data bit is 1, selected channel, binary address, decimal address, and output.
- Read a live explanation and selected Boolean product term.
- Explore a dynamic truth table. Its highlighted row tracks the current address and data.
- Use Step mode to walk through binary-to-decimal conversion and routing, or Auto demo to cycle through all addresses.
- Practice with generated MUX and DEMUX questions and a live score.
- Review concise explanations, applications, and a MUX vs DEMUX comparison.
- Responsive layout, large controls, keyboard focus indicators, semantic switch labels, and reduced-motion support.

## Run locally

No build or dependency installation is needed. Open `index.html` in a modern browser, or serve the folder with a local static server:

```sh
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

## Use the simulator

1. Choose **Multiplexer** or **Demultiplexer**, then choose the channel count.
2. Flip input bits and select-line switches. Read the address from left to right, with S0 at the right.
3. Follow the mint highlighted path and compare the live result with the highlighted truth-table row.
4. Use **Previous**, **Next**, and **Restart** for a guided walkthrough, or start the Auto demo.
5. Generate a quiz question and choose an answer. Correct answers increase the score.

For a MUX, the selected input becomes Y. For a DEMUX, D is routed to the selected output and every other output is 0. In both circuits, the number of channels is `2^n`, where `n` is the number of select lines.

## Test and verify

The simulator runs as static files. To verify it in a browser, check every select address with both data values for each supported channel count. For a MUX, confirm `Y = I[selected]`. For a DEMUX, confirm only `Y[selected]` can equal D and all other outputs remain 0.

The 16-channel check is `S3 S2 S1 S0 = 1011₂ = 11₁₀`: a 16:1 MUX selects I11, and a 1:16 DEMUX selects Y11. Also check the animated selected wire, switch values, truth-table highlight, Step mode navigation, Auto demo start/stop, both quiz question types and score, narrow-screen layout, and the browser console.

This project intentionally has no package manifest or third-party test dependency. A browser automation tool such as Playwright can exercise the static page without changing that constraint.

## Deploy to GitHub Pages

1. Push the repository to GitHub.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the branch containing these files and choose `/(root)` as the folder, then save.
5. Wait for the Pages deployment and open the URL GitHub provides. The root `index.html` is the site entry point.

No build command is required. If the files are placed in a subdirectory instead of the repository root, choose that directory in the Pages settings or move the site files to the root.
