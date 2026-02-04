import { spawn } from "node:child_process"

import debug from "./debug.js"

/**
 * Execute a command as a child process
 *
 * @param command - Command parts as array
 * @param cwd - Working directory
 * @returns Promise that resolves on success or rejects on error
 */
export const runCommand = async (command: string[], cwd: string = process.cwd()): Promise<void> => {
  return new Promise((resolve, reject) => {
    const [cmd, ...args] = command

    const child = spawn(cmd, args, {
      cwd,
      stdio: "inherit",
      shell: true,
    })

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}: ${command.join(" ")}`))
      } else {
        resolve()
      }
    })

    child.on("error", (err) => {
      reject(err)
    })
  })
}
