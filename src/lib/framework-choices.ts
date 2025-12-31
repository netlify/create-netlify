/**
 * Framework configurations for create-netlify
 *
 * Each framework defines:
 * - How to call its underlying create tool
 * - Optional post-create commands (e.g., adding Netlify integration)
 */

import { addVitePlugin } from "./config-files.js"
import { type PackageManager, withPackageManager } from "./package-manager.js"

export interface FrameworkConfig {
  id: string
  label: string // Display name for interactive prompts
  description?: string // Optional help text

  /**
   * Build the command to invoke the underlying create tool.
   *
   * IMPORTANT: The command MUST include the projectName as an argument
   * so that we know where the project will be created. This allows us
   * to run post-create commands in the correct directory.
   *
   * @param projectName - The name/directory for the new project (MUST be passed to the create command)
   * @param restArgs - Any additional CLI args to pass through (e.g., --template, --skip-houston)
   * @returns Command parts as array [command, ...args]
   */
  buildCreateCommand(args: { projectName: string; restArgs: string[] }): string[]

  /**
   * Optional post-create commands to run after scaffolding.
   *
   * Can be either:
   * - Command arrays: e.g., [['npx', 'astro', 'add', 'netlify']]
   * - Functions: async functions that perform config modifications
   *
   * @param projectName - The project name
   * @param cwd - The working directory (project root)
   * @returns Array of commands (strings) or functions to run sequentially
   */
  buildPostCreateCommands?(args: {
    cwd: string
    packageManager: PackageManager
    projectName: string
  }): (string[] | (() => Promise<void>))[]
}

/**
 * All supported frameworks
 *
 * When making changes here, be very careful about command and package names, as there are subtle
 * but important distinctions:
 * - `npm create foo` is a magical command equivalent to `npm exec create-foo` (literally adds `create-` prefix)
 * - `npx` is just an alias for `npm exec`, so `npx bar-baz` is equivalent to `npm exec bar-baz`
 * - Thus, `npm create foo` === `npx create-foo` === `npm exec create-foo`
 * - Often, we'll want to run `npm create foo` as the "create cmd" and then use `npx foo bar baz` as
 *   a "post-create" cmd
 * → As using the same identifier to refer to different packages would be confusing and error prone,
 *   we strive to avoid the `create` command entirely.
 *
 * TODO: Add more frameworks as needed
 * TODO: Make version pins configurable
 */
export const frameworks: FrameworkConfig[] = [
  {
    id: "astro",
    label: "Astro",
    description: "The web framework for content-driven websites",
    buildCreateCommand: ({ projectName, restArgs }) => {
      // We force `--install, otherwise our `astro add netlify` may fail
      return ["exec", "create-astro@4", "--", projectName, "--install", ...restArgs]
    },
    buildPostCreateCommands: ({ packageManager }) => {
      return [withPackageManager(["exec", "astro", "add", "--yes", "netlify"], packageManager)]
    },
  },
  {
    id: "next",
    label: "Next.js",
    description: "The React Framework for the Web",
    buildCreateCommand: ({ projectName, restArgs }) => {
      return ["exec", "create-next-app@16", projectName, ...restArgs]
    },
    buildPostCreateCommands: () => {
      // Zero config
      return []
    },
  },
  {
    id: "vite",
    label: "Vite",
    description: "Next Generation Frontend Tooling",
    buildCreateCommand: ({ projectName, restArgs }) => {
      return ["exec", "create-vite@7", projectName, ...restArgs]
    },
    buildPostCreateCommands: ({ cwd, packageManager }) => {
      return [
        // Install the Netlify Vite plugin
        withPackageManager(["add", "--save-dev", "@netlify/vite-plugin"], packageManager),
        // Add it to vite.config using magicast's Vite helpers
        async () => {
          await addVitePlugin(cwd, {
            name: "netlify",
            from: "@netlify/vite-plugin",
            default: true,
          })
        },
      ]
    },
  },
  {
    id: "nuxt",
    label: "Nuxt",
    description: "The Intuitive Vue Framework",
    buildCreateCommand: ({ projectName, restArgs }) => {
      return ["exec", "nuxi@4", "init", projectName, "--modules=netlify", ...restArgs]
    },
    // `nuxi init` with `--modules=netlify` above ^ installs `@netlify/nuxt` and adds it to
    // nuxt.config.*
    buildPostCreateCommands: () => {
      return []
    },
  },
  {
    id: "sveltekit",
    label: "SvelteKit",
    description: "Web development, streamlined",
    buildCreateCommand: ({ projectName, restArgs }) => {
      return ["exec", "sv@0.9", "create", projectName, "--install", ...restArgs]
    },
    buildPostCreateCommands: () => {
      // TODO: Add Netlify adapter for SvelteKit
      return []
    },
  },
  {
    id: "react-router",
    label: "React Router",
    description: "React Router v7 framework",
    buildCreateCommand: ({ projectName, restArgs }) => {
      return ["exec", "create-react-router@7", projectName, "--install", ...restArgs]
    },
    buildPostCreateCommands: ({ cwd, packageManager }) => {
      return [
        // Install the Netlify React Router plugin + Netlify Vite plugin
        withPackageManager(
          ["add", "--save-dev", "@netlify/vite-plugin", "@netlify/vite-plugin-react-router"],
          packageManager
        ),
        // Add it to vite.config using magicast's Vite helpers
        async () => {
          await addVitePlugin(cwd, {
            name: "netlifyVite",
            from: "@netlify/vite-plugin",
            default: true,
          })
          await addVitePlugin(cwd, {
            name: "netlifyReactRouter",
            from: "@netlify/vite-plugin-react-router",
            default: true,
          })
        },
      ]
    },
  },
]

/**
 * Get framework config by ID
 */
export const getFramework = (id: string): FrameworkConfig | undefined => {
  return frameworks.find((f) => f.id === id)
}
