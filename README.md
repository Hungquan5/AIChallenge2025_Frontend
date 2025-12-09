# AIChallenge2025 Frontend

An interactive React + TypeScript + Vite frontend for **video search and retrieval** in the context of **AIChallenge 2025 / VBS-style** tasks.

The app provides:

- A rich search interface (manual + chatbot modes)
- Ranked video/keyframe result browsing
- Frame-level detail views & video playback
- Live broadcast feed and submission utilities connected to a **DRES** backend
- Keyboard shortcuts and productivity tools tailored for evaluation sessions

---

## Features

### 🔌 Session & Backend Connection

- **Connection Prompt** on startup:
  - Username
  - DRES Session ID
  - DRES Base URL (e.g. `https://...`)
- Integrates with a `DresService` helper to configure backend endpoints.
- Uses WebSockets to:
  - Track connection status
  - Receive live broadcast messages
  - Show number of active users

### 🔍 Search Experience

- **Search Modes** (controlled by `TopControlBar`):
  - `manual` – standard search form via `InputPanel`
  - `chatbot` – conversational mode via `Chatbot` / `BubbleChat`
- **Model selection**:
  - Toggle different retrieval/vision models through a `ModelSelection` panel.
  - The number of enabled models is shown in the top bar.
- **Auto-translate toggle**:
  - Turn on/off automatic translation of queries.

### 📊 Results & Ranking

- Backed by an `appState` hook and result types (`ResultItem`).
- Multiple **view modes**:
  - Sort results by confidence
  - Group results by video
- Pagination and navigation through `PaginationContainer`.
- **Virtualized lists** (via `react-virtualized` / `react-window`) for efficient rendering of large result sets.
- Skeleton loading states via `react-loading-skeleton`.

### 🧩 Object Filtering

- **ObjectFilterDropdown** and `useObjectFilter`:
  - Filter results by detected objects.
  - Fetch object metadata and global object counts.
  - Combine with ranking modes to quickly focus on relevant shots.

### 🎥 Detail Views & Video Playback

- **VideoPanel**:
  - Video playback using:
    - `@mux/mux-player`
    - `media-chrome`
    - `hls.js`
    - `react-player`
  - Designed for streaming/segment-based video.
- **FramesPanel**:
  - Shows relative frames/keyframes for the selected result.
- **FrameDetailModal**:
  - Modal with more detailed information per frame.
- Keyframe data is provided through a `useKeyframeLoader` hook.

### ✅ Submissions & Feedback

- **SubmissionStatusPanel**:
  - Handles DRES submissions for selected results.
  - Shows recent submission status/feedback.
- **DislikePanel**:
  - Track & manage disliked results.
  - Clear dislikes or restore (undislike) items.
- **Broadcast feed integration**:
  - Submit selected results from the live feed.
  - Support for VQA-style questions per item.

### 📡 Live Broadcast Feed

Provided by `BroadcastFeed` inside `AppShell`:

- Bottom slide-up panel that:
  - Displays live broadcast messages and results
  - Shows active user count
- Actions:
  - Clear broadcast feed
  - Export broadcast feed
  - Toggle **track mode** (e.g. follow current item)
- Supports:
  - Click / double-click interactions on broadcast results
  - Context menus (right click)
  - Triggering similarity search from broadcast cards

### 🔔 Notifications & Shortcuts

- **NotificationManager**:
  - `NotificationContainer` component for toasts/banners.
  - Dedicated notifications for:
    - New video events
    - DRES submission results
- **Keyboard shortcuts** via `useShortcuts`:
  - Toggle view mode
  - Focus search input
  - Toggle auto-translate
  - Open/close dislike panel
  - Go to page
  - Toggle and clear broadcast feed
  - Close modals, etc.

---

## Tech Stack

- **Language**: TypeScript
- **Framework**: React 19
- **Bundler / Dev server**: Vite 7
- **Styling**:
  - Tailwind CSS 4 (`@tailwindcss/vite`)
  - Custom `App.css` / `index.css`
- **UI / UX**:
  - `lucide-react` icons
  - `swiper` for carousels
  - `react-sliding-pane`
  - `react-loading-skeleton`
- **Media & Video**:
  - `@mux/mux-player`
  - `media-chrome`
  - `hls.js`
  - `react-player`
- **Performance**:
  - `react-virtualized`
  - `react-window`
  - `react-virtualized-auto-sizer`
- **Tooling**:
  - ESLint 9 (`@eslint/js`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)
  - TypeScript ~5.8
  - Vite React plugin

---

## Project Structure (high-level)

```text
AIChallenge2025_Frontend/
├─ nginx_config/                # Example Nginx configuration for serving the built app
├─ public/                      # Static assets
├─ src/
│  ├─ layouts/
│  │  ├─ AppShell.tsx          # Main layout container (left/right panels + broadcast feed)
│  │  └─ TopControlBar.tsx     # Global controls: view mode, search mode, models, filters
│  ├─ features/
│  │  ├─ search/               # Search UI, InputPanel, model selection, hooks
│  │  ├─ results/              # ResultsPanel, pagination, object filter, view modes
│  │  ├─ detail_info/          # VideoPanel, FramesPanel, FrameDetailModal
│  │  ├─ chat/                 # Chatbot and chat bubble components
│  │  ├─ submit/               # SubmissionStatusPanel and submission logic
│  │  ├─ dislike/              # DislikePanel and related state
│  │  ├─ notifications/        # NotificationManager & containers
│  │  └─ communicate/          # WebSocket hooks, broadcast feed, ConnectionPrompt, session
│  ├─ hooks/                   # Shared app & modal state, event handlers
│  ├─ utils/                   # DRES service helpers, shortcuts, etc.
│  ├─ App.tsx                  # Top-level app composition
│  └─ main.tsx                 # React entry point
├─ index.html
├─ package.json
├─ tsconfig*.json
├─ vite.config.ts
└─ eslint.config.js
````

*Note: exact file layout may evolve; see the `src/` directory for the most up-to-date structure.*

---

## Getting Started

### Prerequisites

* **Node.js** (LTS recommended, e.g. ≥ 18)
* **npm** (or a compatible package manager such as pnpm / yarn)

### Installation

```bash
# Clone the repository
git clone https://github.com/Hungquan5/AIChallenge2025_Frontend.git
cd AIChallenge2025_Frontend

# Install dependencies
npm install
```

### Development

Run the Vite dev server:

```bash
npm run dev
```

By default Vite prints a `Local` URL (usually `http://localhost:5173/`).

### Linting

```bash
npm run lint
```

### Build

Create an optimized production build:

```bash
npm run build
```

The compiled output will be generated in the `dist/` folder.

### Preview (local)

Serve the production build locally:

```bash
npm run preview
```

---

## Deployment

This is a standard Vite static build, so you can:

* Serve the `dist/` directory with any static web server, **or**
* Deploy behind Nginx using the sample configuration under `nginx_config/`.

A typical deployment workflow:

1. Build the app:

   ```bash
   npm run build
   ```

2. Copy the `dist/` folder to your web server.

3. Configure Nginx (or another reverse proxy) to:

   * Serve the static files from `dist/`.
   * Optionally proxy WebSocket and API/DRES traffic to your backend.

---

## Usage Overview

1. Open the app in your browser.
2. Fill in the **Connection Prompt**:

   * Username
   * DRES Session ID
   * DRES Base URL
3. After connection:

   * Choose **search mode** (Manual vs Chatbot).
   * Select models and enable **auto-translate** if needed.
   * Submit queries and browse ranked results.
4. Use:

   * **Object filters** to narrow down results by detected objects.
   * **View modes** to switch between “sort by confidence” and “group by video”.
   * **Video & frame panels** to inspect hits at frame level.
5. Use the **broadcast feed** and **submission panel** during evaluation sessions to:

   * Track live results
   * Submit answers to DRES
   * Export or clear the feed as needed

---

## Contributing

This repository is currently tailored for the AIChallenge 2025 team and workflows.
If you want to contribute improvements or bug fixes:

1. Fork the repo
2. Create a feature branch
3. Open a Pull Request describing:

   * What you changed
   * Why it’s useful
   * How to test it

---

## License

No explicit license file is present yet.
Until a license is added, consider this project **all rights reserved** and contact the maintainers before reusing the code in other projects.

---
