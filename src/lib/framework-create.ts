/**
 * Core logic for running framework creation and post-setup commands
 */
import { resolve } from "node:path"
import { existsSync } from "node:fs"

import { log, note } from "@clack/prompts"
import { createSpinner } from "nanospinner"
import { detect } from "@antfu/ni"

import type { FrameworkConfig } from "./framework-choices.js"
import { runCommand } from "./shell.js"
import { highlightCode } from "./cli.js"

// Cached package manager to avoid multiple detections
let detectedAgent: string | null

/**
 * Detect the package manager being used
 *
 * Results are cached to avoid multiple filesystem checks
 */
const detectPackageManager = async (): Promise<string> => {
  if (detectedAgent) {
    return detectedAgent
  }

  try {
    // FIXME(serhalp): pass cwd here, and audit where we shoiuld thread the parent pkg manager vs.
    // where we should detect in the created *project* dir
    const agent = await detect({ cwd: process.cwd() })
    detectedAgent = agent || "npm" // Fallback to npm if detection fails
    return detectedAgent
  } catch {
    // If detection fails, default to npm
    detectedAgent = "npm"
    return detectedAgent
  }
}

/**
 * Get the package manager to use (synchronous wrapper with fallback)
 */
const getPackageManager = (): string => {
  return detectedAgent || "npm"
}

/**
 * Detect package manager and convert command to use the correct tool
 *
 * @param command - Command array (e.g., ['create', 'astro@5', 'my-app'])
 * @param packageManager - Package manager to use to run this command (e.g., 'npm', 'pnpm', 'yarn', 'bun')
 * @returns Converted command for the detected package manager
 */
const withPackageManager = (
  command: string[],
  packageManager: string
): string[] => {
  const [verb, ...rest] = command

  if (verb === "create") {
    // Convert to the appropriate package manager's create command
    // npm create astro@5 my-app
    // pnpm create astro@5 my-app
    // yarn create astro@5 my-app
    // bun create astro@5 my-app (bun uses 'create' like npm)
    return [packageManager, "create", ...rest]
  } else if (verb === "npx") {
    // Convert npx to the appropriate package manager's equivalent
    // npm: npx
    // pnpm: pnpm dlx
    // yarn: yarn dlx
    // bun: bunx
    const npxEquivalent: Record<string, string[]> = {
      npm: ["npx"],
      pnpm: ["pnpm", "dlx"],
      yarn: ["yarn", "dlx"],
      bun: ["bunx"],
    }

    const prefix = npxEquivalent[packageManager] || ["npx"]
    return [...prefix, ...rest]
  }

  // Fallback: return as-is
  return command
}

/**
 * Run the framework creation tool
 *
 * @param framework - Framework configuration
 * @param projectName - Name for the new project
 * @param restArgs - Additional args to pass through
 */
export const runFrameworkCreate = async (
  framework: FrameworkConfig,
  projectName: string,
  restArgs: string[]
): Promise<void> => {
  const spinner = createSpinner(
    `Creating ${framework.label} project "${projectName}"...`
  ).start()

  try {
    // Build the command using framework config
    const frameworkCreateCommand = framework.buildCreateCommand({
      projectName,
      restArgs,
    })

    // Convert to appropriate package manager command
    const packageManager = await detectPackageManager()
    const finalFrameworkCreateCommand = withPackageManager(
      frameworkCreateCommand,
      packageManager
    )

    spinner.success({
      text: `🤝 Handing off to: ${highlightCode(finalFrameworkCreateCommand.join(" "))}`,
    })

    // Stop spinner before running interactive command
    spinner.stop()
    log.message("")

    // Run the underlying create tool
    await runCommand(finalFrameworkCreateCommand)

    // Determine the project directory
    // We assume the framework created a directory with the project name
    const projectDir = resolve(process.cwd(), projectName)

    // Verify the directory was actually created
    if (!existsSync(projectDir)) {
      log.warn(
        `Project directory ${highlightCode(projectName)} was not found. Skipping post-setup commands.`
      )
      log.warn(
        "The framework may have created the project in a different location."
      )
    } else {
      // Run post-create commands if any
      if (framework.postCreateCommands) {
        const postCommands = framework.postCreateCommands({
          projectName,
          cwd: projectDir,
        })

        if (postCommands.length > 0) {
          const postSpinner = createSpinner(
            "Configuring framewok project for Netlify..."
          ).start()

          for (const postCommand of postCommands) {
            if (typeof postCommand === "function") {
              // It's a function - call it directly
              postSpinner.update({ text: "Running config modification..." })
              postSpinner.stop()
              await postCommand()
            } else {
              // It's a command array - run it as a subprocess
              const finalPostCommand = withPackageManager(
                postCommand,
                packageManager
              )
              postSpinner.update({
                text: `Running: ${finalPostCommand.join(" ")}`,
              })
              postSpinner.stop()
              await runCommand(finalPostCommand, projectDir)
            }
          }

          postSpinner.success({ text: "Project configured for Netlify" })
        }
      }
    }

    // Get the detected package manager for the success message
    const agent = getPackageManager()

    log.success(`Project ${highlightCode(projectName)} created successfully!`)

    note(
      highlightCode(`cd ${projectName}\n${agent} install\n${agent} run dev`),
      "Next steps"
    )
  } catch (error) {
    spinner.error({ text: "Failed to create project" })
    throw error
  }
}
