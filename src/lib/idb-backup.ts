import { openDB, type IDBPDatabase } from "idb";

import type { PortfolioWithRelations } from "@/types";

const DB_NAME = "foliocraft-backup";
const DB_VERSION = 1;
const STORE_NAME = "portfolios";

interface BackupEntry {
  /** Portfolio ID */
  id: string;
  /** Full portfolio state snapshot */
  data: PortfolioWithRelations;
  /** Timestamp of the backup */
  savedAt: number;
  /** Whether this backup has been synced to server */
  synced: boolean;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Save a portfolio snapshot to IndexedDB.
 * Called on every mutation (debounced by the caller).
 */
export async function saveBackup(portfolio: PortfolioWithRelations): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const entry: BackupEntry = {
      id: portfolio.id,
      data: structuredClone(portfolio),
      savedAt: Date.now(),
      synced: false,
    };

    await db.put(STORE_NAME, entry);
  } catch {
    // IndexedDB can fail in private browsing — fail silently
  }
}

/**
 * Mark a portfolio backup as synced (server save succeeded).
 */
export async function markBackupSynced(portfolioId: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const entry = await db.get(STORE_NAME, portfolioId) as BackupEntry | undefined;
    if (entry) {
      entry.synced = true;
      await db.put(STORE_NAME, entry);
    }
  } catch {
    // fail silently
  }
}

/**
 * Get an unsynced backup for a portfolio if one exists.
 * Returns null if no backup or backup is already synced.
 */
export async function getUnsyncedBackup(portfolioId: string): Promise<{ data: PortfolioWithRelations; savedAt: number } | null> {
  try {
    const db = await getDb();
    if (!db) return null;

    const entry = await db.get(STORE_NAME, portfolioId) as BackupEntry | undefined;
    if (!entry || entry.synced) return null;

    return { data: entry.data, savedAt: entry.savedAt };
  } catch {
    return null;
  }
}

/**
 * Delete a portfolio backup from IndexedDB.
 */
export async function clearBackup(portfolioId: string): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;
    await db.delete(STORE_NAME, portfolioId);
  } catch {
    // fail silently
  }
}
