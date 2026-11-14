# Exploded Teardown — NX-700 Architecture

An engineering product teardown visualizer built in pure HTML5 Canvas and Web Audio, rendering a precision hardware assembly exploding along its isometric Z/Y-axis with exact CAD annotations, bill of materials callouts, and multi-layer PCB inspection.

## Architecture
- **Canvas 2D Rendering (`source/film.js`)**: Real-time multi-layered vector CAD rendering featuring base enclosure, FR4 PCB traces, copper heat spreaders, silicon SoC dies, and Grade-5 titanium top plates.
- **Precision Sound Design (`source/audio.py`)**: Synthesized servo whine, mechanical micro-switches, and digital telemetry beeps synchronized to the 10-second explode/implode sequence.
