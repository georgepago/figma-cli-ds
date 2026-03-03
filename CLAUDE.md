# figma-ds-cli

CLI that controls Figma Desktop directly. No API key needed.

## Quick Reference

| User says | Command |
|-----------|---------|
| "connect to figma" | `node src/index.js connect` |
| "what DS is available" | `node src/index.js ds info` |
| "refresh design system" | `node src/index.js ds refresh` |
| "show DS variables" | `node src/index.js ds vars` |
| "scan for components" | `node src/index.js lib scan` |
| "list library components" | `node src/index.js lib list` |
| "place a button" | `node src/index.js lib place "Button"` |
| "show colors on canvas" | `node src/index.js var visualize` |
| "create cards/buttons" | `render-batch` + `node to-component` |
| "create a rectangle/frame" | `node src/index.js render '<Frame>...'` |
| "convert to component" | `node src/index.js node to-component "ID"` |
| "list variables" | `node src/index.js var list` |
| "find nodes named X" | `node src/index.js find "X"` |
| "what's on canvas" | `node src/index.js canvas info` |
| "export as PNG/SVG" | `node src/index.js export png` |
| "add shadcn colors" | `node src/index.js tokens preset shadcn` |
| "add tailwind colors" | `node src/index.js tokens tailwind` |

**Full command reference:** See REFERENCE.md

---

## Design System First (DS-First)

The CLI is **design-system-first**: it automatically discovers and uses existing components and variables from the Figma file's linked libraries. **Never assume what variables or components exist — always discover first.**

### Mandatory Workflow: Discover → Then Create

**Before creating ANYTHING, always run these commands to learn what the file's design system provides:**

```bash
# Step 1: Discover what's available
node src/index.js ds info                    # Shows libraries, variable count, component count
node src/index.js ds vars                    # Lists ALL color variable names and their hex values
node src/index.js ds vars --search "gray"    # Filter to find specific colors
node src/index.js lib list                   # Lists ALL available components

# Step 2: Now use the discovered names in JSX
# Example: if ds vars shows "neutral/900" and "neutral/50", use THOSE names:
node src/index.js render '<Frame bg="neutral/900"><Text color="neutral/50" size={18}>Hello</Text></Frame>'
```

**CRITICAL RULES:**
1. **NEVER hardcode hex colors** — always discover variable names first with `ds vars`, then use those names
2. **NEVER assume variable names** — different files have different design systems. One file might use `zinc/900`, another uses `gray-900`, another uses `neutral/dark`
3. **ALWAYS prefer `<Instance lib="...">` over building from scratch** — check `lib list` first to see if a component already exists
4. If no design system variables exist, tell the user and suggest linking a library or running `tokens preset shadcn` / `tokens tailwind`

### How It Works Automatically

- On first render, the CLI auto-scans for components if the registry is empty
- DS context (variables) is cached and refreshed every 5 minutes
- Variable names discovered via `ds vars` can be used directly in JSX: `bg="<varName>"`
- If you create a `<Frame name="Button">` and a Button component exists, the CLI warns you to use `<Instance lib="Button" />` instead
- Hex colors still work and will auto-bind to matching variables if the RGB values match

### DS Commands

```bash
node src/index.js ds info       # Show DS summary (libraries, components, variables)
node src/index.js ds refresh    # Force rescan of everything
node src/index.js ds vars       # List all color variables by name
node src/index.js ds vars --search "blue"  # Filter variables
```

### Variable Names in JSX

Once you've discovered the variable names via `ds vars`, use them directly:

```jsx
// Use the ACTUAL variable names from the file's design system
// (these are examples — real names come from running ds vars)
<Frame bg="<bg-variable-name>" rounded={12}>
  <Text color="<text-variable-name>" size={18}>Hello</Text>
</Frame>

// Semantic names if the DS has them
<Frame bg="<primary-bg-name>">
  <Text color="<primary-text-name>">Click me</Text>
</Frame>

// Hex ONLY as last resort when no variable exists — auto-binds if a match is found
<Frame bg="#18181b">
  <Text color="#fafafa">Hello</Text>
</Frame>
```

---

## Design Tokens

Only use these when the file has NO design system and the user wants to create one:

"Add shadcn colors":
```bash
node src/index.js tokens preset shadcn   # 244 primitives + 32 semantic (Light/Dark)
```

"Add tailwind colors":
```bash
node src/index.js tokens tailwind        # 242 primitive colors only
```

"Create design system":
```bash
node src/index.js tokens ds              # IDS Base colors
```

**shadcn vs tailwind:**
- `tokens preset shadcn` = Full shadcn system (primitives + semantic tokens with Light/Dark mode)
- `tokens tailwind` = Just the Tailwind color palette (primitives only)

"Delete all variables":
```bash
node src/index.js var delete-all                    # All collections
node src/index.js var delete-all -c "primitives"    # Only specific collection
```

**Note:** `var list` only SHOWS existing variables. Use `tokens` commands to CREATE them.

---

## Connection Modes

### Yolo Mode (Recommended)
Patches Figma once, then connects directly. Fully automatic.
```bash
node src/index.js connect
```

### Safe Mode
Uses plugin, no Figma modification. Start plugin each session.
```bash
node src/index.js connect --safe
```
Then: Plugins → Development → FigCli

---

## Creating Components

When user asks to "create cards", "design buttons":

**FIRST: Check if the component already exists:**
```bash
node src/index.js lib list --search "Card"
node src/index.js lib list --search "Button"
```

If it exists → use `<Instance lib="ComponentName" />` instead of building from scratch.

If it doesn't exist, create it using **discovered DS variable names** (from `ds vars`):

1. **Each component = separate frame** (NOT inside parent gallery)
2. **Convert to component** after creation
3. **Use variable names** for colors (never hardcoded hex)

```bash
# Step 1: Discover available colors
node src/index.js ds vars

# Step 2: Create using discovered variable names
node src/index.js render-batch '[
  "<Frame name=\"Card 1\" w={320} h={200} bg=\"<discovered-bg-var>\" rounded={12} flex=\"col\" p={24}><Text color=\"<discovered-text-var>\">Title</Text></Frame>",
  "<Frame name=\"Card 2\" w={320} h={200} bg=\"<discovered-bg-var>\" rounded={12} flex=\"col\" p={24}><Text color=\"<discovered-text-var>\">Title</Text></Frame>"
]'

# Step 3: Convert
node src/index.js node to-component "ID1" "ID2"
```

---

## Using Library Components

When creating screens, **always prefer existing components** from the user's design library instead of building from scratch.

**Step 1: Discover components**
```bash
node src/index.js lib scan              # Scans file for local + library components
node src/index.js lib list              # Shows all registered components
node src/index.js lib list --search "Button"  # Filter by name
```

**Step 2: Place component instances**
```bash
node src/index.js lib place "Button"                           # Smart positioned
node src/index.js lib place "Input" --props '{"text": "Email"}'  # With overrides
```

**Step 3: Mix with JSX render**
Use discovered variable names for container colors, and `<Instance>` for existing components:
```bash
node src/index.js render '<Frame name="Login" w={400} flex="col" gap={16} p={32} bg="<discovered-bg-var>" rounded={16}>
  <Text size={24} weight="bold" color="<discovered-text-var>">Sign In</Text>
  <Instance lib="Input" text="Email" />
  <Instance lib="Input" text="Password" />
  <Instance lib="Button" text="Sign In" />
</Frame>'
```

**Instance types:**
- `<Instance lib="Button" />` — looks up component from registry (auto-scanned on first render)
- `<Instance key="abc123" />` — imports library component directly by key
- `<Instance name="Button" />` — finds local component by exact name on current page
- `<Instance component="1:234" />` — uses local component by Figma node ID

**Aliases:** `node src/index.js lib alias "btn" "Button / Primary"` — then use `<Instance lib="btn" />`

**Key rule:** Library components from team libraries are discovered from instances already on canvas. Run `lib scan` to populate.

---

## Creating Webpages

**First discover the DS, then build using those values:**

```bash
# 1. Discover
node src/index.js ds vars
node src/index.js lib list

# 2. Create using discovered variable names and components
node src/index.js render '<Frame name="Landing Page" w={1440} flex="col" bg="<discovered-page-bg>">
  <Frame name="Hero" w="fill" h={800} flex="col" justify="center" items="center" gap={24} p={80}>
    <Text size={64} weight="bold" color="<discovered-heading-color>">Headline</Text>
    <Instance lib="Button" text="Get Started" />
  </Frame>
  <Frame name="Features" w="fill" flex="row" gap={40} p={80} bg="<discovered-section-bg>">
    <Frame flex="col" gap={12} grow={1}><Text size={24} weight="bold" color="<discovered-heading-color>">Feature 1</Text></Frame>
  </Frame>
</Frame>'
```

---

## JSX Syntax (render command)

```jsx
// Layout
flex="row"        // or "col"
gap={16}
p={24}            // padding all sides
px={16} py={8}    // padding x/y

// Size
w={320} h={200}   // fixed
w="fill"          // fill parent

// Appearance (use DS variable names from ds vars!)
bg="<var-name>"   // fill color via variable name (preferred)
bg="#fff"         // fill color via hex (auto-binds if variable matches)
rounded={16}      // corner radius
stroke="<var-name>" // stroke color via variable name

// Text
<Text size={18} weight="bold" color="<var-name>">Hello</Text>
```

**Common mistakes:**
```
WRONG                    RIGHT
layout="horizontal"   →  flex="row"
padding={24}          →  p={24}
fill="#fff"           →  bg="#fff"
cornerRadius={12}     →  rounded={12}
bg="#hardcoded"       →  bg="<name-from-ds-vars>"
```

---

## Key Rules

1. **DISCOVER FIRST** — always run `ds vars` and `lib list` before creating anything
2. **Use variable names** — never hardcode hex when a DS variable exists
3. **Use existing components** — check `lib list` before building from scratch
4. **Always use `render` for frames** — has smart positioning
5. **Never use `eval` to create** — no positioning, overlaps at (0,0)
6. **Never use `npx figma-use render`** — no smart positioning
7. **For multiple frames:** Use `render-batch`
8. **Convert to components:** `node to-component` after creation

---

## Onboarding ("Initiate Project")

**Never show terminal commands to users.** Run silently, give friendly feedback.

1. Run `npm install` silently
2. Ask connection mode (Yolo or Safe)
3. Run `node src/index.js connect` (or `--safe`)
4. When connected, **immediately run `ds info`** to discover what design system is available
5. If no DS found, ask user: "No design system detected. Would you like to add one (shadcn, tailwind) or link a library?"
6. Say: "Connected! I found [X components] and [Y color variables]. What would you like to create?"

If permission error (macOS): System Settings → Privacy → Full Disk Access → Add Terminal

---

## Variable Visualization

"Show colors on canvas" / "display variables" / "create palette":
```bash
node src/index.js var visualize              # All collections
node src/index.js var visualize "primitives" # Filter
```

Creates color swatches bound to variables.

---

## Website Recreation

```bash
node src/index.js recreate-url "https://example.com" --name "Page"
node src/index.js screenshot-url "https://example.com"
```

---

## Speed Daemon

`connect` auto-starts daemon for 10x faster commands.

```bash
node src/index.js daemon status
node src/index.js daemon restart
```
