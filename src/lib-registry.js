import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.figma-ds-cli');
const REGISTRY_FILE = join(CONFIG_DIR, 'components.json');

function ensureDir() {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function loadRegistry() {
  ensureDir();
  if (!existsSync(REGISTRY_FILE)) {
    return { local: {}, library: {}, aliases: {} };
  }
  try {
    return JSON.parse(readFileSync(REGISTRY_FILE, 'utf8'));
  } catch {
    return { local: {}, library: {}, aliases: {} };
  }
}

export function saveRegistry(registry) {
  ensureDir();
  writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf8');
}

/**
 * Resolve a component name to { id, key, type } or null.
 * Priority: library > local > alias lookup.
 */
export function resolveComponent(name, registry) {
  if (!registry) registry = loadRegistry();

  // Direct match in library
  if (registry.library && registry.library[name]) {
    return { ...registry.library[name], type: 'library' };
  }

  // Direct match in local
  if (registry.local && registry.local[name]) {
    return { ...registry.local[name], type: 'local' };
  }

  // Try alias
  const normalized = name.toLowerCase().trim();
  if (registry.aliases && registry.aliases[normalized]) {
    const canonical = registry.aliases[normalized];
    return resolveComponent(canonical, registry);
  }

  // Fuzzy: case-insensitive partial match
  for (const [compName, data] of Object.entries(registry.library || {})) {
    if (compName.toLowerCase() === normalized) {
      return { ...data, type: 'library' };
    }
  }
  for (const [compName, data] of Object.entries(registry.local || {})) {
    if (compName.toLowerCase() === normalized) {
      return { ...data, type: 'local' };
    }
  }

  return null;
}

export function addLocalComponents(components, registry) {
  if (!registry) registry = loadRegistry();
  if (!registry.local) registry.local = {};

  for (const comp of components) {
    registry.local[comp.name] = {
      id: comp.id,
      key: comp.key || null,
      page: comp.page || null,
      description: comp.description || ''
    };
  }
  return registry;
}

export function addLibraryComponents(components, registry) {
  if (!registry) registry = loadRegistry();
  if (!registry.library) registry.library = {};

  for (const comp of components) {
    registry.library[comp.name] = {
      key: comp.key,
      libraryName: comp.libraryName || null,
      description: comp.description || ''
    };
  }
  return registry;
}

export function addAlias(alias, canonicalName, registry) {
  if (!registry) registry = loadRegistry();
  if (!registry.aliases) registry.aliases = {};
  registry.aliases[alias.toLowerCase().trim()] = canonicalName;
  return registry;
}

export function listComponents(registry, filter) {
  if (!registry) registry = loadRegistry();
  const results = [];

  for (const [name, data] of Object.entries(registry.library || {})) {
    if (filter && !name.toLowerCase().includes(filter.toLowerCase())) continue;
    results.push({ name, source: 'library', libraryName: data.libraryName, key: data.key, description: data.description });
  }
  for (const [name, data] of Object.entries(registry.local || {})) {
    if (filter && !name.toLowerCase().includes(filter.toLowerCase())) continue;
    results.push({ name, source: 'local', id: data.id, key: data.key, page: data.page, description: data.description });
  }

  return results;
}
