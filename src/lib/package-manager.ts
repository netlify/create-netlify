/**
 * Package manager detection and command conversion
 *
 * Detects which package manager invoked create-netlify and uses that
 * same package manager for all subsequent commands.
 */

export type PackageManager = "npm" | "pnpm" | "yarn" | "bun"

/**
 * Detect which package manager invoked create-netlify
 *
 * Uses the npm_config_user_agent environment variable which is set by
 * npm, pnpm, yarn, and bun when they invoke scripts.
 *
 * @returns The detected package manager, defaults to 'npm'
 */
export const detectPackageManager = (): PackageManager => {
  const userAgent = process.env.npm_config_user_agent

  if (!userAgent) {
    return "npm"
  }

  // User agent format: "pnpm/8.0.0 npm/? node/v18.0.0 darwin x64"
  // These simple checks should be sufficient since these strings are reasonably unique
  if (userAgent.includes("pnpm")) {
    return "pnpm"
  }
  if (userAgent.includes("yarn")) {
    return "yarn"
  }
  if (userAgent.includes("bun")) {
    return "bun"
  }

  return "npm"
}

/**
 * Convert an `npm` command to use the specified package manager
 *
 * @param command - Command array (e.g., ['npx', 'foo'], ['create', 'bar'])
 * @param packageManager - Package manager to use
 * @returns Converted command for the package manager
 */
export const withPackageManager = (command: string[], packageManager: PackageManager): string[] => {
  const [verb, ...rest] = command

  if (verb === "create") {
    // All supported package managers use the same format
    return [packageManager, "create", ...rest]
  }

  // `npm exec foo` aka `npx foo`
  if (verb === "exec") {
    switch (packageManager) {
      case "npm":
        const [packageName, ...packageArgs] = rest
        // `npm exec` requires `--` to ensure all args (positional and flags) are passed to the
        // underlying package binary rather than interpreted by npm itself
        return ["npm", "exec", "--yes", packageName, "--", ...packageArgs]
      case "pnpm":
        return ["pnpm", "dlx", ...rest]
      case "yarn":
        return ["yarn", "dlx", ...rest]
      case "bun":
        return ["bunx", ...rest]
    }
  }

  // `-D`/`--save-dev` works the same across package managers.
  // TODO(serhalp): Consider checking for any other flags and throwing if present.
  if (verb === "add") {
    switch (packageManager) {
      case "npm":
        return ["npm", "install", ...rest]
      case "pnpm":
        return ["pnpm", "add", ...rest]
      case "yarn":
        return ["yarn", "add", ...rest]
      case "bun":
        return ["bun", "add", ...rest]
    }
  }

  throw new Error(`Unsupported command verb: ${verb}`)
}
