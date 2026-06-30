ALTER TABLE "tasks"
ADD COLUMN "recurrence_type" VARCHAR(20),
ADD COLUMN "recurrence_days" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN "recurrence_anchor" TIMESTAMP(3),
ADD COLUMN "next_due_at" TIMESTAMP(3);

CREATE INDEX "tasks_user_id_recurrence_type_next_due_at_idx" ON "tasks"("user_id", "recurrence_type", "next_due_at");
