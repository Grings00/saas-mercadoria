-- Migration: adiciona modelo Responsible e relação com Movement
-- Rode este SQL no Supabase SQL Editor

-- 1. Tabela Responsible
CREATE TABLE "Responsible" (
  "id"        TEXT NOT NULL,
  "name"      TEXT NOT NULL,
  "role"      TEXT,
  "userId"    TEXT NOT NULL,
  "active"    BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Responsible_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Responsible_userId_idx" ON "Responsible" ("userId");

ALTER TABLE "Responsible"
  ADD CONSTRAINT "Responsible_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Coluna responsibleId em Movement (nullable — entradas não exigem)
ALTER TABLE "Movement" ADD COLUMN "responsibleId" TEXT;

ALTER TABLE "Movement"
  ADD CONSTRAINT "Movement_responsibleId_fkey"
  FOREIGN KEY ("responsibleId") REFERENCES "Responsible"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
