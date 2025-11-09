import ansis from "ansis"

/* eslint-disable no-magic-numbers */
export const netlifyCyan = ansis.rgb(40, 180, 170)
export const netlifyTeal = ansis.rgb(20, 140, 140)
export const netlifyBright = ansis.rgb(60, 220, 200)
/* eslint-enable no-magic-numbers */

export const highlightCode = netlifyTeal
export const callToAction = netlifyBright

export interface ParsedArgs {
  framework?: string // Framework ID (e.g., 'astro', 'next')
  projectName?: string // Project name from args
  restArgs: string[] // Args to pass through to underlying tool
}

/**
 * Parse command-line arguments
 *
 * Handles:
 * - `create-netlify` → interactive mode
 * - `create-netlify astro` → framework specified
 * - `create-netlify astro -- --skip-houston` → with passthrough args
 *
 * @param argv - Process arguments (usually process.argv.slice(2))
 */
export const parseArgs = (argv: string[]): ParsedArgs => {
  const args: ParsedArgs = {
    restArgs: [],
  }

  // Find the separator `--` which marks passthrough args
  const separatorIndex = argv.indexOf("--")
  const beforeSeparator =
    separatorIndex !== -1 ? argv.slice(0, separatorIndex) : argv
  const afterSeparator =
    separatorIndex !== -1 ? argv.slice(separatorIndex + 1) : []

  // First non-option argument is the framework ID
  // (We're keeping this simple; not using a full arg parser)
  for (const arg of beforeSeparator) {
    if (!arg.startsWith("-")) {
      if (!args.framework) {
        args.framework = arg
      } else if (!args.projectName) {
        // If we have a framework and another positional arg, it might be project name
        // But for now, we'll prompt for project name, so skip this
        // TODO: Support positional project name if needed
      }
    }
  }

  // Everything after `--` goes to restArgs
  args.restArgs = afterSeparator

  return args
}
