# create-netlify

A meta create tool that scaffolds Netlify-ready projects using your favorite framework.

## Quick Start

```bash
npm create netlify
```

and follow the prompts!

## Usage

### Interactive mode

Run any of these commands to invoke the fully interactive mode:

```bash
npm create netlify
# or:
npx create-netlify
# or:
npm exec create-netlify
```

### Direct framework selection

Skip the framework selection prompt:

```bash
npm create netlify astro
npm create netlify next
npm create netlify vite
npm create netlify nuxt
npm create netlify sveltekit
npm create netlify react-router
```

The full list of supported frameworks is in the table below.

### Pass options to the underlying framework create tool

Any arguments after `--` are passed directly to the framework's create tool. For example:

```bash
npm create netlify astro -- --template blog
npm create netlify next -- --typescript --tailwind
npm create netlify vite -- --template react-ts
```

Refer to the relevant tool's own docs (linked in the table below) to find out what options they support.

TODO turn this into a nice markdown table with framework (lowercase, actual cli option format) +
link to that underlying framework create npm package

- **Astro** - The web framework for content-driven websites
- **Next.js** - The React Framework for the Web
- **Vite** - Next Generation Frontend Tooling
- **Nuxt** - The Intuitive Vue Framework
- **SvelteKit** - Web development, streamlined
- **React Router** - React Router v7 framework

## Supported package managers

### npm

**Recommended command:**

```bash
npm create netlify
```

**Alternatives:**

```bash
npx create-netlify
npm exec create-netlify
```

### pnpm

**Recommended command:**

```bash
pnpm create netlify
```

**Alternatives:**

```bash
pnpm dlx create-netlify
pnpm exec create-netlify
```

### Yarn

**Recommended command (both v1 and Yarn Berry v2+):**

```bash
yarn create netlify
```

**Alternative (Yarn Berry v2+ only):**

```bash
yarn dlx create-netlify
```

### Bun

**Recommended command:**

```bash
bun create netlify
```

**Alternative:**

```bash
bunx create-netlify
```

## What it does

1. **Prompts for a project directory** upfront so we know where to create your project
2. **Auto-detects your package manager** (npm, pnpm, yarn, bun)
3. Runs the appropriate `create` command for your chosen framework with the correct package manager, passing the directory name
4. Automatically converts commands like `npx` to the equivalent for your package manager (`pnpm dlx`, `yarn dlx`, `bunx`)
5. **Verifies the project was created** in the expected directory
6. Optionally runs post-setup commands (e.g., `astro add netlify` for Astro projects) in the project directory
7. Shows you the next steps using your preferred package manager

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, architecture, and contribution guidelines.

## License

MIT
