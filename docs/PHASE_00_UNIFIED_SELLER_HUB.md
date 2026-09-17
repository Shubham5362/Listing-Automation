# Phase 00 — Unified Seller Operations Foundation

**Phase name:** Unified Seller Operations Foundation
**Product:** Personal AI Seller Hub
**Target:** Private internal seller-management console for Amazon + Flipkart
**Status:** Master scope established; existing phase work is consolidated under one acceptance contract.

## Phase 00 objective

Make the product behave as one coherent Seller Hub rather than a collection of feature phases. Every seller workflow must have a first-class UI surface, a backend capability, an auditable action path, and an AI-assisted path where useful.

## 1. Dashboard / Home

- Today’s sales, orders, units sold, revenue/GMV, net profit and margin
- Returns, cancellation rate, inventory value, low-stock and out-of-stock counts
- Active/suppressed listings, pending actions and approvals
- Marketplace health and sync status
- AI business summary, recommendations, critical alerts and recent activity
- Sales/order/profit/inventory trends
- Marketplace-wise performance

## 2. Orders

- Unified order list and lifecycle: new, confirmed, processing, packed, shipped, delivered, cancelled
- Return/refund states and SLA-breach visibility
- Search, date, marketplace, status, SKU and order filters
- Order detail, invoice, shipping label, tracking and bulk actions
- Export and AI Order Assistant

## 3. Products / Catalog

- Master product catalog with SKU/product ID/HSN/GST/brand/category
- Attributes, variants, media, descriptions, bullets, keywords and compliance fields
- Dimensions, weight, manufacturer and country of origin
- Add/edit/archive, duplicate detection, bulk import/export and enrichment

## 4. Listings

- Active, inactive, draft, suppressed, blocked and failed states
- Listing quality scoring across title, images, description, attributes and SEO
- Marketplace/SKU mapping, sync, bulk update and history
- AI title, bullets, description, keywords and listing optimization

## 5. Inventory

- Available, reserved, damaged, in-transit, low-stock and OOS inventory
- SKU, marketplace and warehouse views
- Stock movement, adjustment, transfer and history
- Reorder level, safety stock, days of inventory and dead/slow/fast/overstock analysis
- Stockout prediction, AI reorder recommendations and purchase planning

## 6. Returns & Refunds

- Request, approval/rejection, pickup, transit, received and refund lifecycle
- Return reasons, marketplace/product analysis, rate, refund amount and cost
- Customer issue signals and abuse/fraud indicators
- AI return analysis

## 7. Pricing

- Cost, selling price, MRP, discount, min/max and margin protection
- Competitor and Buy Box intelligence
- Price history, rules, schedules and bulk updates
- Dynamic pricing, AI recommendations and price-change simulation

## 8. Advertising

- Campaigns, ad groups, keywords and search terms
- Impressions, clicks, CTR, CPC, spend, sales, ACOS, ROAS and conversion
- Budgets, alerts, creation, optimization and bulk actions
- AI campaign optimizer, wasted-spend detection and keyword recommendations

## 9. Finance

- Revenue/GMV/net sales and marketplace fees
- Commission, shipping/referral/advertising/return costs
- Refunds, GST, TCS, TDS and other charges
- COGS, gross/net profit and margin
- Settlements, reconciliation, payouts and pending payments
- SKU/marketplace profitability

## 10. Analytics / BI

- Sales, orders, product/SKU, listing, inventory, pricing, advertising and return analytics
- Profit, marketplace comparison, customer and growth analytics
- Trend analysis, forecasting, cohorts and top/worst performers
- Custom reports and export

## 11. Marketplaces

- Amazon + Flipkart account management
- Connect/authentication/account health/API status
- Last sync, sync-now, sync history and API errors
- Marketplace/category/attribute/SKU mapping
- Health monitoring and connection recovery

## 12. AI Seller Copilot

- Natural-language business questions across every seller domain
- Daily briefing, alerts, opportunity/anomaly detection and root-cause analysis
- Recommendations with explicit action plans
- Execute action, approval-required state, action history and audit trail

## 13. AI Listing Studio

- Product/media input and image analysis
- AI title, bullets, description, keywords and attributes
- SEO/compliance checks and marketplace adaptation
- Amazon/Flipkart variants, quality score, regeneration and comparison
- Save draft and publish workflow

## 14. Automation Center

- Automation dashboard and creation
- Triggers, conditions and actions
- Scheduled/recurring jobs
- Inventory, pricing, listing, order, advertising, notification and AI automations
- Logs, failure handling, retry, pause/resume and history

## 15. Control Center

- Running, queued, completed and failed jobs
- Approvals and human-in-the-loop controls
- AI/system actions, execution history and rollback/recovery
- Full audit trail and job details

## 16. Notifications

- Critical/warning/info notifications
- Order, inventory, listing, pricing, advertising, finance, marketplace and AI alerts
- Read/unread state and notification preferences

## 17. Diagnostics

- System, marketplace, API and sync health
- Listing/order/inventory/automation/AI errors
- Root cause, error logs, suggested fixes and one-click safe fixes
- Retry and recovery history

## 18. Reports

- Sales, orders, inventory, products, listings, returns, finance, advertising and profit reports
- Marketplace/tax/custom reports
- Scheduled reporting and PDF/Excel/CSV export

## 19. Settings

- Business/seller profile and marketplace accounts
- Warehouse, GST and shipping settings
- Notification, AI and automation settings
- Appearance, data management, backup and system preferences

## 20. Global enterprise UX

- Global search and AI search
- Command palette
- Date range, marketplace, warehouse and SKU filters
- Advanced/saved filters
- Export, refresh and bulk actions
- Pagination, sorting and column customization
- Detail drawer, confirmation modal, toasts, skeletons and robust empty/error states
- Keyboard shortcuts, responsive layout, dark mode
- Activity timeline and audit trail
- Contextual AI action entry points

## 21. Canonical navigation

```text
Dashboard
SELL
  Orders
  Products
  Listings
  Inventory
  Returns
GROW
  Pricing
  Advertising
  Analytics
  Finance
AUTOMATE
  Automations
  AI Listing Studio
  AI Seller Copilot
SYSTEM
  Marketplaces
  Notifications
  Control Center
  Diagnostics
  Reports
  Settings
```

## Acceptance rule

A Phase 00 capability is not considered complete merely because an API or isolated component exists. The workflow must be discoverable from the Seller Hub navigation, render meaningful live/empty/error states, expose the relevant operation, preserve auditability, and provide AI assistance when the capability is AI-enabled.

## Existing implementation consolidation

The repository already contains dedicated backend APIs/services/models/tests for catalog, listings, inventory, orders, returns, pricing, finance, advertising, marketplaces, automation, notifications, diagnostics, AI seller-agent, AI listing, autonomous execution, intelligence, reporting and reliability. Phase 00 therefore acts as the **single product-level contract** that these implementations must satisfy together, rather than duplicating them as another parallel architecture.
