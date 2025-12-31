/**
 * Core logic for running framework creation and post-setup commands
 */
import { resolve } from "node:path"
import { existsSync } from "node:fs"

import { log } from "@clack/prompts"
import { createSpinner } from "nanospinner"

import type { FrameworkConfig } from "./framework-choices.js"
import { runCommand } from "./shell.js"
import { highlightCode } from "./cli.js"
import { detectPackageManager, withPackageManager } from "./package-manager.js"

/**
 * Run the framework creation tool
 *
 * @param framework - Framework configuration
 * @param projectName - Name for the new project
 * @param restArgs - Additional args to pass through
 * @returns The project directory path, or null if not found
 */
export const runFrameworkCreate = async (
  framework: FrameworkConfig,
  projectName: string,
  restArgs: string[]
): Promise<string | null> => {
  const spinner = createSpinner(`Creating ${framework.label} project "${projectName}"...`).start()

  try {
    // Detect which package manager invoked create-netlify and use that same package manager for all
    // commands
    const packageManager = detectPackageManager()
    const finalFrameworkCreateCommand = withPackageManager(
      framework.buildCreateCommand({
        projectName,
        restArgs,
      }),
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
      log.warn("The framework may have created the project in an unexpected location.")
      return null
    } else {
      // Run post-create commands if any
      if (framework.buildPostCreateCommands) {
        const postCommands = framework.buildPostCreateCommands({
          cwd: projectDir,
          packageManager,
          projectName,
        })

        if (postCommands.length > 0) {
          const postSpinner = createSpinner("Configuring framewok project for Netlify...").start()

          for (const postCommand of postCommands) {
            if (typeof postCommand === "function") {
              // It's a function - call it directly
              postSpinner.update({ text: "Running config modification..." })
              postSpinner.stop()
              await postCommand()
            } else {
              // It's a command array - run it as a subprocess
              postSpinner.update({
                text: `Running: ${postCommand.join(" ")}`,
              })
              postSpinner.stop()
              await runCommand(postCommand, projectDir)
            }
          }

          postSpinner.success({ text: "Project configured for Netlify" })
        }
      }
    }

    log.success(`Project ${highlightCode(projectName)} created successfully!`)
    return projectDir
  } catch (error) {
    spinner.error({ text: "Failed to create project" })
    throw error
  }
}
