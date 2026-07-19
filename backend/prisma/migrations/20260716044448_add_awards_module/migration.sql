-- CreateTable
CREATE TABLE "AwardRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "societyId" TEXT NOT NULL,
    "awardType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "minEvents" INTEGER NOT NULL DEFAULT 0,
    "minVolHours" REAL NOT NULL DEFAULT 0.0,
    "minTasks" INTEGER NOT NULL DEFAULT 0,
    "weightEvents" REAL NOT NULL DEFAULT 1.0,
    "weightVolHrs" REAL NOT NULL DEFAULT 1.0,
    "weightTasks" REAL NOT NULL DEFAULT 1.0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AwardRule_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AwardNomination" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "societyId" TEXT NOT NULL,
    "awardRuleId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "score" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'NOMINATED',
    "reason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AwardNomination_societyId_fkey" FOREIGN KEY ("societyId") REFERENCES "Society" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AwardNomination_awardRuleId_fkey" FOREIGN KEY ("awardRuleId") REFERENCES "AwardRule" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AwardNomination_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AwardWinner" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nominationId" TEXT NOT NULL,
    "certificateUrl" TEXT,
    "qrCodeUrl" TEXT,
    "badgeUrl" TEXT,
    "shareCardUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AwardWinner_nominationId_fkey" FOREIGN KEY ("nominationId") REFERENCES "AwardNomination" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "AwardRule_societyId_awardType_key" ON "AwardRule"("societyId", "awardType");

-- CreateIndex
CREATE UNIQUE INDEX "AwardNomination_awardRuleId_memberId_period_key" ON "AwardNomination"("awardRuleId", "memberId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "AwardWinner_nominationId_key" ON "AwardWinner"("nominationId");
