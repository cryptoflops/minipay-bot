# Zero-Budget Celo Rewards App Setup Guide

## Goal
Build a zero-budget Celo rewards app with a clean Next.js frontend, isolated backend logic, and secure environment handling.

## What you will install
- Node.js v22 or newer.
- pnpm for package management.
- Git.
- A code editor such as VS Code.
- A Celo RPC provider endpoint for development.

## 1) Install Node.js v22+
### Option A: Using nvm on macOS/Linux
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v
npm -v
```

### Option B: Using nvm on Windows with WSL recommended
Use WSL2, then run the same nvm commands above.

### Option C: Official installer
Download Node.js v22+ from the official Node.js website and verify with:
```bash
node -v
```

## 2) Install pnpm
With Corepack:
```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v
```

If Corepack is unavailable:
```bash
npm install -g pnpm
pnpm -v
```

## 3) Scaffold the Next.js app
Create the project:
```bash
pnpm create next-app@latest celo-rewards-app
```

Suggested answers during setup:
- TypeScript: Yes
- ESLint: Yes
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: Yes

Then enter the project:
```bash
cd celo-rewards-app
```

Start the app:
```bash
pnpm dev
```

## 4) Install project dependencies
Add the Celo Web3 transaction types plugin and core chain libraries:
```bash
pnpm add viem @celo/web3-plugin-transaction-types
```

If your app uses AI chat or tool calling later, add those separately, but keep the first setup minimal.

## 5) Configure environment variables
in .env file

Security rules:
- Put only non-sensitive values behind `NEXT_PUBLIC_`.
- Never prefix private keys or secrets with `NEXT_PUBLIC_`.
- Read `Celo_RPC_URL` and `AGENT_PRIVATE_KEY` only in server-side code.
- Never import secret values into client components.
- Add `.env` to `.gitignore`.

## 6) Add the plugin in server-side code
Create a server-only file such as `src/lib/celo.ts`.

Example pattern:
```ts
import { createPublicClient, http } from 'viem'
import { celo } from 'viem/chains'

const rpcUrl = process.env.Celo_RPC_URL
if (!rpcUrl) throw new Error('Missing Celo_RPC_URL')

export const publicClient = createPublicClient({
  chain: celo,
  transport: http(rpcUrl),
})
```

If you later use `@celo/web3-plugin-transaction-types`, keep its initialization in backend or route-handler code only.

## 7) Recommended repository structure
Use a split that keeps backend logic isolated from public UI code:

```text
celo-rewards-app/
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ api/
│  │  │  └─ rewards/
│  │  │     └─ route.ts
│  ├─ components/
│  │  ├─ public/
│  │  │  ├─ Hero.tsx
│  │  │  └─ Features.tsx
│  │  └─ shared/
│  │     └─ Button.tsx
│  ├─ lib/
│  │  ├─ celo/
│  │  │  ├─ client.ts
│  │  │  ├─ rewards.ts
│  │  │  └─ tx-types.ts
│  │  ├─ env.ts
│  │  └─ security.ts
│  ├─ server/
│  │  ├─ services/
│  │  │  └─ rewards-service.ts
│  │  └─ actions/
│  │     └─ claim-reward.ts
│  └─ types/
│     └─ index.ts
├─ public/
├─ .env
├─ .gitignore
├─ next.config.ts
├─ package.json
└─ tailwind.config.ts
```

Recommended separation rules:
- `src/app` and `src/components/public` are client-facing.
- `src/server` contains business logic, secret access, and chain writes.
- `src/lib/env.ts` validates environment variables.
- `src/lib/security.ts` holds shared guards and safe helpers.
- Route handlers in `src/app/api` should call server services, not raw secret logic.

## 8) Minimal zero-budget checklist
- [ ] Install Node.js v22+.
- [ ] Enable pnpm via Corepack.
- [ ] Scaffold Next.js with TypeScript and Tailwind.
- [ ] Install `viem` and `@celo/web3-plugin-transaction-types`.
- [ ] Add `Celo_RPC_URL` and keep secrets server-only.
- [ ] Build the app with separate `src/server` and `src/components/public` areas.
- [ ] Test a read-only RPC call first.
- [ ] Add reward-claim logic only after read access works.

## 9) Security checklist
- Never commit `.env`.
- Never expose private keys to the browser.
- Never use `NEXT_PUBLIC_` for secrets.
- Validate environment variables before startup.
- Keep transaction signing only in server-side code or a secure wallet flow.
- Use the minimum wallet permissions needed for testing.

## 10) First run verification
After setup, confirm the app boots:
```bash
pnpm dev
```

Then verify:
- The homepage loads.
- Tailwind styles are active.
- Your server-side RPC client can initialize.
- No secret values appear in browser logs or source bundles.

## 11) Suggested next steps
- Add a read-only balance page.
- Add reward eligibility checks.
- Add transaction submission endpoints.
- Add a minimal chat or assistant layer after the core app works.

## Conclusion
This setup keeps costs at zero while giving you a secure, production-shaped foundation for a Celo rewards app.
