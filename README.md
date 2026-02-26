# figma-ds-cli

<p align="center">
  <a href="https://intodesignsystems.com"><img src="https://img.shields.io/badge/Into_Design_Systems-intodesignsystems.com-ff6b35" alt="Into Design Systems"></a>
  <img src="https://img.shields.io/badge/Figma-Desktop-purple" alt="Figma Desktop">
  <img src="https://img.shields.io/badge/No_API_Key-Required-green" alt="No API Key">
  <img src="https://img.shields.io/badge/Claude_Code-Ready-blue" alt="Claude Code">
</p>

<p align="center">
  <b>Control Figma directly from your terminal.</b><br>
  Full read/write access to Figma Desktop via Chrome DevTools Protocol.<br>
  No API key, no plugins, no MCP server setup.
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
- **Analyze Designs** — Colors, typography, spacing, find repeated patterns
- **Lint & Accessibility** — Contrast checker, touch targets, design rules
- **Export** — PNG, SVG, JSX, Storybook stories, CSS variables, Tailwind config
- **Batch Operations** — Rename layers, find/replace text, create 100 variables at once
- **Works with Claude Code** — Just ask in natural language, Claude knows all commands

## Why This CLI?

Other tools require MCP servers, API keys, or complex setup. This one doesn't.

| | figma-ds-cli | MCP-based tools |
|---|---|---|
| **Setup** | Paste link in Claude, done | Configure MCP server + client |
| **API Key** | Not needed | Personal Access Token or OAuth |
| **Claude Code** | Just run `claude` | Manual MCP configuration |
| **AI Knowledge** | `CLAUDE.md` included, AI knows everything | Teach AI manually |
| **Designer-friendly** | Yes | Requires technical setup |

### The CLAUDE.md Advantage

This project includes a `CLAUDE.md` file that Claude reads automatically. It contains:

- All available commands and their syntax
- Best practices (e.g., "use `render` for text-heavy designs")
- Common requests mapped to solutions

**Example:** You type "Create Tailwind colors" → Claude already knows to run `node src/index.js tokens tailwind` because it's documented in `CLAUDE.md`.

No explaining. No teaching. Just ask.

---

## What You Need

- **Figma Desktop** (free account works)
- **Claude Code** ([get it here](https://claude.ai/download))

---

## Setup

### 1. Open Terminal and start Claude

```bash
claude
```

### 2. Install

```
Help me install https://github.com/silships/figma-cli
```

### 3. Connect to Figma

**Option A: Yolo Mode (Recommended for personal Mac)**
```
Initiate project
```
Done! Claude patches Figma once and connects automatically.

**Option B: Safe Mode (For corporate/restricted environments)**
```
Connect to Figma in safe mode
```
Then in Figma:
1. **Plugins → Development → Import plugin from manifest**
2. Select `plugin/manifest.json` from the cloned repo
3. **Plugins → Development → FigCli** to start

---

## Using It

Once connected, just talk to Claude:

> "Create Tailwind colors"

> "Add a card component"

> "Check accessibility"

> "Export variables as CSS"

The included `CLAUDE.md` teaches Claude all commands automatically. No manual required.

**Safe Mode users:** Start the FigCli plugin each time you open Figma.

## Two Connection Modes

### 🚀 Yolo Mode (Default) — Recommended

**What it does:** Patches Figma once to enable a debug port, then connects directly.

**Pros:**
- Fully automatic (no manual steps after setup)
- Faster execution
- Full feature support (render, JSX, everything)

**Cons:**
- Requires one-time Figma patch (needs Full Disk Access on macOS)
- Modifies Figma app files

```
┌─────────────┐      WebSocket (CDP)      ┌─────────────┐
│     CLI     │ ◄───────────────────────► │   Figma     │
└─────────────┘      localhost:9222       └─────────────┘
```

```bash
node src/index.js connect
```

---

### 🔒 Safe Mode — No Patching Required

**What it does:** Uses a Figma plugin to communicate. No Figma modification needed.

**Pros:**
- No patching, no app modification
- Works in corporate/secure environments
- No Full Disk Access needed

**Cons:**
- Manual plugin start required (each session)
- Slightly slower
- Some features limited (render uses eval fallback)

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
| Personal Mac, no restrictions | **Yolo Mode** |
| Corporate laptop, can't modify apps | **Safe Mode** |
| Full Disk Access permission error | **Safe Mode** |
| Want zero manual steps | **Yolo Mode** |
| Security-conscious environment | **Safe Mode** |

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

**3. Run init again**
```bash
node src/index.js init
```

If still failing, try with sudo: `sudo node src/index.js init`

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

Run Command Prompt or PowerShell as Administrator, then run `node src/index.js init`.

### Figma Not Connecting

1. Make sure Figma Desktop is running (not the web version)
2. Check if port 9222 is available: `lsof -i :9222`
3. Restart Figma: `node src/index.js connect`

---

## Full Feature List

### Design Tokens & Variables

- Create complete design systems (colors, spacing, typography, radii)
- Create Tailwind CSS color palettes (all 22 color families, 50-950 shades)
- Create and manage variable collections
- **Variable modes** (Light/Dark/Mobile) with per-mode values
- **Batch create** up to 100 variables at once
- **Batch update** variable values across modes
- Bind variables to node properties (fill, stroke, gap, padding, radius)
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

**[Sil Bormüller](https://www.linkedin.com/in/silbormueller/)** — [intodesignsystems.com](https://intodesignsystems.com)

## Powered By

This CLI is built on top of **[figma-use](https://github.com/dannote/figma-use)** by [dannote](https://github.com/dannote) — an excellent Figma CLI with JSX rendering, XPath queries, design linting, and much more.

We use figma-use for:
- JSX rendering (`render` command)
- Node operations (`node tree`, `node to-component`, etc.)
- Design analysis (`analyze colors`, `analyze typography`)
- Design linting (`lint`)
- And many other features

**Big thanks to dannote for figma-use!**

## License

MIT
