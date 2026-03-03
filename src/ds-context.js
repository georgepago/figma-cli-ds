import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.figma-ds-cli');
const DS_CONTEXT_FILE = join(CONFIG_DIR, 'ds-context.json');
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Load DS context from cache file.
 * Returns null if no cache exists.
 */
export function loadDSContext() {
  ensureDir();
  if (!existsSync(DS_CONTEXT_FILE)) return null;
  try {
    return JSON.parse(readFileSync(DS_CONTEXT_FILE, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * Save DS context to cache file.
 */
export function saveDSContext(ctx) {
  ensureDir();
  writeFileSync(DS_CONTEXT_FILE, JSON.stringify(ctx, null, 2), 'utf8');
}

/**
 * Build DS context by scanning variables from Figma.
 * Requires a connected FigmaClient instance.
 */
export async function buildDSContext(client) {
  // Fetch all color variables with their resolved values
  const varData = await client.eval(`
    (async function() {
      const variables = {};
      const nameToHex = {};
      const hexToVarName = {};
      const collections = {};

      // Get all collections
      const colls = figma.variables.getLocalVariableCollections();
      for (const c of colls) {
        collections[c.id] = { name: c.name, modes: c.modes };
      }

      // Get all local COLOR variables with resolved values
      const localVars = figma.variables.getLocalVariables('COLOR');
      for (const v of localVars) {
        try {
          let val = Object.values(v.valuesByMode)[0];
          let depth = 0;
          while (val && val.type === 'VARIABLE_ALIAS' && depth < 5) {
            const aliased = figma.variables.getVariableById(val.id);
            if (!aliased) break;
            val = Object.values(aliased.valuesByMode)[0];
            depth++;
          }
          if (val && typeof val.r === 'number') {
            const r = Math.round(val.r * 255);
            const g = Math.round(val.g * 255);
            const b = Math.round(val.b * 255);
            const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
            const collName = collections[v.variableCollectionId]?.name || 'unknown';

            variables[v.name] = { hex, collection: collName, type: 'COLOR' };
            nameToHex[v.name] = hex;
            // Only store first variable for each hex (prefer shorter/more specific names)
            if (!hexToVarName[hex] || v.name.length < hexToVarName[hex].length) {
              hexToVarName[hex] = v.name;
            }
          }
        } catch(e) {}
      }

      // Get library variable info
      let libraryNames = [];
      try {
        const libColls = await figma.teamLibrary.getAvailableLibraryVariableCollectionsAsync();
        for (const coll of libColls) {
          if (coll.libraryName && !libraryNames.includes(coll.libraryName)) {
            libraryNames.push(coll.libraryName);
          }
          try {
            const libVars = await figma.teamLibrary.getVariablesInLibraryCollectionAsync(coll.key);
            for (const lv of libVars) {
              if (lv.resolvedType === 'COLOR') {
                try {
                  const imported = await figma.variables.importVariableByKeyAsync(lv.key);
                  if (imported) {
                    let val = Object.values(imported.valuesByMode)[0];
                    let depth = 0;
                    while (val && val.type === 'VARIABLE_ALIAS' && depth < 5) {
                      const aliased = figma.variables.getVariableById(val.id);
                      if (!aliased) break;
                      val = Object.values(aliased.valuesByMode)[0];
                      depth++;
                    }
                    if (val && typeof val.r === 'number') {
                      const r = Math.round(val.r * 255);
                      const g = Math.round(val.g * 255);
                      const b = Math.round(val.b * 255);
                      const hex = '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');

                      variables[imported.name] = { hex, collection: coll.name || 'library', type: 'COLOR' };
                      nameToHex[imported.name] = hex;
                      if (!hexToVarName[hex] || imported.name.length < hexToVarName[hex].length) {
                        hexToVarName[hex] = imported.name;
                      }
                    }
                  }
                } catch(e) {}
              }
            }
          } catch(e) {}
        }
      } catch(e) {}

      // Count collections info
      const collectionSummary = Object.values(collections).map(c => ({
        name: c.name,
        modes: c.modes.map(m => m.name)
      }));

      return {
        variables,
        nameToHex,
        hexToVarName,
        libraryNames,
        collections: collectionSummary,
        variableCount: Object.keys(variables).length
      };
    })()
  `);

  const ctx = {
    timestamp: Date.now(),
    ...varData
  };

  saveDSContext(ctx);
  return ctx;
}

/**
 * Return cached DS context if fresh enough, otherwise rebuild.
 * Pass client=null to only use cache (won't refresh).
 */
export async function ensureDSContext(client = null) {
  const cached = loadDSContext();
  if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
    return cached;
  }
  if (!client) return cached; // Return stale cache if no client
  return await buildDSContext(client);
}

/**
 * Resolve a color value — either hex string or variable name.
 * Returns { hex, varName } or null.
 */
export function resolveColorValue(value, dsContext) {
  if (!value) return null;

  // Already a hex color
  if (value.startsWith('#')) {
    const hex = value.toLowerCase();
    const varName = dsContext?.hexToVarName?.[hex] || null;
    return { hex, varName };
  }

  // Try as variable name
  if (dsContext?.nameToHex) {
    // Exact match
    if (dsContext.nameToHex[value]) {
      return { hex: dsContext.nameToHex[value], varName: value };
    }

    // Case-insensitive match
    const lower = value.toLowerCase();
    for (const [name, hex] of Object.entries(dsContext.nameToHex)) {
      if (name.toLowerCase() === lower) {
        return { hex, varName: name };
      }
    }

    // Partial match (e.g., "blue/500" matches "primitives/blue/500")
    for (const [name, hex] of Object.entries(dsContext.nameToHex)) {
      if (name.toLowerCase().endsWith('/' + lower)) {
        return { hex, varName: name };
      }
    }
  }

  return null;
}

/**
 * Get a formatted summary of the DS context.
 */
export function getDSSummary(dsContext) {
  if (!dsContext) return 'No design system context available. Run: ds refresh';

  const age = Date.now() - dsContext.timestamp;
  const ageStr = age < 60000 ? 'just now'
    : age < 3600000 ? `${Math.floor(age / 60000)} minutes ago`
    : `${Math.floor(age / 3600000)} hours ago`;

  const lines = [];
  lines.push(`Design System Context`);
  lines.push(`  Libraries: ${dsContext.libraryNames?.length ? dsContext.libraryNames.join(', ') : 'none detected'}`);
  lines.push(`  Color Variables: ${dsContext.variableCount || 0}`);

  if (dsContext.collections?.length) {
    for (const c of dsContext.collections) {
      const modes = c.modes?.length > 1 ? ` (${c.modes.join(', ')})` : '';
      lines.push(`  Collection: ${c.name}${modes}`);
    }
  }

  lines.push(`  Last scanned: ${ageStr}`);

  // Show top variable families (group by prefix)
  if (dsContext.nameToHex) {
    const families = {};
    for (const name of Object.keys(dsContext.nameToHex)) {
      const prefix = name.split('/')[0];
      families[prefix] = (families[prefix] || 0) + 1;
    }
    const topFamilies = Object.entries(families)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => `${name} (${count})`)
      .join(', ');
    if (topFamilies) {
      lines.push(`  Color families: ${topFamilies}`);
    }
  }

  return lines.join('\n');
}

/**
 * Invalidate the DS context cache.
 */
export function invalidateDSContext() {
  if (existsSync(DS_CONTEXT_FILE)) {
    try {
      const ctx = JSON.parse(readFileSync(DS_CONTEXT_FILE, 'utf8'));
      ctx.timestamp = 0; // Force refresh on next ensureDSContext
      writeFileSync(DS_CONTEXT_FILE, JSON.stringify(ctx, null, 2), 'utf8');
    } catch {}
  }
}
