This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

1. Open http://localhost:8888 in your browser (when running via Docker).
   Or http://localhost:3000 if running `npm run dev` locally.
2. Log in with demo credentials (see USAGE.md Demo Accounts section below).
   There is no public signup — accounts are created by admin via create_agent.sh.

## Demo Accounts

The following accounts are pre-created for demo purposes. Password: `demo123`

| Username | Name           | Role            | City      | Email              |
|----------|----------------|-----------------|-----------|--------------------|
| dean     | Duy Dean Pham  | Senior Broker   | Nha Trang | dean@fidt.vn       |
| sarah    | Sarah Tran     | Associate       | HCMC      | sarah@fidt.vn      |
| minh     | Minh Le        | Junior Agent    | Hanoi     | minh@fidt.vn       |

To create additional accounts (admin only):
./scripts/create_agent.sh <username> <name> <password> [phone] [email]

# When using Docker (default):
./scripts/create_agent.sh dean "Dean Nguyen" demo123 0868331111 dean@fidt.vn

# When using npm run dev (no Docker):
PORT=3000 ./scripts/create_agent.sh dean "Dean Nguyen" demo123 0868331111 dean@fidt.vn

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
