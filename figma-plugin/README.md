# FrameVault Figma Plugin

Insert any of FrameVault's **300+ animated WebGL shaders, 3D orbs, cubes, carousels, and interactive backgrounds** directly onto your Figma canvas — complete with live 60fps preview inside Figma and automatic **Figma MCP + FrameVault MCP** handover metadata.

## How It Works (Same Workflow as HorizonX)
1. **Sign in** inside Figma using your FrameVault All-Access license key (`OK-PRO-...`).
2. **Browse & Live Preview** all 300 components directly inside Figma.
3. **Insert into Figma** — captures a crisp 2× frame from the live WebGL/Canvas/DOM render and inserts a native **Figma Component** tagged with:
   - `FrameVault / <Section> / <Name> [<id>]` layer naming
   - `node.description` with exact FrameVault MCP handover instructions (`get_component_code({ id, format: "tsx" })`)
   - Native Figma `pluginData` (`framevault_id`, `framevault_mcp_url`)
4. **Vibe-Code Handover** — when Cursor, Claude Code, or Antigravity reads your Figma design via **Figma MCP**, it sees the FrameVault tag and automatically fetches the real animated **React `.tsx`** or **HTML** code via **FrameVault MCP**.

## Install Locally in Figma Desktop (30 Seconds)
1. Open **Figma Desktop**.
2. Go to **Plugins → Development → Import plugin from manifest...**
3. Select `figma-plugin/manifest.json` from this repository.
4. Run **Plugins → Development → FrameVault — 300+ Animated Components & Shaders**.
5. Paste your FrameVault license key (`OK-PRO-...`) and start inserting components!

## Publishing to Figma Community
1. Open Figma Desktop → **Plugins → Development → Manage plugins in development**.
2. Click `...` next to **FrameVault** → **Publish**.
3. Upload an icon (128×128) and cover image (1920×960) and submit for Figma Community review.
