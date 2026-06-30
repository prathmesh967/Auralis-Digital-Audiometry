# Auralis - Digital Audiometry

Auralis is a modern digital audiometry application built as a monorepo with a React + Vite frontend and an Express backend. The project includes an interactive hearing test experience, speech test, 3D sound localization, profile management, and legacy UI reference pages.

## Repository Structure

- `frontend/` — React + Vite application with TypeScript, Tailwind CSS, PWA support, and audio/biofeedback modules.
- `backend/` — Express API server for authentication, user profiles, and audio test data management.
- `legacy_ui/` — Archived original HTML/legacy screens for reference and comparison.

## Quick Start

From the repository root:

```bash
npm install
npm run dev
```

Then open the local frontend URL shown by Vite.

## Available Scripts



### Frontend

Inside `frontend/`:

- `npm run dev` — Start Vite development server.
- `npm run build` — Compile TypeScript and build production assets.
- `npm run preview` — Serve the production build locally.

### Backend

Inside `backend/`:

- `npm run start` — Start the Express server with `node index.js`.

## Frontend Features

- React + Vite + TypeScript front-end application.
- Responsive hearing test dashboard.
- Sound localization and speech audio testing.
- User profile management and settings.
- PWA-ready configuration with `vite-plugin-pwa`.
- 3D audio support using the Web Audio API and `three`.

## Backend Features

- Express API server with CORS and environment configuration.
- Authentication support with JWT.
- User data persistence using MongoDB / Mongoose.
- Email support via Nodemailer.
- Google login support via `google-auth-library`.

## Environment Configuration

Create a `.env` file in `backend/` based on `backend/.env.example` and set the required values.

Example:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/auralis
JWT_SECRET=your-secret-key
PORT=4000
```



## Notes

- The frontend uses `google-auth-library` in the browser and backend.
- The backend depends on `bcryptjs`, `jsonwebtoken`, and `mongoose`.
- The frontend depends on `chart.js`, `framer-motion`, `howler`, `jspdf`, and `three`.

## Contact

For questions or contributions, open an issue or submit a pull request.

