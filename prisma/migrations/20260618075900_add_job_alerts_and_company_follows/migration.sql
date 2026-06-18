-- CreateTable
CREATE TABLE "JobAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "bransje" TEXT,
    "kategori" TEXT,
    "sted" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" DATETIME
);

-- CreateTable
CREATE TABLE "CompanyFollow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "followerName" TEXT,
    "accountId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyFollow_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "JobAlert_token_key" ON "JobAlert"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyFollow_token_key" ON "CompanyFollow"("token");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyFollow_email_accountId_key" ON "CompanyFollow"("email", "accountId");
