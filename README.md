# figma-ds-cli

<p align="center">
  <img src="https://img.shields.io/badge/Figma-Desktop-purple" alt="Figma Desktop">
  <img src="https://img.shields.io/badge/No_API_Key-Required-green" alt="No API Key">
</p>

<p align="center">
  <b>Control Figma Desktop with your AI coding assistant.</b><br>
  Full read/write access. No API key required.<br>
  Just talk to your AI about your designs.
</p>

```
  ███████╗██╗ ██████╗ ███╗   ███╗ █████╗       ██████╗ ███████╗       ██████╗██╗     ██╗
  ██╔════╝██║██╔════╝ ████╗ ████║██╔══██╗      ██╔══██╗██╔════╝      ██╔════╝██║     ██║
  █████╗  ██║██║  ███╗██╔████╔██║███████║█████╗██║  ██║███████╗█████╗██║     ██║     ██║
  ██╔══╝  ██║██║   ██║██║╚██╔╝██║██╔══██║╚════╝██║  ██║╚════██║╚════╝██║     ██║     ██║
  ██║     ██║╚██████╔╝██║ ╚═╝ ██║██║  ██║      ██████╔╝███████║      ╚██████╗███████╗██║
  ╚═╝     ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝      ╚═════╝ ╚══════╝       ╚═════╝╚══════╝╚═╝
```

## What is This?

A CLI that connects directly to Figma Desktop and gives you complete control:

- **Design Tokens** — Create variables, collections, modes (Light/Dark), bind to nodes
- **Create Anything** — Frames, text, shapes, icons (150k+ from Iconify), components
- **Team Libraries** — Import and use components, styles, variables from any library
- **Library Management** — Scan, register, and place components from team libraries
- **Analyze Designs** — Colors, typography, spacing, find repeated patterns
- **Lint & Accessibility** — Contrast checker, touch targets, design rules
- **Export** — PNG, SVG, JSX, Storybook stories, CSS variables, Tailwind config
- **Batch Operations** — Rename layers, find/replace text, create 100 variables at once
- **Works with AI Assistants** — Just ask in natural language, your AI knows all commands

## Why This CLI?

This project includes a `CLAUDE.md` instruction file that AI coding assistants read automatically. It contains:

- All available commands and their syntax
- Best practices (e.g., "use `render` for text-heavy designs")
- Common requests mapped to solutions

**Works with any AI that reads project instructions** — Claude Code reads `CLAUDE.md` natively. For other tools, copy or symlink to their convention (e.g., `.cursorrules`, `.github/copilot-instructions.md`).

**Want to teach your AI new tricks?** Just update the instruction file. No code changes needed.

**Example:** You type "Create Tailwind colors" → your AI already knows to run `node src/index.js tokens tailwind` because it's documented in the instruction file.

---

## What You Need

- **Figma Desktop** (free account works)
- **AI coding assistant** with terminal access (Claude Code, Cursor, GitHub Copilot, etc.)
- **Node.js** (v18 or later)

---

## Setup

### 1. Clone & Open

```bash
git clone https://github.com/georgepago/figma-cli-ds.git
cd figma-cli-ds
npm install
```

**IMPORTANT:** Start your AI assistant from the figma-cli-ds folder so it can read the project instructions.

### 2. Connect

Just say:
```
Connect to Figma
```

Your AI assistant will ask which connection mode:
- **Yolo Mode (Recommended)** — Fully automatic, secure random port
- **Safe Mode** — For corporate/restricted environments

Done! Now just talk to your AI about your designs.

---

## Using It

Once connected, just ask your AI:

> "Add shadcn colors to my project"

> "Add a card component"

> "Check accessibility"

> "Export variables as CSS"

The included `CLAUDE.md` instruction file teaches your AI all commands automatically. No manual required.

**Safe Mode users:** Start the FigCli plugin each time you open Figma.

## Two Connection Modes

### 🚀 Yolo Mode (Recommended)

**What it does:** Patches Figma once to enable a debug port, then connects directly.

**Pros:**
- Fully automatic (no manual steps after setup)
- Slightly faster execution
- Secure: random port (9222-9322) per session, localhost only

**Cons:**
- Requires one-time Figma patch
- Needs Full Disk Access on macOS (one-time)

```
┌─────────────┐      WebSocket (CDP)      ┌─────────────┐
│     CLI     │ ◄───────────────────────► │   Figma     │
└─────────────┘    localhost:random port  └─────────────┘
```

```bash
node src/index.js connect
```

---

### 🔒 Safe Mode — For Restricted Environments

**What it does:** Uses a Figma plugin to communicate. No Figma modification needed.

**Pros:**
- No patching, no app modification
- Works everywhere (corporate, personal, any environment)
- No Full Disk Access needed

**Cons:**
- Start plugin manually each session (2 clicks)

```
┌─────────────┐     WebSocket     ┌─────────────┐     Plugin API     ┌─────────────┐
│     CLI     │ ◄───────────────► │   Daemon    │ ◄────────────────► │   Plugin    │
└─────────────┘   localhost:3456  └─────────────┘                    └─────────────┘
```

**Step 1:** Start Safe Mode
```bash
node src/index.js connect --safe
```

**Step 2:** Import plugin (one-time only)
1. In Figma: **Plugins → Development → Import plugin from manifest**
2. Select `plugin/manifest.json` from this project
3. Click **Open**

**Step 3:** Start the plugin (each session)
1. In Figma: **Plugins → Development → FigCli**
2. Terminal shows: `Plugin connected!`

**Tip:** Right-click the plugin → **Add to toolbar** for quick access.

---

### Which Mode Should I Use?

| Situation | Recommended Mode |
|---|---|
| First time user | **Yolo Mode** |
| Personal Mac | **Yolo Mode** |
| Corporate laptop | **Safe Mode** |
| Permission errors with Yolo | **Safe Mode** |
| Can't modify apps | **Safe Mode** |

---

## Troubleshooting

### Permission Error When Patching (macOS)

If you see `EPERM: operation not permitted, open '.../app.asar'`:

**1. Grant Full Disk Access to Terminal**

macOS blocks file access without this permission, even with sudo.

1. Open **System Settings** → **Privacy & Security** → **Full Disk Access**
2. Click the **+** button
3. Add **Terminal** (or iTerm, VS Code, Warp, etc.)
4. **Restart Terminal completely** (quit and reopen)

**2. Make sure Figma is completely closed**
```bash
# Check if Figma is still running
ps aux | grep -i figma

# Force quit if needed
killall Figma
```

**3. Run connect again**
```bash
node src/index.js connect
```

If still failing, try with sudo: `sudo node src/index.js connect`

**4. Manual patch (last resort)**

If nothing works, you can patch manually:

```bash
# Backup original
sudo cp /Applications/Figma.app/Contents/Resources/app.asar ~/app.asar.backup

# The patch changes one string in the file
# From: removeSwitch("remote-debugging-port")
# To:   removeSwitch("remote-debugXing-port")

# Use a hex editor or this command:
sudo sed -i '' 's/remote-debugging-port/remote-debugXing-port/g' /Applications/Figma.app/Contents/Resources/app.asar

# Re-sign the app
sudo codesign --force --deep --sign - /Applications/Figma.app
```

### Windows Permission Error

Run Command Prompt or PowerShell as Administrator, then run `node src/index.js connect`.

### Figma Not Connecting

1. Make sure Figma Desktop is running (not the web version)
2. Open a design file in Figma (not just the home screen)
3. Restart connection: `node src/index.js connect`

---

## Full Feature List

### Design Tokens & Variables

- **Color presets** — shadcn (276 vars with Light/Dark mode), Radix UI (156 vars)
- Create Tailwind CSS color palettes (all 22 color families, 50-950 shades)
- Create and manage variable collections
- **Variable modes** (Light/Dark/Mobile) with per-mode values
- **Batch create** up to 100 variables at once
- **Batch update** variable values across modes
- Bind variables to node properties (fill, stroke, gap, padding, radius)
- **Spacing tokens** — `tokens spacing` for spacing scale
- **Border radius tokens** — `tokens radii` for radius scale
- **Import from JSON** — `tokens import <file>` for custom token files
- **IDS Base** — `tokens ds` for full design system (variables + components)
- Export variables as CSS custom properties
- Export variables as Tailwind config

### Create Elements

- Frames with auto-layout
- Rectangles, circles, ellipses
- Text with custom fonts, sizes, weights
- Lines
- Icons (150,000+ from Iconify: Lucide, Material Design, Heroicons, etc.)
- Groups
- Components from frames
- Component instances
- **Component sets with variants**

### Modify Elements

- Change fill and stroke colors
- Set corner radius
- Resize and move
- Apply auto-layout (row/column, gap, padding)
- Set sizing mode (hug/fill/fixed)
- Rename nodes
- Duplicate nodes
- Delete nodes
- **Flip nodes** (horizontal/vertical)
- **Scale vectors**

### Find & Select

- Find nodes by name
- Find nodes by type (FRAME, COMPONENT, TEXT, etc.)
- **XPath-like queries** (`//FRAME[@width > 300]`)
- Select nodes by ID
- Get node properties
- Get node tree structure

### Canvas Operations

- List all nodes on canvas
- Arrange frames in grid or column
- Delete all nodes
- Zoom to fit content
- Smart positioning (auto-place without overlaps)

### Export

- Export nodes as PNG (with scale factor)
- Export nodes as SVG
- **Export multiple sizes** (@1x, @2x, @3x)
- Take screenshots
- **Export to JSX** (React code)
- **Export to Storybook** stories
- Export variables as CSS
- Export variables as Tailwind config

### FigJam Support

- Create sticky notes
- Create shapes with text
- Connect elements with arrows
- List FigJam elements
- Run JavaScript in FigJam context

### Team Libraries

- List available library variable collections
- Import variables from libraries
- Import components from libraries
- Create instances of library components
- Import and apply library styles (color, text, effect)
- Bind library variables to node properties
- Swap component instances to different library components
- List all enabled libraries

### Library Management (Registry)

Components resolve in priority order: team library → local → alias → fuzzy match. Existing design system components are always preferred over creating new ones.

- **Scan components** — discover local + library components (`lib scan`)
- **Component registry** — persistent storage at `~/.figma-ds-cli/components.json`
- **Place by name** — `lib place "Button"` with smart auto-positioning
- **Property overrides** — `lib place "Input" --props '{"text": "Email"}'`
- **Aliases** — create shortcuts (`lib alias "btn" "Button / Primary"`)
- **Component info** — view metadata, key, library name (`lib info "Button"`)
- **JSX integration** — `<Instance lib="Button" />` in render commands

### Designer Utilities

- **Batch rename layers** (with patterns: {n}, {name}, {type})
- **Case conversion** (camelCase, PascalCase, snake_case, kebab-case)
- **Lorem ipsum generator** (words, sentences, paragraphs)
- **Fill text with placeholder content**
- **Insert images from URL**
- **Unsplash integration** (random stock photos by keyword)
- **Contrast checker** (WCAG AA/AAA compliance)
- **Check text contrast** against background
- **Find and replace text** across all layers
- **Select same** (fill, stroke, font, size)
- **Color blindness simulation** (deuteranopia, protanopia, tritanopia)

### Query & Analysis

- **Analyze colors** — usage frequency, variable bindings
- **Analyze typography** — all font combinations used
- **Analyze spacing** — gap/padding values, grid compliance
- **Find clusters** — detect repeated patterns (potential components)
- **Visual diff** — compare two nodes
- **Create diff patch** — structural patches between versions

### Lint & Accessibility

- **Design linting** with 8+ rules:
  - `no-default-names` — detect unnamed layers
  - `no-deeply-nested` — flag excessive nesting
  - `no-empty-frames` — find empty frames
  - `prefer-auto-layout` — suggest auto-layout
  - `no-hardcoded-colors` — check variable usage
  - `color-contrast` — WCAG AA/AAA compliance
  - `touch-target-size` — minimum 44x44 check
  - `min-text-size` — minimum 12px text
- **Accessibility snapshot** — extract interactive elements tree

### Component Variants

- Create component sets with variants
- Add variant properties
- Combine frames into component sets
- **Organize variants** into grid with labels
- **Auto-generate component sets** from similar frames

### Component Documentation

- **Add descriptions** to components (supports markdown)
- **Document with template** (usage, props, notes)
- Read component descriptions

### CSS Grid Layout

- Set up grid layout with columns and rows
- Configure column/row gaps
- Auto-reorganize children into grid

### Console & Debugging

- **Capture console logs** from Figma
- **Execute code with log capture**
- **Reload page**
- **Navigate to files**

### Advanced

- Execute any Figma Plugin API code directly
- Render complex UI from JSX-like syntax
- Full programmatic control over Figma
- Match vectors to Iconify icons

### Not Supported (requires REST API)

- Comments (read/write/delete) — requires Figma API key
- Version history
- Team/project management

---

## Author

Forked and maintained by **George Pago** — [github.com/georgepago](https://github.com/georgepago)

Originally created by **[Sil Bormüller](https://www.linkedin.com/in/silbormueller/)** — [intodesignsystems.com](https://intodesignsystems.com)

## Powered By

Forked from **[figma-cli](https://github.com/silships/figma-cli)** by [Sil Bormüller](https://github.com/silships), which is built on **[figma-use](https://github.com/dannote/figma-use)** by [dannote](https://github.com/dannote).

**Big thanks to both projects!**

## License

MIT
