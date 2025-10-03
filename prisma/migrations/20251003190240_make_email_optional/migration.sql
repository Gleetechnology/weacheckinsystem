-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attendee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "qrData" TEXT NOT NULL,
    "qrCode" TEXT NOT NULL,
    "checkedIn" BOOLEAN NOT NULL DEFAULT false,
    "checkedInAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nameCol" TEXT,
    "emailCol" TEXT,
    "phoneCol" TEXT,
    "attendeeId" TEXT,
    "fullName" TEXT,
    "column2" TEXT,
    "organization" TEXT,
    "preferredTitle" TEXT,
    "positionInOrganization" TEXT,
    "regionOfWork" TEXT,
    "phoneKorean" TEXT,
    "koreanText" TEXT,
    "positionKorean" TEXT,
    "englishText" TEXT,
    "positionEnglish" TEXT,
    "extraData" TEXT
);
INSERT INTO "new_Attendee" ("attendeeId", "checkedIn", "checkedInAt", "column2", "createdAt", "email", "emailCol", "englishText", "extraData", "fullName", "id", "koreanText", "name", "nameCol", "organization", "phone", "phoneCol", "phoneKorean", "positionEnglish", "positionInOrganization", "positionKorean", "preferredTitle", "qrCode", "qrData", "regionOfWork") SELECT "attendeeId", "checkedIn", "checkedInAt", "column2", "createdAt", "email", "emailCol", "englishText", "extraData", "fullName", "id", "koreanText", "name", "nameCol", "organization", "phone", "phoneCol", "phoneKorean", "positionEnglish", "positionInOrganization", "positionKorean", "preferredTitle", "qrCode", "qrData", "regionOfWork" FROM "Attendee";
DROP TABLE "Attendee";
ALTER TABLE "new_Attendee" RENAME TO "Attendee";
CREATE UNIQUE INDEX "Attendee_email_key" ON "Attendee"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
