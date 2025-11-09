/**
 * Helper functions for modifying framework config files
 *
 * Uses magicast for safe AST-based config manipulation
 */

import { resolve } from "node:path"
import { existsSync } from "node:fs"
import { loadFile, writeFile as magicastWriteFile } from "magicast"
import { addVitePlugin as magicastAddVitePlugin } from "magicast/helpers"
import { log } from "@clack/prompts"

/**
 * Add a plugin to a Vite config file
 *
 * Uses magicast's built-in Vite helpers for safe, high-level config manipulation
 *
 * @param projectDir - The project directory containing vite.config.(js|ts)
 * @param pluginImport - The import details for the plugin
 * @param pluginOptions - Optional configuration object for the plugin
 */
export const addVitePlugin = async (
  projectDir: string,
  pluginImport: { name: string; from: string; default?: boolean },
  pluginOptions?: Record<string, any>
): Promise<void> => {
  // Find vite config file
  const configFiles = [
    "vite.config.ts",
    "vite.config.js",
    "vite.config.mjs",
    "vite.config.mts",
  ]

  let configPath: string | undefined
  for (const file of configFiles) {
    const path = resolve(projectDir, file)
    if (existsSync(path)) {
      configPath = path
      break
    }
  }

  if (!configPath) {
    log.warn("No vite.config file found. Skipping plugin addition.")
    return
  }

  try {
    // Load and parse the config file using magicast
    const mod = await loadFile(configPath)

    // Use magicast's high-level Vite helper to add the plugin
    // This handles imports, plugins array, and proper positioning automatically
    magicastAddVitePlugin(mod, {
      from: pluginImport.from,
      imported: pluginImport.default ? "default" : pluginImport.name,
      constructor: pluginImport.name,
      options: pluginOptions,
    })

    // Write back to file using magicast's writeFile (handles formatting)
    await magicastWriteFile(mod, configPath)

    log.success(`Added ${pluginImport.name} to vite.config`)
  } catch (error) {
    log.error(`Failed to modify vite.config: ${error}`)
    throw error
  }
}

/**
 * Generic config file modifier for other frameworks
 *
 * @param projectDir - The project directory
 * @param configFile - The config file name
 * @param modifier - Function to modify the loaded module
 */
export const modifyConfig = async (
  projectDir: string,
  configFile: string,
  modifier: (mod: any) => void
): Promise<void> => {
  const configPath = resolve(projectDir, configFile)

  if (!existsSync(configPath)) {
    log.warn(`Config file ${configFile} not found. Skipping modification.`)
    return
  }

  try {
    const mod = await loadFile(configPath)

    // Apply the modifier function to the module
    // User can access mod.exports.default, mod.imports, etc.
    modifier(mod)

    // Write using magicast's writeFile for better formatting
    await magicastWriteFile(mod, configPath)

    log.success(`Modified ${configFile}`)
  } catch (error) {
    log.error(`Failed to modify ${configFile}: ${error}`)
    throw error
  }
}
