# Notes Frontend (Astro)

A modern, minimalistic light-themed Notes app built with Astro. Users can:
- Create notes
- Edit notes
- Delete notes
- List/View notes
- Search notes

The app is backend-ready and will interface with a `notes_database` service via a simple REST API when available. Until then, it uses a robust localStorage mock so the UI works fully offline.

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
  components/
    Header.astro
    NoteCard.astro
    NoteEditorModal.astro
    NotesList.astro
    Sidebar.astro
    ThemeToggle.astro
  layouts/
    Layout.astro
  pages/
    index.astro
  services/
    api.ts
  state/
    store.ts
  styles/
    theme.css
  types.ts
```

## API Integration

By default, the app uses a localStorage-backed mock API. To connect a backend:

- Provide an environment variable `NOTES_API_BASE` at build/runtime (e.g., via Astro adapter env) or set `window.__NOTES_API_BASE__` before scripts run. Example expected endpoints:
  - GET    {NOTES_API_BASE}/notes?query=...
  - GET    {NOTES_API_BASE}/notes/:id
  - POST   {NOTES_API_BASE}/notes
  - PATCH  {NOTES_API_BASE}/notes/:id
  - DELETE {NOTES_API_BASE}/notes/:id

If network requests fail or are not configured, the app falls back to the mock API seamlessly.

## Keyboard Shortcuts

- Cmd/Ctrl + K: focus the search box.
- Cmd/Ctrl + Enter: save note in the editor.
- Esc: close the editor.

## Theming

Primary: #3b82f6
Secondary: #64748b
Accent: #f59e42

Global CSS variables and styles are in `src/styles/theme.css`.
