# Phase 38 — Finance & Tax Intelligence

Adds deterministic, seller-isolated finance intelligence on top of the existing finance ledger and settlement records.

## Capabilities

- Finance insight: revenue, expenses, GST, net profit, margin, operating cash flow and fee ratio.
- Fee anomaly detection and low-margin / negative-cash-flow warnings.
- Invoice-to-ledger matching with configurable tolerance.
- GST reconciliation: output tax minus input tax credit versus remitted tax.
- Idempotent settlement import keyed by marketplace account and external settlement ID.
- Finance agent integration for advisory investigation/recommendation signals.
- New APIs under `/api/v1/finance/intelligence`.

## Data integrity

No financial values are fabricated. Intelligence reads persisted `FinanceEntry` records supplied by the authenticated seller. Invoice and GST endpoints calculate only from the values submitted by the caller and are seller-authenticated.

## Automation boundary

This phase is advisory. It does not automatically file GST, issue invoices, transfer money, dispute settlements, change marketplace fees, or execute accounting actions.

## Future integration

Marketplace settlement adapters can feed the settlement import endpoint through the existing marketplace sync/job infrastructure. Provider-specific settlement parsing should be implemented only against documented Amazon/Flipkart APIs or reports and must preserve external settlement IDs for idempotency.
