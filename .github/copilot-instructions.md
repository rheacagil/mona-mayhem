# Mona Mayhem — Copilot Instructions

## Project

Mona Mayhem is a retro arcade GitHub Contribution Battle Arena. The goal is to let users compare GitHub contribution activity in a playful battle-game experience.

## Stack and commands

- Use Astro with the Node.js adapter and JavaScript or TypeScript, following the patterns already present in the repository.
- Style with Tailwind CSS when it is configured for the project; otherwise prefer Astro component-scoped CSS. Do not assume Tailwind is installed.
- Install dependencies with `npm install`.
- Start the development server with `npm run dev`.
- Build with `npm run build` and preview the build with `npm run preview`.

## Development rules

- Keep components and responsibilities modular; avoid monolithic pages and unnecessary abstractions.
- Follow existing file naming conventions and Astro project structure.
- Prefer clean, readable, maintainable code over clever or overly generic solutions.
- Use Astro components and server endpoints in their appropriate places. Keep server-only logic out of client-side code.
- Preserve existing behavior unless a requested change calls for modifying it.
- Handle errors explicitly, especially when working with external services such as GitHub.
