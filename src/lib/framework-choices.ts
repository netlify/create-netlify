/**
 * Framework configurations for create-netlify
 *
 * Each framework defines:
 * - How to call its underlying create tool
 * - Optional post-create commands (e.g., adding Netlify integration)
 */

import { addVitePlugin } from "./config-files.js"

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
  buildCreateCommand(args: {
    projectName: string
    restArgs: string[]
  }): string[]

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
  postCreateCommands?(args: {
    projectName: string
    cwd: string
  }): (string[] | (() => Promise<void>))[]
}

/**
 * All supported frameworks
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
      return ["create", "astro@4", projectName, "--install", ...restArgs]
    },
    postCreateCommands: () => {
      return [["npx", "astro", "add", "netlify@latest", "--yes"]]
    },
  },
  {
    id: "next",
    label: "Next.js",
    description: "The React Framework for the Web",
    buildCreateCommand: ({ projectName, restArgs }) => {
      return ["create", "next-app@16", projectName, ...restArgs]
    },
    postCreateCommands: () => {
      // Zero config
      return []
    },
  },
  {
    id: "vite",
    label: "Vite",
    description: "Next Generation Frontend Tooling",
    buildCreateCommand: ({ projectName, restArgs }) => {
      return ["create", "vite@7", projectName, ...restArgs]
    },
    postCreateCommands: ({ cwd }) => {
      return [
        // Install the Netlify Vite plugin
        ["npm", "install", "-D", "@netlify/vite-plugin"],
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
      return ["npx", "nuxi@4", "init", projectName, ...restArgs]
    },
    postCreateCommands: () => {
      return []
    },
  },
  {
    id: "sveltekit",
    label: "SvelteKit",
    description: "Web development, streamlined",
    buildCreateCommand: ({ projectName, restArgs }) => {
      return ["create", "svelte@7", projectName, ...restArgs]
    },
    postCreateCommands: () => {
      // TODO: Add Netlify adapter for SvelteKit
      return []
    },
  },
  {
    id: "react-router",
    label: "React Router",
    description: "React Router v7 framework",
    buildCreateCommand: ({ projectName, restArgs }) => {
      return ["npx", "create-react-router@7", projectName, ...restArgs]
    },
    postCreateCommands: () => {
      // TODO: Add Netlify config for React Router
      return []
    },
  },
]

/**
 * Get framework config by ID
 */
export const getFramework = (id: string): FrameworkConfig | undefined => {
  return frameworks.find((f) => f.id === id)
}
