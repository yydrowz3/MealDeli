-- Enforce idempotency for payment provider transaction IDs.
CREATE UNIQUE INDEX "payments_transaction_id_key" ON "payments"("transaction_id");
