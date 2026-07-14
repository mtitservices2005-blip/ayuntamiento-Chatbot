const moduleRegistry = new Map();

export function registerModule(manifest) {
  if (!manifest?.id || !manifest?.dynamicEntry) {
    throw new Error('V2 module manifests require id and dynamicEntry.');
  }
  moduleRegistry.set(manifest.id, manifest);
}

export async function loadModule(moduleId) {
  const manifest = moduleRegistry.get(moduleId);
  if (!manifest) {
    throw new Error(`V2 module not registered: ${moduleId}`);
  }
  return import(manifest.dynamicEntry);
}

export function listRegisteredModules() {
  return Array.from(moduleRegistry.values());
}
