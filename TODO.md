# To Do

These are remaining tasks for Claude Code to complete, one at a time.

## Make the Netlify parts of the UI delightful

Much like create astro is famously delightful, let's experiment with adding some Netlify delight
to the intro and outro.

Some basic design tokens we should leverage:

- this unicode symbol: ⬥
- `const netlifyCyan = ansis.rgb(40, 180, 170)`

Otherwise, feel free to get creative and experiment. Maybe do some fun animated ASCII art. Maybe
don't. I dunno!

Our current tagline is "Push your ideas to the web". We're also all about our mission which is to
"Build a better web."

## More options

change prompt from "which framework" to "A blog", "A marketing site", "An interactive app"... "I'm
not sure yet", "Let me choose a framework!"

- not sure yet = Vite
- blog = Astro
- marketing site = Astro
- landing page = Astro
- an e-commerce site = Astro + React, React Router, Nuxt
- an interactive app = TanStack Start "(our recommendation)", Nuxt, SvelteKit, React Router
- "Something else" = some additional prompts with a decision tree, to be implemented later...

add a follow-up prompt: "Do you need a database? Choose yes to provision a zero-config, production-grade serverless Postgres instance powered by Neon"

- this will need to run a shell command: `npx --yes netlify db init`. hook this up somehow.

add one final prompt: "Add AI context files for agents to work best with this Netlify project?"

- choosing yes will run `npx --yes netlify recipes ai-context`

## Improve the "next steps"

TODO: write this TODO (Claude, ignore this one for now)

- maybe AI next steps?

## Consider how to integrate with framework detection build config stuff

TODO: write this TODO (Claude, ignore this one for now)

## Add basic CI workflows

Add (separate) workflows for lint (node lts), format (node lts), and typecheck (node 20.0.0).

Add a release-please configuration.

## Add custom Renovate rules to update the inline versions

Let's extract the hardcoded versions for e.g. `create-astro` to the frameworks config objects, and
add one of those cool custom Renovate rules to match on a regex or comment or whatever!

## Add e2e tests

This should be GitHub Actions workflow that runs on Node 20 and LTS in a matrix and uses and tries
PNPM, NPM, and Yarn in a matrix. And then also, I guess we can, that would be the matrix and the
actual vtest. Test suite will contain explicit, like a table test basically for various frameworks.

And then an interactive version for the invocation without any arguments. I think that's mostly it.
I think maybe let's not bother. It would be way too difficult to maintain this test suite if we try
to encode all the interactions with all of the other create tools, like the literal interactivity.

Because they could change the prompts, they could change anything, and it might not even be
considered a breaking change. So I guess let's pass arguments in each of these tests to the specific
underlying thing that makes it non-interactive. So like, I don't know exactly, but for example, NPM
create astro dash dash, typescript dash dash, do you know what I mean?

Like, giving it all the things that it needs so that it doesn't spin up the interactive prompts. I
think that's about it.
