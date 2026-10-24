# 2D Game

A 2D shooter game developed using vanilla JavaScript, without any external libraries or frameworks.

The project focuses on core game mechanics such as movement, shooting, collision handling, and basic game loop logic, all implemented from scratch.

🔗 Live demo: https://2dgameleandrex.netlify.app/


## Tests

Unit tests use Node's built-in test runner (Node 20+), with no dependencies:

```bash
npm test
```

They run on every pull request through GitHub Actions (`.github/workflows/test.yml`).

## Map editor

Open `editor.html` (serve the folder with any static server, e.g. `python3 -m http.server`) to build the map: solid objects (large rocks, cacti, wooden crates, barrels, sandbags) block the player, zombies and bullets, while decoration (bushes, grass, pebbles, bones) is visual only.

- Click to place, **Move** to drag objects, right click to erase, drag to paint grass; `Ctrl+Z` / `Ctrl+Y` undo/redo.
- The map is saved automatically in the browser and loaded by the game. **Export** it to a file and commit it as `assets/maps/default.json` to make it the default map for everyone.
