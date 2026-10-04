# Sarafina Ethereal

A responsive music membership site with amber portrait gradients, Clerk sign-in, a music archive, monthly posts, a creator studio, and Stripe subscriptions at USD $2.99 per month.

## Deploy on Vercel

1. Import this repository as a Next.js project. The root directory is the repository root.
2. Connect a Turso database and set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN. Run `pnpm db:migrate` with those secrets configured locally. No seed tracks or sample posts are created.
3. Connect a **private** Vercel Blob store; set BLOB_READ_WRITE_TOKEN. Creator uploads go directly to private Blob storage, supporting files up to 50 MB without Vercel's 4.5 MB request limit. Downloads require server-side membership checks. Do not use a public Blob store for member content.
4. Configure a dedicated Clerk application with NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY. Claim the development application and switch to production keys on the final domain. Enable the desired email and social login methods in Clerk.
5. Set SITE_URL to the exact Vercel production origin and OWNER_EMAIL to the creator's verified Clerk email.
6. Connect Sarafina's separate sole-proprietor Stripe account. Create a USD 299-cent recurring monthly price and set STRIPE_SECRET_KEY, STRIPE_PRICE_ID and STRIPE_WEBHOOK_SECRET. Configure the billing portal and /api/webhook for checkout.session.completed, checkout.session.async_payment_succeeded, customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.paid and invoice.payment_failed. Validate applicable sales tax; automatic tax is not enabled.
7. Test sign-in, creator uploads, member/public content, audio seeking, checkout, renewal, failed payment, cancellation, and two-account isolation before opening paid memberships.

`pnpm install`, `pnpm dev`, `pnpm typecheck`, `pnpm build`.

## Current launch status

The design and application implementation are ready for deployment. Credentials, database/Blob provisioning, creator account, first music upload, live Stripe configuration, and hands-on end-to-end tests are still required. Missing setup displays a recoverable unavailable state; payment buttons do not charge while Stripe configuration is incomplete.

This is a standalone Next.js port of the existing private preview. It has no Cloudflare bindings or Sites hosting dependency. Existing data/files do not transfer automatically; audit and migrate any published content before switching domains.

## Free discovery and member access

Publish one or two complete songs as `Music` with `Everyone` access. The two newest public audio tracks appear as inline homepage players with no login required. Visitors can create a free Clerk account without a card. Posts set to `Free & paid members` require sign-in; `Paid inner circle members` require an active subscription. Public preview copy (up to 400 characters) appears on locked cards, while the full body and media remain protected server-side. No email notifications are promised or sent by this implementation.

Run `pnpm db:migrate` after connecting the database; this also adds the preview field to existing databases safely. Verify access with `pnpm test`. The first free songs need real uploads; no sample recordings are seeded.
