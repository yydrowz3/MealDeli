-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('PADDLE');

-- CreateEnum
CREATE TYPE "PromotionCheckoutStatus" AS ENUM ('PENDING', 'READY', 'FAILED', 'COMPLETED');

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "promoted_until" TIMESTAMPTZ(3);

-- CreateTable
CREATE TABLE "promotion_checkouts" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PADDLE',
    "owner_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "provider_transaction_id" VARCHAR(64),
    "status" "PromotionCheckoutStatus" NOT NULL DEFAULT 'PENDING',
    "failed_at" TIMESTAMPTZ(3),
    "completed_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "promotion_checkouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_webhook_events" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PADDLE',
    "provider_event_id" VARCHAR(64) NOT NULL,
    "provider_notification_id" VARCHAR(64) NOT NULL,
    "event_type" VARCHAR(80) NOT NULL,
    "provider_transaction_id" VARCHAR(64) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL,
    "received_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "payment_webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PADDLE',
    "owner_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "checkout_id" UUID NOT NULL,
    "webhook_event_id" UUID NOT NULL,
    "provider_transaction_id" VARCHAR(64) NOT NULL,
    "price_id" VARCHAR(64) NOT NULL,
    "unit_amount_minor" INTEGER NOT NULL,
    "amount_minor" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL,
    "promotion_starts_at" TIMESTAMPTZ(3) NOT NULL,
    "promotion_ends_at" TIMESTAMPTZ(3) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "promotion_checkouts_provider_transaction_key" ON "promotion_checkouts"("provider_transaction_id");

-- CreateIndex
CREATE INDEX "promotion_checkouts_owner_page_idx" ON "promotion_checkouts"("owner_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "promotion_checkouts_restaurant_idx" ON "promotion_checkouts"("restaurant_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payment_webhook_events_provider_event_key" ON "payment_webhook_events"("provider_event_id");

-- CreateIndex
CREATE INDEX "payment_webhook_events_transaction_idx" ON "payment_webhook_events"("provider_transaction_id");

-- CreateIndex
CREATE INDEX "payment_webhook_events_received_idx" ON "payment_webhook_events"("received_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "payments_checkout_key" ON "payments"("checkout_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_webhook_event_key" ON "payments"("webhook_event_id");

-- CreateIndex
CREATE UNIQUE INDEX "payments_provider_transaction_key" ON "payments"("provider_transaction_id");

-- CreateIndex
CREATE INDEX "payments_owner_page_idx" ON "payments"("owner_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "payments_restaurant_idx" ON "payments"("restaurant_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "restaurants_promotion_page_idx" ON "restaurants"("promoted_until", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "restaurants_owner_promotion_page_idx" ON "restaurants"("owner_id", "promoted_until", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "restaurants_category_promotion_page_idx" ON "restaurants"("category_id", "promoted_until", "created_at" DESC, "id" DESC);

-- AddForeignKey
ALTER TABLE "promotion_checkouts" ADD CONSTRAINT "promotion_checkouts_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "promotion_checkouts" ADD CONSTRAINT "promotion_checkouts_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_checkout_id_fkey" FOREIGN KEY ("checkout_id") REFERENCES "promotion_checkouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_webhook_event_id_fkey" FOREIGN KEY ("webhook_event_id") REFERENCES "payment_webhook_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
