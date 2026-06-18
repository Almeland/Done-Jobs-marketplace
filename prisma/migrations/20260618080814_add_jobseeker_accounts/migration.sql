-- AlterTable
ALTER TABLE "Account" ADD COLUMN "description" TEXT;
ALTER TABLE "Account" ADD COLUMN "website" TEXT;

-- CreateTable
CREATE TABLE "JobSeeker" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobListingId" TEXT NOT NULL,
    "jobSeekerId" TEXT,
    "applicantName" TEXT NOT NULL,
    "applicantEmail" TEXT NOT NULL,
    "applicantPhone" TEXT,
    "coverText" TEXT,
    "cvFileUrl" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Application_jobListingId_fkey" FOREIGN KEY ("jobListingId") REFERENCES "JobListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "JobSeeker" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Application" ("applicantEmail", "applicantName", "applicantPhone", "coverText", "cvFileUrl", "id", "jobListingId", "submittedAt") SELECT "applicantEmail", "applicantName", "applicantPhone", "coverText", "cvFileUrl", "id", "jobListingId", "submittedAt" FROM "Application";
DROP TABLE "Application";
ALTER TABLE "new_Application" RENAME TO "Application";
CREATE TABLE "new_CompanyFollow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "followerName" TEXT,
    "jobSeekerId" TEXT,
    "accountId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyFollow_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "JobSeeker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyFollow_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CompanyFollow" ("accountId", "createdAt", "email", "followerName", "id", "token") SELECT "accountId", "createdAt", "email", "followerName", "id", "token" FROM "CompanyFollow";
DROP TABLE "CompanyFollow";
ALTER TABLE "new_CompanyFollow" RENAME TO "CompanyFollow";
CREATE UNIQUE INDEX "CompanyFollow_token_key" ON "CompanyFollow"("token");
CREATE UNIQUE INDEX "CompanyFollow_email_accountId_key" ON "CompanyFollow"("email", "accountId");
CREATE TABLE "new_JobAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "jobSeekerId" TEXT,
    "name" TEXT,
    "bransje" TEXT,
    "kategori" TEXT,
    "sted" TEXT,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" DATETIME,
    CONSTRAINT "JobAlert_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "JobSeeker" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_JobAlert" ("bransje", "createdAt", "email", "id", "kategori", "lastSentAt", "sted", "token") SELECT "bransje", "createdAt", "email", "id", "kategori", "lastSentAt", "sted", "token" FROM "JobAlert";
DROP TABLE "JobAlert";
ALTER TABLE "new_JobAlert" RENAME TO "JobAlert";
CREATE UNIQUE INDEX "JobAlert_token_key" ON "JobAlert"("token");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "JobSeeker_email_key" ON "JobSeeker"("email");
