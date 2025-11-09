# create-netlify

A meta create tool that scaffolds Netlify-ready projects using your favorite framework.

## Usage

### Interactive mode

Choose your framework and project name interactively:

```bash
npm create netlify
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

### Pass options to the underlying tool

Any arguments after `--` are passed directly to the framework's create tool:

```bash
npm create netlify astro -- --template blog
npm create netlify next -- --typescript --tailwind
npm create netlify vite -- --template react-ts
```

## Supported Frameworks

- **Astro** - The web framework for content-driven websites
- **Next.js** - The React Framework for the Web
- **Vite** - Next Generation Frontend Tooling
- **Nuxt** - The Intuitive Vue Framework
- **SvelteKit** - Web development, streamlined
- **React Router** - React Router v7 framework

## What it does

1. **Prompts for a project directory** upfront so we know where to create your project
2. **Auto-detects your package manager** (npm, pnpm, yarn, bun) using `@antfu/ni`
3. Runs the appropriate `create` command for your chosen framework with the correct package manager, passing the directory name
4. Automatically converts commands like `npx` to the equivalent for your package manager (`pnpm dlx`, `yarn dlx`, `bunx`)
5. **Verifies the project was created** in the expected directory
6. Optionally runs post-setup commands (e.g., `astro add netlify` for Astro projects) in the project directory
7. Shows you the next steps using your preferred package manager

## Development

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development setup, architecture, and contribution guidelines.

## License

MIT
