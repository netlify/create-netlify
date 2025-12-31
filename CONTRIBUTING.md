# Contributing to create-netlify

## Development Setup

This project uses modern, fast tooling for an optimal development experience.

### Prerequisites

- Node.js 20 or higher
- pnpm 9+ (managed via Corepack)

### Install Dependencies

```bash
pnpm install
```

## Tooling

### TypeScript Compilation: tsgo

We use [tsgo](https://github.com/microsoft/typescript-go), Microsoft's native TypeScript compiler written in Go, which provides ~10x faster compilation than tsc.

```bash
# Build the project
pnpm build

# Type check without emitting files
pnpm typecheck
```

### Linting: oxlint

We use [oxlint](https://oxc.rs/docs/guide/usage/linter.html), a blazingly fast linter written in Rust that's 50-100x faster than ESLint.

```bash
# Check for lint issues
pnpm lint
```

Configuration: `oxlint.json` and `.oxc.json`

### Formatting: oxfmt

We use [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html), the Oxc formatter that's compatible with Prettier but much faster.

```bash
# Format code
pnpm format

# Check formatting without writing
pnpm format:check
```

Configuration: `.oxc.json`

## Development Workflow

### Run in Development Mode

Use `tsx` to run the CLI without building:

```bash
pnpm dev

# Or pass arguments:
pnpm dev astro -- --template blog
```

### Test Locally

After building:

```bash
# Run directly
node dist/main.js

# Or link globally
pnpm link --global
npm create netlify
```

## Architecture

### File Structure

```
create-netlify/
├── src/
│   ├── main.ts                      # CLI entrypoint
│   └── lib/
│       ├── cli.ts                   # Argument parsing
│       ├── framework-choices.ts     # Framework definitions & mappings
│       ├── framework-create.ts      # Core framework creation logic
│       ├── shell.ts                 # Shell command execution
│       └── config-files.ts          # Config file manipulation (magicast)
├── dist/                            # Compiled output (generated)
└── .github/workflows/               # CI workflows
```

### Key Modules

#### `main.ts`

CLI entrypoint that orchestrates the entire flow:

- Shows animated intro
- Handles interactive vs. direct mode
- Prompts for use case or framework
- Prompts for project directory
- Runs framework creation
- Optional database & AI context setup
- Shows outro

#### `lib/framework-choices.ts`

Defines all supported frameworks and their configurations:

- Framework metadata (id, label, description)
- `buildCommand()`: Returns the create command with version pins
- `postCreateCommands()`: Optional setup commands (can be shell commands or functions)

#### `lib/framework-create.ts`

Core logic for running framework creation:

- Executes the framework's create command
- Verifies project directory was created
- Runs post-create commands (shell or functions)
- Package manager detection via `@antfu/ni`
- Command conversion (`npx` → `pnpm dlx`, etc.)

#### `lib/shell.ts`

Shell command execution utilities:

- `runCommand()`: Execute shell commands with proper stdio handling
- Package manager detection & caching
- Command conversion for different package managers

#### `lib/config-files.ts`

Config file manipulation using [magicast](https://github.com/unjs/magicast):

- AST-based modifications (safer than regex)
- `addVitePlugin()`: Add plugins to Vite config
- Uses magicast's built-in Vite helpers

## Adding a New Framework

1. Add framework config to `src/lib/framework-choices.ts`:

```typescript
{
  id: 'my-framework',
  label: 'My Framework',
  description: 'A cool framework',
  buildCommand: ({ projectName, restArgs }) => {
    // MUST include projectName so we know where the project is
    return ['create', 'my-framework@1', projectName, ...restArgs];
  },
  postCreateCommands: ({ cwd }) => {
    return [
      // Shell commands
      ['npm', 'install', '-D', '@netlify/plugin'],
      // Or functions for complex setup
      async () => {
        await addVitePlugin(cwd, {
          name: 'myPlugin',
          from: '@netlify/plugin',
          default: true
        });
      }
    ];
  }
}
```

2. Test locally with `pnpm dev my-framework`

## CI/CD

We use GitHub Actions for continuous integration:

- **Lint** (Node LTS): Runs oxlint
- **Format Check** (Node LTS): Runs oxfmt without `--write`
- **Type Check** (Node 20.0.0): Runs tsgo type checking
- **Release Please**: Automated releases and changelog

## Package Manager Detection

The tool auto-detects which package manager you're using via `@antfu/ni`:

- Looks for `pnpm-lock.yaml` → **pnpm**
- Looks for `yarn.lock` → **yarn**
- Looks for `bun.lockb` → **bun**
- Looks for `package-lock.json` → **npm**

Commands are automatically converted:

- `npm create` → `pnpm create`, `yarn create`, etc.
- `npx foo` → `pnpm dlx foo`, `yarn dlx foo`, `bunx foo`

## Design Decisions

### Why prompt for directory upfront?

We ask for the project directory before running the framework's create command so we can:

- Pass it to the underlying tool (avoiding duplicate prompts)
- Know exactly where to run post-setup commands
- Verify the project was created successfully

### Why use magicast for config files?

AST-based manipulation is safer than regex or string replacement:

- Preserves formatting and comments
- Type-safe transformations
- Framework-specific helpers (e.g., Vite)
- Handles edge cases automatically

### Why separate shell commands from config functions?

Post-create commands can be either shell commands or async functions:

- Shell commands for simple tasks (install packages, run CLI tools)
- Functions for complex config manipulation (magicast, file I/O)
- Keeps framework configs declarative and testable
