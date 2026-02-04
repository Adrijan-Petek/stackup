# StackUp

StackUp is a Stacks mainnet daily streak app. Users connect a Stacks wallet, claim once per day, and unlock NFT badge milestones on-chain.

## Features
- Mainnet wallet connect + contract call flow
- Read-only streak and last-claim data
- Polished UI with light/dark toggle
- Custom brand assets (logo, icons, favicon)

## Tech Stack
- Next.js (App Router)
- TypeScript
- Stacks Connect + Stacks.js

## Quick Start
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Configuration
Update the contract details in `app/page.tsx`:
- `CONTRACT_ADDRESS`
- `CONTRACT_NAME`

## Scripts
```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Assets
- `public/logo/logo.png`
- `public/icons/`

## Deploy
```bash
npm run build
npm run start
```

Deploy on your preferred platform (Vercel, Netlify, or a VPS).
