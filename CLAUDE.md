# figma-ds-cli

CLI that controls Figma Desktop directly. No API key needed.

## Quick Reference

| User says | Command |
|-----------|---------|
| "connect to figma" | `node src/index.js connect` |
| "add shadcn colors" | `node src/index.js tokens preset shadcn` |
| "add tailwind colors" | `node src/index.js tokens tailwind` |
| "show colors on canvas" | `node src/index.js var visualize` |
| "create cards/buttons" | `render-batch` + `node to-component` |
| "create a rectangle/frame" | `node src/index.js render '<Frame>...'` |
| "convert to component" | `node src/index.js node to-component "ID"` |
| "list variables" | `node src/index.js var list` |
| "find nodes named X" | `node src/index.js find "X"` |
| "what's on canvas" | `node src/index.js canvas info` |
| "export as PNG/SVG" | `node src/index.js export png` |
| "scan for components" | `node src/index.js lib scan` |
| "list library components" | `node src/index.js lib list` |
| "place a button" | `node src/index.js lib place "Button"` |

**Full command reference:** See REFERENCE.md

---

## Design Tokens

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

1. **Each component = separate frame** (NOT inside parent gallery)
2. **Convert to component** after creation
3. **Use variables** for colors

```bash
# Step 1: Create separately
node src/index.js render-batch '[
  "<Frame name=\"Card 1\" w={320} h={200} bg=\"#18181b\" rounded={12} flex=\"col\" p={24}><Text color=\"#fff\">Title</Text></Frame>",
  "<Frame name=\"Card 2\" w={320} h={200} bg=\"#18181b\" rounded={12} flex=\"col\" p={24}><Text color=\"#fff\">Title</Text></Frame>"
]'

# Step 2: Convert
node src/index.js node to-component "ID1" "ID2"

# Step 3: Bind variables
node src/index.js bind fill "zinc/900" -n "ID1"
```

---

## Using Library Components

When creating screens, prefer using existing components from the user's design library instead of building from scratch.

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
```bash
node src/index.js render '<Frame name="Login" w={400} flex="col" gap={16} p={32} bg="#fff" rounded={16}>
  <Text size={24} weight="bold" color="#000">Sign In</Text>
  <Instance lib="Input" text="Email" />
  <Instance lib="Input" text="Password" />
  <Instance lib="Button" text="Sign In" />
</Frame>'
```

**Instance types:**
- `<Instance lib="Button" />` — looks up component from registry (run `lib scan` first)
- `<Instance key="abc123" />` — imports library component directly by key
- `<Instance name="Button" />` — finds local component by exact name on current page
- `<Instance component="1:234" />` — uses local component by Figma node ID

**Aliases:** `node src/index.js lib alias "btn" "Button / Primary"` — then use `<Instance lib="btn" />`

**Key rule:** Always run `lib scan` first to populate the registry. Library components from team libraries are discovered from instances already on canvas.

---

## Creating Webpages

Create ONE parent frame with vertical auto-layout containing all sections:

```bash
node src/index.js render '<Frame name="Landing Page" w={1440} flex="col" bg="#0a0a0f">
  <Frame name="Hero" w="fill" h={800} flex="col" justify="center" items="center" gap={24} p={80}>
    <Text size={64} weight="bold" color="#fff">Headline</Text>
    <Frame bg="#3b82f6" px={32} py={16} rounded={8}><Text color="#fff">CTA</Text></Frame>
  </Frame>
  <Frame name="Features" w="fill" flex="row" gap={40} p={80} bg="#111">
    <Frame flex="col" gap={12} grow={1}><Text size={24} weight="bold" color="#fff">Feature 1</Text></Frame>
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

// Appearance
bg="#fff"         // fill color
rounded={16}      // corner radius
stroke="#000"     // stroke color

// Text
<Text size={18} weight="bold" color="#000">Hello</Text>
```

**Common mistakes:**
```
WRONG                    RIGHT
layout="horizontal"   →  flex="row"
padding={24}          →  p={24}
fill="#fff"           →  bg="#fff"
cornerRadius={12}     →  rounded={12}
```

---

## Key Rules

1. **Always use `render` for frames** - has smart positioning
2. **Never use `eval` to create** - no positioning, overlaps at (0,0)
3. **Never use `npx figma-use render`** - no smart positioning
4. **For multiple frames:** Use `render-batch`
5. **Convert to components:** `node to-component` after creation

---

## Onboarding ("Initiate Project")

**Never show terminal commands to users.** Run silently, give friendly feedback.

1. Run `npm install` silently
2. Ask connection mode (Yolo or Safe)
3. Run `node src/index.js connect` (or `--safe`)
4. When connected, say: "Connected! What would you like to create?"

If permission error (macOS): System Settings → Privacy → Full Disk Access → Add Terminal

---

## Variable Visualization

"Show colors on canvas" / "display variables" / "create palette":
```bash
node src/index.js var visualize              # All collections
node src/index.js var visualize "primitives" # Filter
```

Creates shadcn-style color swatches bound to variables.

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
