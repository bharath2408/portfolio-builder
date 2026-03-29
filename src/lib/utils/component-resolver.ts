/**
 * Get a value from an object using a dot-separated path.
 * e.g., getByPath({ a: { b: 1 } }, "a.b") => 1
 */
export function getByPath(obj: Record<string, unknown>, path: string): unknown {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Set a value on an object using a dot-separated path.
 * Mutates the object in place.
 */
export function setByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
  const keys = path.split(".");
  let current: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (current[key] == null || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key] as Record<string, unknown>;
  }
  const lastKey = keys[keys.length - 1];
  if (lastKey) current[lastKey] = value;
}

/**
 * Deep clone an object using structured clone.
 */
export function deepClone<T>(obj: T): T {
  return structuredClone(obj);
}

/**
 * Resolve a component instance by merging master data with variant and instance overrides.
 */
export function resolveComponentInstance(
  masterData: Record<string, unknown>,
  variant: { overrides: Record<string, unknown> } | null,
  instanceOverrides: Record<string, unknown>,
  hiddenLayers: string[],
): Record<string, unknown> {
  const result = deepClone(masterData);

  // Apply variant overrides
  if (variant) {
    for (const [path, value] of Object.entries(variant.overrides)) {
      setByPath(result, path, value);
    }
  }

  // Apply instance overrides (highest priority)
  for (const [path, value] of Object.entries(instanceOverrides)) {
    setByPath(result, path, value);
  }

  // Filter out hidden layers from children
  if (hiddenLayers.length > 0 && Array.isArray(result.children)) {
    result.children = (result.children as Array<Record<string, unknown>>).filter(
      (child) => !hiddenLayers.includes(child.id as string)
    );
  }

  return result;
}
