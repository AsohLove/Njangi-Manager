/*
  Warnings:

  - You are about to drop the column `memberId` on the `payments` table. All the data in the column will be lost.
  - Made the column `applied_at` on table `fines` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `position_id` to the `payouts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "payments" DROP CONSTRAINT "payments_memberId_fkey";

-- AlterTable
ALTER TABLE "adjustments" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "cycles" ALTER COLUMN "started_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "completed_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "fines" ALTER COLUMN "applied_at" SET NOT NULL,
ALTER COLUMN "applied_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "paid_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "fund_spending" ALTER COLUMN "spent_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "groups" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "payments" DROP COLUMN "memberId",
ALTER COLUMN "paid_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "payouts" ADD COLUMN     "position_id" INTEGER NOT NULL,
ADD COLUMN     "shortfall" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "paid_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "rounds" ALTER COLUMN "opened_at" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "closed_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMPTZ(3);

-- AddForeignKey
ALTER TABLE "payouts" ADD CONSTRAINT "payouts_position_id_fkey" FOREIGN KEY ("position_id") REFERENCES "positions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;


-- Enforce positive monetary amounts
ALTER TABLE "groups"
ADD CONSTRAINT "groups_amount_positive"
CHECK ("amount" > 0);

ALTER TABLE "fine_rules"
ADD CONSTRAINT "fine_rules_default_amount_positive"
CHECK ("default_amount" > 0);

ALTER TABLE "payments"
ADD CONSTRAINT "payments_amount_positive"
CHECK ("amount" > 0);

ALTER TABLE "payouts"
ADD CONSTRAINT "payouts_amount_nonnegative"
CHECK ("amount" >= 0);

ALTER TABLE "payouts"
ADD CONSTRAINT "payouts_shortfall_nonnegative"
CHECK ("shortfall" >= 0);

ALTER TABLE "fines"
ADD CONSTRAINT "fines_amount_positive"
CHECK ("amount" > 0);

ALTER TABLE "fund_spending"
ADD CONSTRAINT "fund_spending_amount_positive"
CHECK ("amount" > 0);

ALTER TABLE "adjustments"
ADD CONSTRAINT "adjustments_amount_nonzero"
CHECK ("amount" <> 0);

-- Only one active cycle per group
CREATE UNIQUE INDEX "one_active_cycle_per_group"
ON "cycles" ("group_id")
WHERE "status" = 'active';

-- Only one open round per cycle
CREATE UNIQUE INDEX "one_open_round_per_cycle"
ON "rounds" ("cycle_id")
WHERE "status" = 'open';
