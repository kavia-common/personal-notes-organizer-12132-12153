/**
 * PUBLIC_INTERFACE
 * API client for the notes backend. This file provides a fetch-based client
 * targeting a future 'notes_database' service and a localStorage-backed mock
 * when the backend is not available. No hard-coded endpoints; uses environment
 * variable NOTES_API_BASE if provided by deployment environment.
 *
 * All functions return Promises and handle graceful fallback to mock store.
 */

import type { CreateNoteInput, Note, NoteID, UpdateNoteInput } from "../types";
import { uid } from "../types";

const STORAGE_KEY = "notes_app_data_v1";

/**
 * PUBLIC_INTERFACE
 * NotesAPI defines the operations supported by the front-end.
 */
export interface NotesAPI {
  list(query?: string): Promise<Note[]>;
  get(id: NoteID): Promise<Note | null>;
  create(input: CreateNoteInput): Promise<Note>;
  update(id: NoteID, input: UpdateNoteInput): Promise<Note>;
  remove(id: NoteID): Promise<void>;
}

/**
 * Backend-aware implementation. Uses fetch to call a REST API:
 * - GET    /notes?query=...
 * - GET    /notes/:id
 * - POST   /notes
 * - PATCH  /notes/:id
 * - DELETE /notes/:id
 *
 * If fetch fails (network/connection), it falls back to the mock.
 */
function createBackendClient(baseUrl: string, mock: NotesAPI): NotesAPI {
  async function safeFetch(input: RequestInfo, init?: RequestInit) {
    try {
      const res = await fetch(input, init);
      // Treat non-2xx as errors that trigger fallback to mock to keep app usable offline
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res;
    } catch {
      // fallback to mock layer
      return null;
    }
  }

  return {
    async list(query?: string): Promise<Note[]> {
      const q = query ? `?query=${encodeURIComponent(query)}` : "";
      const res = await safeFetch(`${baseUrl}/notes${q}`);
      if (!res) return mock.list(query);
      const data = (await res.json()) as Note[];
      return data;
    },
    async get(id: NoteID): Promise<Note | null> {
      const res = await safeFetch(`${baseUrl}/notes/${encodeURIComponent(id)}`);
      if (!res) return mock.get(id);
      if (res.status === 404) return null;
      return (await res.json()) as Note;
    },
    async create(input: CreateNoteInput): Promise<Note> {
      const res = await safeFetch(`${baseUrl}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res) return mock.create(input);
      return (await res.json()) as Note;
    },
    async update(id: NoteID, input: UpdateNoteInput): Promise<Note> {
      const res = await safeFetch(`${baseUrl}/notes/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res) return mock.update(id, input);
      return (await res.json()) as Note;
    },
    async remove(id: NoteID): Promise<void> {
      const res = await safeFetch(`${baseUrl}/notes/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res) return mock.remove(id);
      return;
    },
  };
}

/**
 * LocalStorage-backed mock store to support standalone UI and offline use.
 */
function createLocalMock(): NotesAPI {
  function read(): Note[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seed(); // initial demo notes
      const arr = JSON.parse(raw) as Note[];
      return Array.isArray(arr) ? arr : seed();
    } catch {
      return seed();
    }
  }
  function write(notes: Note[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  }
  function seed(): Note[] {
    const now = new Date().toISOString();
    const data: Note[] = [
      {
        id: uid(),
        title: "Welcome to Notes",
        content:
          "This is a demo note. Use the + New Note button to create your own. Edit, search, and delete as needed.",
        tags: ["welcome", "demo"],
        createdAt: now,
        updatedAt: now,
      },
      {
        id: uid(),
        title: "Keyboard Tips",
        content:
          "Use Ctrl/Cmd+K to focus search. Use Ctrl/Cmd+Enter to save in the editor.",
        tags: ["tips"],
        createdAt: now,
        updatedAt: now,
      },
    ];
    write(data);
    return data;
  }

  return {
    async list(query?: string): Promise<Note[]> {
      const all = read().sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
      if (!query) return all;
      const q = query.toLowerCase();
      return all.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.content.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q)),
      );
    },
    async get(id: NoteID): Promise<Note | null> {
      const note = read().find((n) => n.id === id) || null;
      return note;
    },
    async create(input: CreateNoteInput): Promise<Note> {
      const now = new Date().toISOString();
      const newNote: Note = {
        id: uid(),
        title: input.title || "Untitled",
        content: input.content || "",
        tags: input.tags || [],
        createdAt: now,
        updatedAt: now,
      };
      const all = read();
      all.unshift(newNote);
      write(all);
      return newNote;
    },
    async update(id: NoteID, input: UpdateNoteInput): Promise<Note> {
      const all = read();
      const idx = all.findIndex((n) => n.id === id);
      if (idx === -1) throw new Error("Note not found");
      const updated: Note = {
        ...all[idx],
        ...input,
        updatedAt: new Date().toISOString(),
      };
      all[idx] = updated;
      write(all);
      return updated;
    },
    async remove(id: NoteID): Promise<void> {
      const all = read();
      const next = all.filter((n) => n.id !== id);
      write(next);
    },
  };
}

/**
 * PUBLIC_INTERFACE
 * Factory returning a NotesAPI that prefers backend when available.
 * Uses env var NOTES_API_BASE if present on window.__NOTES_API_BASE__ or import.meta.env.
 */
export function getNotesAPI(): NotesAPI {
  // Find base URL from env or window global. Frontend only; do not hard-code.
  const base =
    (typeof window !== "undefined" && (window as any).__NOTES_API_BASE__) ||
    (import.meta as any).env?.NOTES_API_BASE ||
    "";

  const mock = createLocalMock();
  if (!base) return mock;

  return createBackendClient(base, mock);
}
