/**
 * Simple browser store for the Notes app.
 * Keeps an in-memory copy of notes and provides methods to refresh & mutate.
 */
import type { Note } from "../types";
import type { NotesAPI } from "../services/api";
import { getNotesAPI } from "../services/api";

type Listener = () => void;

class NotesStore {
  private api: NotesAPI;
  private _notes: Note[] = [];
  private _query = "";
  private listeners: Listener[] = [];

  constructor() {
    this.api = getNotesAPI();
  }

  get notes() {
    return this._notes;
  }

  get query() {
    return this._query;
  }

  subscribe(fn: Listener) {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }
  private emit() {
    for (const l of this.listeners) l();
  }

  async refresh() {
    this._notes = await this.api.list(this._query);
    this.emit();
  }

  setQuery(q: string) {
    this._query = q;
    this.refresh();
  }

  async loadOne(id: string): Promise<Note | null> {
    return await this.api.get(id);
  }

  async create(input: { title: string; content: string; tags: string[] }) {
    await this.api.create(input);
    await this.refresh();
  }

  async update(id: string, input: { title?: string; content?: string; tags?: string[] }) {
    await this.api.update(id, input);
    await this.refresh();
  }

  async remove(id: string) {
    await this.api.remove(id);
    await this.refresh();
  }
}

// PUBLIC_INTERFACE
export const store = new NotesStore();
