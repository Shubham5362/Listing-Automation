# Phase 2 Marketplace Setup

The Seller Hub has a personal, no-login marketplace workspace. Marketplace secrets are never entered into the browser; they are configured on the Render API service and encrypted into the Seller Hub database at startup.

## Amazon India

Configure these environment variables on the Render `seller-hub-api` service:

- `AMAZON_SELLER_ID`
- `AMAZON_LWA_CLIENT_ID`
- `AMAZON_LWA_CLIENT_SECRET`
- `AMAZON_LWA_REFRESH_TOKEN`
- `AMAZON_AWS_ACCESS_KEY_ID`
- `AMAZON_AWS_SECRET_ACCESS_KEY`
- `AMAZON_AWS_SESSION_TOKEN` (only when the AWS credentials use a session token)

The default India marketplace is `A21TJRUUN4KGV`, with the EU SP-API endpoint/region configured for the India marketplace.

## Flipkart

Configure:

- `FLIPKART_SELLER_ID`
- `FLIPKART_APP_ID`
- `FLIPKART_APP_SECRET`

## After configuring credentials

1. Redeploy/restart `seller-hub-api` so the personal marketplace accounts are bootstrapped.
2. Open **Marketplaces** in Seller Hub.
3. Use **Test** for each configured marketplace.
4. Use **Sync** to queue the first full sync.
5. The background worker imports products, listings, inventory, orders and prices and records the sync result.
6. Scheduled marketplace syncs run automatically according to `MARKETPLACE_SYNC_INTERVAL_MINUTES` (default: 30 minutes).

Never commit these values to GitHub and never paste marketplace secrets into chat.
