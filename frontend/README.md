
# React + TypeScript + Vite Project

This project is a boilerplate for building React applications with TypeScript, bundled using Vite for fast development and optimized production builds.

## Features

- ⚡ **Vite**: Lightning-fast bundling and dev server.
- ⚛ **React**: A JavaScript library for building user interfaces.
- 🛠 **TypeScript**: Statically typed JavaScript for better developer experience.
- 🎨 **CSS Modules/Flexbox**: Modular and maintainable styling approach.
- 📦 **Modern Tooling**: ESM support, hot module replacement (HMR), and more.

---

## Getting Started

### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (version 16 or above recommended)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

---

### Installation

1. Clone the repository:
   ```bash
   git clone https://gitlab.hrz.tu-chemnitz.de/vsr/edu/planspiel/ws2425/group10-hexalayer.git
   cd frontend/
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

---

### Running the Development Server

Start the development server:
```bash
npm run dev
# or
yarn dev
```

Visit the application in your browser:
```
http://localhost:5173
```

---

### Building for Production

To create an optimized production build:
```bash
npm run build
# or
yarn build
```

The output will be available in the `dist` directory.

---

### Preview Production Build

You can preview the production build locally:
```bash
npm run preview
# or
yarn preview
```

---

## Project Structure

```
├── src/
│   ├── assets/          # Static assets (images, icons, etc.)
│   ├── components/      # Reusable components
│   ├── pages/           # Page components
│   ├── styles/          # Global and modular CSS styles
│   ├── App.tsx          # Root component
│   └── main.tsx         # Application entry point
├── public/              # Static public assets (served as-is)
├── index.html           # HTML template
└── vite.config.ts       # Vite configuration file
```

---

## Scripts

| Command         | Description                                |
|-----------------|--------------------------------------------|
| `dev`           | Start the development server              |
| `build`         | Build the application for production      |
| `preview`       | Preview the production build locally      |
| `lint`          | Run the linter (if configured)            |
| `test`          | Run tests (if configured)                 |

---

## Dependencies

### Core Dependencies

- [React](https://reactjs.org/)
- [TypeScript](https://www.typescriptlang.org/)

### Dev Dependencies

- [Vite](https://vitejs.dev/)
- [ESLint](https://eslint.org/) (optional)
- [Prettier](https://prettier.io/) (optional)
