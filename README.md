# Auction House SPA (Semester Project 2025)

A Vite + TypeScript single-page app for an auction marketplace.

## Features

- Client-side routing (`src/router/router.ts`)
- Authentication (login/register) with token storage in `src/storage`
- Listings: browse, search, filters, pagination, specific listing view with bids
- Profile: credits, listings, recent bids, wins; edit profile page
- Create/Edit/Delete listings with media, tags, description
- REST-style API abstraction in `src/services` + lightweight `apiClient`
- Offline-ready assets (service worker in `public/sw.js`)

## Deployment

- Netlify: 
- GitHub Repo: https://github.com/Simicedev/Semester-project-AuctionHouse2025
- Report/Docs: https://docs.google.com/document/d/16oo7-ckDntl1HmlCpdnCT6DKo_j-M28mC-ufVmr14DM/edit?usp=sharing
- Kanban: https://github.com/users/Simicedev/projects/14/views/1

## Tech Stack

- TypeScript
- Vite (dev/build tooling)
- Tailwind-like utility styles

## Getting Started

### Prerequisites

- Node.js 18+ (LTS recommended) and npm

### Install

```bash
npm install
```

### Development

Run Vite dev server:

```bash
npm run dev
```

Format (optional):

```bash
npm install --save-dev prettier
```

### Build

```bash
npm run build
```

Artifacts output to `dist/`.

### Preview Production Build

```bash
npm run preview
```

## Project Structure (partial)

```text
public/           # static assets, manifest, service worker
src/
	pages/          # page modules (listings, profile, auth, create/edit)
	services/       # API clients and types
	storage/        # authentication and helpers
	router/         # client-side routing
	layout/         # layout helpers
	apiClient/      # HTTP client
```

### Scripts

- `dev` – start Vite dev server
- `build` – type-check and bundle
- `preview` – preview the built client
- `prettier` – format code (if configured)

## Contributing

1. Fork & clone
2. Create a feature branch: `git checkout -b feat/your-change`
3. Commit using conventional messages (e.g., `feat: add edit listing page`)
4. Open a PR

### Authors

- Simon Andreas — https://github.com/Simicedev
