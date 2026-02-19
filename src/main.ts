#!/usr/bin/env node
/* eslint-disable no-console */

/**
 * create-netlify CLI entrypoint
 *
 * This is the main entry point for `npm create netlify`
 *
 * Usage:
 *   npm create netlify                    → Interactive mode
 *   npm create netlify astro              → Create Astro project
 *   npm create netlify astro -- --template blog  → Pass options to underlying tool
 */

import { join } from "node:path"

import { cancel, confirm, intro, isCancel, log, note, outro, select, text } from "@clack/prompts"
import ansis from "ansis"
import terminalLink from "terminal-link"

import { highlightCode, netlifyBright, netlifyCyan, netlifyTeal, parseArgs } from "./lib/cli.js"
import { frameworks, getFramework } from "./lib/framework-choices.js"
import { runFrameworkCreate } from "./lib/framework-create.js"
import { type PackageManager, withPackageManager } from "./lib/package-manager.js"

// Animated intro - diamond pulse/wave effect
const showIntro = async (): Promise<void> => {
  // Create wave/pulse effect with diamonds radiating outward
  const frames = [
    `
        ${netlifyBright.inverse(" ◆ ")}
    `,
    `
       ${netlifyCyan("◆")} ${netlifyBright.inverse(" ◆ ")} ${netlifyCyan("◆")}
    `,
    `
      ${netlifyTeal("◆")}  ${netlifyCyan("◆")} ${netlifyBright.inverse(" ◆ ")} ${netlifyCyan("◆")}  ${netlifyTeal("◆")}
    `,
    `
     ${netlifyTeal("◆")}   ${netlifyCyan("◆")}  ${netlifyBright.inverse(" ◆ ")}  ${netlifyCyan("◆")}   ${netlifyTeal("◆")}

        ${netlifyCyan("◆")} ${netlifyBright.inverse(" ◆ ")} ${netlifyCyan("◆")}
    `,
    `
    ${netlifyTeal("◆")}    ${netlifyCyan("◆")}   ${netlifyBright.inverse(" ◆ ")}   ${netlifyCyan("◆")}    ${netlifyTeal("◆")}

       ${netlifyCyan("◆")}  ${netlifyBright.inverse(" ◆ ")}  ${netlifyCyan("◆")}

        ${netlifyCyan("◆")} ${netlifyBright.inverse(" ◆ ")} ${netlifyCyan("◆")}
    `,
  ]

  // Animate the pulse
  const PULSE_FREQ_MS = 120
  for (const frame of frames) {
    process.stdout.write("\x1Bc")
    console.log(frame)
    await new Promise((resolve) => setTimeout(resolve, PULSE_FREQ_MS))
  }

  // Final state with text
  process.stdout.write("\x1Bc")
  console.log(`
    ${netlifyTeal("◆")}    ${netlifyCyan("◆")}   ${netlifyBright.inverse(" ◆ ")}   ${netlifyCyan("◆")}    ${netlifyTeal("◆")}

       ${netlifyCyan("◆")}  ${netlifyBright.inverse(" ◆ ")}  ${netlifyCyan("◆")}

        ${netlifyCyan("◆")} ${netlifyBright.inverse(" ◆ ")} ${netlifyCyan("◆")}


         ${netlifyCyan.bold("N E T L I F Y")}

       ${netlifyTeal.inverse("→ → → Push your ideas to the web")}
  `)
  const FINAL_PAUSE_MS = 200
  await new Promise((resolve) => setTimeout(resolve, FINAL_PAUSE_MS))
}

// When we're all done, but before we prompt you to run an AI agent task
const showPreOutro = async (): Promise<void> => {
  console.log("")
  outro(
    `${netlifyBright.inverse(" 🚀 ")} ${netlifyCyan.bold("Your Netlify project is up and running! Go forth and build.")}`
  )
}

const getProjectId = async (
  projectDir: string,
  packageManager: PackageManager
): Promise<string | null> => {
  try {
    const { runCommand } = await import("./lib/shell.js")
    const statusOutput = await runCommand(
      withPackageManager(["exec", "netlify@23", "status", "--json"], packageManager),
      projectDir
    )
    const statusJson = JSON.parse(statusOutput ?? "") as {
      siteData: { "site-id": string }
    }
    return statusJson.siteData["site-id"]
  } catch {
    return null
  }
}

const showOutro = async (
  projectDir: string,
  projectId: string | null,
  packageManager: PackageManager
): Promise<void> => {
  console.log("")

  const deployCommand = withPackageManager(
    ["exec", "netlify@latest", "deploy"],
    packageManager
  ).join(" ")
  outro(
    `Next steps:\n${highlightCode(`cd ${projectDir}\n${packageManager} run dev`)} # Start the development server\n${highlightCode(deployCommand)} # Deploy to Netlify\n${ansis.dim("Read the Netlify docs ")} ${ansis.dim("→")} ${ansis.cyan(terminalLink("https://app.netlify.com", "https://app.netlify.com"))}`
  )

  const linkCommand = withPackageManager(["exec", "netlify@latest", "link"], packageManager).join(
    " "
  )
  const linkUrl = `https://app.netlify.com/projects/${projectId ?? ""}/link`
  const maybeAlternativeLinkSteps = projectId
    ? ` ${ansis.underline("or")} by visiting ${ansis.cyan(terminalLink(linkUrl, linkUrl))}`
    : ""
  outro(
    `Future steps:\nAdd your code to a Git repository and push to ${ansis.cyan(terminalLink("GitHub", "https://github.com"))} or another provider.\nThen, enable ${terminalLink("continuous deployment to your Netlify site", "https://docs.netlify.com/deploy/create-deploys/#deploy-with-git")} by running ${highlightCode(linkCommand)}${maybeAlternativeLinkSteps}.`
  )
}

const main = async (): Promise<void> => {
  await showIntro()

  intro(`${netlifyCyan("⬥")} Let's get started`)

  try {
    // Parse command-line arguments
    const args = parseArgs(process.argv.slice(2))

    let frameworkId!: string
    let projectName: string

    // Branch 1: Framework specified on command line
    if (args.framework) {
      const framework = getFramework(args.framework)

      if (!framework) {
        cancel(`Unknown framework: ${args.framework}`)

        const availableFrameworks = frameworks.map((f) => `  - ${f.id}`).join("\n")
        note(availableFrameworks, "Available frameworks")

        process.exit(1)
      }

      frameworkId = framework.id

      log.info(`Framework: ${framework.label}`)

      // TODO(serhalp): De-dupe this code.
      const nameResult = await text({
        message: "Where should we create your project?",
        placeholder: "my-app",
        validate: (value) => {
          if (!value) {
            return "Directory name is required"
          }
        },
      })

      if (isCancel(nameResult)) {
        cancel("Operation cancelled")
        process.exit(0)
      }

      projectName = nameResult
    } else {
      // Branch 2: Interactive mode - prompt for use case and project name

      const useCaseResult = await select({
        message: "What would you like to build?",
        // TODO(serhalp): Extract to a config file
        options: [
          {
            value: "blog",
            label: "📖 A blog",
            hint: "Lots of static content with occasional updates",
          },
          {
            value: "marketing",
            label: "🎁 A marketing or portfolio site",
            hint: "Mostly static site to promote products, businesses, or yourself",
          },
          {
            value: "landing",
            label: "🎯 A landing page",
            hint: "Static page to capture leads or promote something; SEO and speed sensitive",
          },
          {
            value: "interactive",
            label: "🎹 An interactive application",
            hint: "Dynamic app with user interactions, login, data, state, etc.",
          },
          {
            value: "ecommerce",
            label: "🛒 An e-commerce site",
            hint: "Online store with products and checkout",
          },
          {
            value: "unsure",
            label: "📝 I'm not sure yet",
            hint: "Start simple with a flexible foundation",
          },
          {
            value: "framework",
            label: "⚒️ Just let me choose a framework!",
            hint: "Pick a specific stack directly",
          },
        ],
      })

      if (isCancel(useCaseResult)) {
        cancel("Operation cancelled")
        process.exit(0)
      }

      const useCase = useCaseResult

      // Map use case to framework(s)
      if (useCase === "framework") {
        // Show framework picker
        const frameworkResult = await select({
          message: "Which framework would you like to use?",
          options: frameworks.map((f) => ({
            value: f.id,
            label: f.label,
            hint: f.description,
          })),
        })

        if (isCancel(frameworkResult)) {
          cancel("Operation cancelled")
          process.exit(0)
        }

        frameworkId = frameworkResult
      } else if (useCase === "blog" || useCase === "marketing" || useCase === "landing") {
        frameworkId = "astro"
      } else if (useCase === "unsure") {
        frameworkId = "vite"
      } else if (useCase === "interactive") {
        const frameworkResult = await select({
          message: "Choose your framework-you can't go wrong with any of these:",
          // TODO(serhalp): Extract to a config file
          options: [
            {
              value: "tanstack-start",
              label: "TanStack Start (our recommendation)",
              hint: "Composable, batteries-included full-stack framework for dynamics apps",
            },
            {
              value: "react-router",
              label: "React Router 7 (aka Remix)",
              hint: "User‑obsessed, standards‑focused React framework",
            },
            {
              value: "nuxt",
              label: "Nuxt",
              hint: "The Intuitive Vue Framework",
            },
            {
              value: "sveltekit",
              label: "SvelteKit",
              hint: "Web development, streamlined",
            },
            {
              value: "next",
              label: "Next.js",
              hint: "Popular React framework",
            },
          ],
        })

        if (isCancel(frameworkResult)) {
          cancel("Operation cancelled")
          process.exit(0)
        }

        frameworkId = frameworkResult
      } else if (useCase === "ecommerce") {
        const frameworkResult = await select({
          message: "Choose your framework-you can't go wrong with any of these:",
          // TODO(serhalp): Extract to a config file
          options: [
            {
              value: "astro",
              label: "Astro + React/Solid/Svelte/Vue",
              hint: "Fast, static Astro pages with interactive islands",
            },
            {
              value: "tanstack-start",
              label: "TanStack Start",
              hint: "Composable, batteries-included full-stack framework for dynamics apps",
            },
            {
              value: "react-router",
              label: "React Router",
              hint: "User‑obsessed, standards‑focused React framework",
            },
            {
              value: "nuxt",
              label: "Nuxt",
              hint: "The Intuitive Vue Framework",
            },
          ],
        })

        if (isCancel(frameworkResult)) {
          cancel("Operation cancelled")
          process.exit(0)
        }

        frameworkId = frameworkResult
      }

      // Prompt for project directory name
      const nameResult = await text({
        message: "Where should we create your project?",
        placeholder: "my-app",
        validate: (value) => {
          if (!value) {
            return "Directory name is required"
          }
        },
      })

      if (isCancel(nameResult)) {
        cancel("Operation cancelled")
        process.exit(0)
      }

      projectName = nameResult
    }

    // Post-creation prompts (database and AI context)
    const shouldInstallDatabase = await confirm({
      message:
        "Do you need a database? Choose yes to provision a zero-config, production-grade Postgres instance powered by Neon",
      initialValue: false,
    })

    if (isCancel(shouldInstallDatabase)) {
      cancel("Operation cancelled")
      process.exit(0)
    }

    const shouldInstallAIContext = await confirm({
      message: "Add AI context files to improve coding agent experience in this project?",
      initialValue: true,
    })

    if (isCancel(shouldInstallAIContext)) {
      cancel("Operation cancelled")
      process.exit(0)
    }

    // Run the framework creation tool
    log.info("")
    const projectDir =
      (await runFrameworkCreate(getFramework(frameworkId)!, projectName, args.restArgs)) ??
      join(".", projectName)
    log.info("")

    log.step("🤝 ... And we're back!")

    // Create a Netlify project. This will fire off some more interactive prompts.
    // This is especially important for a few reasons:
    // - The Netlify DB and agent run steps below won't work without a linked Netlify project.
    // - This will perform "framework detection" and configure build settings automatically.
    //   - TODO(serhalp): We should probably do this ourselves and use `netlify sites:create` or
    //     something?
    log.info("Creating and configuring a Netlify project...")
    const { runCommand } = await import("./lib/shell.js")
    const { detectPackageManager, withPackageManager } = await import("./lib/package-manager.js")
    const packageManager = detectPackageManager()
    await runCommand(withPackageManager(["exec", "netlify@23", "init"], packageManager), projectDir)

    // Fire this off now, we'll need it later
    const projectIdPromise = getProjectId(projectDir, packageManager)

    log.info("Deploying your Netlify project for the first time...")
    await runCommand(
      withPackageManager(["exec", "netlify@23", "deploy", "--prod"], packageManager),
      projectDir
    )

    if (shouldInstallDatabase) {
      log.info("Installing Netlify DB...")

      // Use the same package manager that invoked create-netlify
      const command = withPackageManager(["exec", "netlify@23", "db", "init"], packageManager)
      await runCommand(command, projectDir)
    }

    if (shouldInstallAIContext) {
      log.info("Adding AI context files...")

      // Use the same package manager that invoked create-netlify
      const command = withPackageManager(
        // TODO(serhalp): Add a `--quiet` flag to this command or at least make it less noisy.
        ["exec", "netlify@23", "recipes", "ai-context"],
        packageManager
      )
      await runCommand(command, projectDir)
    }

    await showPreOutro()

    // Optional: Let user kick off an agent task
    const agentPromptResult = await text({
      message: `🤖 (Optional) ${netlifyCyan("Netlify's AI can help you. Describe what you want, in as much or as little detail as you want: ")} ${ansis.dim("(press Enter to skip)")}`,
      placeholder: "e.g., Add a homepage with a hero section and contact form. NO PURPLE.",
    })

    if (isCancel(agentPromptResult)) {
      cancel("Operation cancelled")
      process.exit(0)
    }

    const agentPrompt = agentPromptResult?.trim()

    if (agentPrompt) {
      log.info("Starting AI agent...")

      // Escape the prompt for shell by wrapping in double quotes and escaping any internal quotes
      const escapedPrompt = `"${agentPrompt.replace(/"/g, '\\"')}"`
      const command = withPackageManager(
        ["exec", "netlify@23", "agents:create", "--agent=claude", escapedPrompt],
        packageManager
      )
      await runCommand(command, projectDir)
    }

    await showOutro(projectDir, await projectIdPromise, packageManager)
  } catch (error) {
    cancel("An error occurred")
    log.error(error instanceof Error ? error.message : (error?.toString() ?? ""))
    process.exit(1)
  }
}

await main()
