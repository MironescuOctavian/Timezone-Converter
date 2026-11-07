<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Git

- Never commit, push, or create branches unless I explicitly ask. If I ask for a changeset, create only the .changeset file.
- When I say merge to main, commit directly to or merge into main. Do not leave the work on a side branch.

## Working Rules

- Do exactly what was asked. If I ask for a proposal, review, or explanation, do NOT edit code until I approve.
- Fix issues at the narrowest correct layer. Do not change shared theme/UI packages or package-wide config for a page-specific bug without asking.
- Prefer config settings over new middleware, helpers, or adapters.

## Debugging

- Verify before claiming a fix. Reproduce the issue, then confirm it is gone (server log, browser console, or test). Never say "fixed" on theory alone.
- When a page is blank or broken, first diff it against a working sibling project (idantity.me is the reference) for routes, entry files, and config before forming theories.
- Check for stale dist/ builds and Vite/worker caches early. Rebuild linked packages before testing UI changes.
- Before blaming unrelated code for a regression (e.g. a hang), check whether my own recent changes caused it.

## Testing / Verification

- Use the built-in t3-code preview tools (preview_navigate/evaluate/snapshot). Do not install Playwright.
- Wait for data to load before reading the page, and re-install console hooks after reloads.
- Don't start extra dev servers or browsers if one is already running. Ask me to verify visually when that's faster. Kill leftover dev/build processes when done.

## Environment

- Shell is Git Bash on Windows. Use MSYS_NO_PATHCONV=1 for path args, and avoid Python one-liners for edits (use the Edit tool).
