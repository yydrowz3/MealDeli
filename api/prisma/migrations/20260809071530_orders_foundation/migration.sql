-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'COOKING', 'COOKED', 'PICKED_UP', 'DELIVERED');

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "customer_id" UUID NOT NULL,
    "restaurant_id" UUID NOT NULL,
    "courier_id" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "total_minor" INTEGER NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "idempotency_key" UUID NOT NULL,
    "request_hash" CHAR(64) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "dish_id" UUID NOT NULL,
    "dish_name" VARCHAR(120) NOT NULL,
    "base_price_minor" INTEGER NOT NULL,
    "selected_options" JSONB NOT NULL DEFAULT '[]',
    "options_extra_minor" INTEGER NOT NULL,
    "line_total_minor" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "orders_customer_page_idx" ON "orders"("customer_id", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "orders_restaurant_status_page_idx" ON "orders"("restaurant_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "orders_courier_status_page_idx" ON "orders"("courier_id", "status", "created_at" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "orders_customer_idempotency_key" ON "orders"("customer_id", "idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_order_position_key" ON "order_items"("order_id", "position");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_courier_id_fkey" FOREIGN KEY ("courier_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
