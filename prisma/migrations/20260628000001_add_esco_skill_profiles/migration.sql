-- CreateTable
CREATE TABLE IF NOT EXISTS "EscoSkill" (
    "uri" TEXT NOT NULL PRIMARY KEY,
    "preferredLabelNb" TEXT,
    "preferredLabelEn" TEXT,
    "skillType" TEXT
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "JobSkillProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobListingId" TEXT NOT NULL,
    "skillUri" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 1.0,
    "signal" TEXT NOT NULL DEFAULT 'extracted',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobSkillProfile_jobListingId_fkey" FOREIGN KEY ("jobListingId") REFERENCES "JobListing" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobSkillProfile_skillUri_fkey" FOREIGN KEY ("skillUri") REFERENCES "EscoSkill" ("uri") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "CandidateSkillProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobSeekerId" TEXT NOT NULL,
    "skillUri" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 1.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CandidateSkillProfile_jobSeekerId_fkey" FOREIGN KEY ("jobSeekerId") REFERENCES "JobSeeker" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CandidateSkillProfile_skillUri_fkey" FOREIGN KEY ("skillUri") REFERENCES "EscoSkill" ("uri") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "JobSkillProfile_jobListingId_skillUri_key" ON "JobSkillProfile"("jobListingId", "skillUri");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CandidateSkillProfile_jobSeekerId_skillUri_key" ON "CandidateSkillProfile"("jobSeekerId", "skillUri");
