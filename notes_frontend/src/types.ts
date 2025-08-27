/**
 * PUBLIC_INTERFACE
 * Defines shared types for the notes front-end app.
 */
export type NoteID = string;

/**
 * PUBLIC_INTERFACE
 * Represents a Note entity in the UI and via API.
 */
export interface Note {
  id: NoteID;
  title: string;
  content: string;
  tags: string[];
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/**
 * PUBLIC_INTERFACE
 * Create payload schema for a new note.
 */
export interface CreateNoteInput {
  title: string;
  content: string;
  tags: string[];
}

/**
 * PUBLIC_INTERFACE
 * Update payload schema for an existing note.
 */
export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
}

/**
 * Helper: format ISO dates as friendly text.
 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString();
}

/**
 * Helper: generate a simple UUIDv4-like id (fallback for mocks).
 */
export function uid(): string {
  // Not cryptographically secure; good enough for client mock ids
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    // biome-ignore lint/style/noParameterAssign: formula
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
