#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { ComponentLibraryIndex } from "./scanner.js";
import { buildRemixPrompt } from "./remix.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function resolvePaths(): { workspaceRoot: string; componentsDir: string } {
  const defaultWorkspaceRoot = path.resolve(__dirname, "..", "..");
  const argDirIdx = process.argv.indexOf("--dir");
  const argDir = argDirIdx !== -1 ? process.argv[argDirIdx + 1] : undefined;
  const envDir = process.env.ORIGINKIT_COMPONENTS_DIR;

  const componentsDir = path.resolve(
    argDir || envDir || path.join(defaultWorkspaceRoot, "designs")
  );
  const workspaceRoot = path.resolve(
    process.env.ORIGINKIT_WORKSPACE_ROOT || defaultWorkspaceRoot
  );
  return { workspaceRoot, componentsDir };
}

const { workspaceRoot, componentsDir } = resolvePaths();
const library = new ComponentLibraryIndex(workspaceRoot, componentsDir);

const server = new McpServer({
  name: "originkit-ui-mcp",
  version: "1.0.0",
});

// 1. search_components tool
server.tool(
  "search_components",
  "Search the workspace's existing OriginKit UI component library by natural-language query, category, engine, filename, tags, or comments. Always call this before generating UI from scratch.",
  {
    query: z
      .string()
      .describe(
        "Natural-language search query (e.g. 'glowing plasma orb', '3d carousel', 'violet particle tunnel', 'plush fur icon', or '*' to browse all)."
      ),
    category: z
      .string()
      .optional()
      .describe("Optional category filter (e.g. 'orbs', 'assets', 'carasols', 'cubes', 'backgrounds')."),
    engine: z
      .string()
      .optional()
      .describe("Optional rendering engine filter (e.g. 'WEBGL 3D', 'DOM 3D', 'CANVAS 2D')."),
    limit: z
      .number()
      .int()
      .min(1)
      .max(100)
      .optional()
      .describe("Maximum number of matches to return (default: 15)."),
  },
  async ({ query, category, engine, limit }) => {
    const all = library.getAll();
    const matches = library.search(query, { category, engine, limit });

    const payload = {
      componentsDir: library.getComponentsDir(),
      totalIndexed: all.length,
      query,
      matchCount: matches.length,
      results: matches.map(({ component, score, matchedFields }) => ({
        id: component.id,
        name: component.name,
        title: component.title,
        category: component.category,
        filename: component.filename,
        format: component.format,
        engine: component.engine,
        background: component.background,
        tags: component.tags.slice(0, 12),
        interactions: component.interactions,
        localImageCount: component.localImages.length,
        byteSize: component.byteSize,
        score,
        matchedFields,
      })),
    };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(payload, null, 2),
        },
      ],
    };
  }
);

// 2. get_component tool
server.tool(
  "get_component",
  "Fetch the exact raw source code directly from an existing component file by id or filename, paired with a structured Remix Prompt explaining how to adapt copy, colors, and framework cleanly without breaking layout or animations.",
  {
    id: z
      .string()
      .describe(
        "Component id (e.g. 'orbs/orb-1', 'assets/asset-2'), name (e.g. 'asset 1'), or relative filename (e.g. 'designs/orbs/orb 1/index.html')."
      ),
    targetFramework: z
      .string()
      .optional()
      .describe(
        "Optional target framework/stack to tailor the Remix Prompt (e.g. 'React + Tailwind', 'Next.js', 'Vue 3', 'Standalone HTML')."
      ),
  },
  async ({ id, targetFramework }) => {
    const comp = library.findByIdOrFilename(id);
    if (!comp) {
      const suggestions = library
        .search(id, { limit: 5 })
        .map((m) => `${m.component.id} (${m.component.title})`);
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Component not found for "${id}".${
              suggestions.length
                ? `\n\nClosest matches:\n- ${suggestions.join("\n- ")}`
                : " Call search_components with query '*' to list all available components."
            }`,
          },
        ],
      };
    }

    const rawSource = library.readRawSource(comp);
    const remixPrompt = buildRemixPrompt(comp, targetFramework);

    const metadata = {
      id: comp.id,
      name: comp.name,
      title: comp.title,
      category: comp.category,
      filename: comp.filename,
      format: comp.format,
      engine: comp.engine,
      background: comp.background,
      colors: comp.colors,
      shaderColors: comp.shaderColors,
      fonts: comp.fonts,
      interactions: comp.interactions,
      localImages: comp.localImages,
      byteSize: Buffer.byteLength(rawSource, "utf8"),
    };

    const formattedResponse = [
      `# Component: ${comp.title} (\`${comp.id}\`)`,
      "",
      "## Metadata",
      "```json",
      JSON.stringify(metadata, null, 2),
      "```",
      "",
      remixPrompt,
      "",
      `## Raw Source Code (\`${comp.filename}\`)`,
      `\`\`\`${comp.format}`,
      rawSource,
      "```",
    ].join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text: formattedResponse,
        },
      ],
    };
  }
);

// 3. ui://guidelines/design-system resource
server.resource(
  "design-system-guidelines",
  "ui://guidelines/design-system",
  {
    description:
      "Shared styling patterns, surface palettes, engine conventions, and safe adaptation guidelines dynamically extracted from the workspace's existing UI components.",
    mimeType: "text/markdown",
  },
  async (uri) => {
    const guide = library.buildDesignSystemGuide();
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: guide,
        },
      ],
    };
  }
);

async function main() {
  const initialCount = library.getAll(false).length;
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(
    `[originkit-ui-mcp] Indexed ${initialCount} components from ${componentsDir}`
  );
}

main().catch((err) => {
  console.error("[originkit-ui-mcp] Fatal startup error:", err);
  process.exit(1);
});
