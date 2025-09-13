/*
  Warnings:

  - You are about to drop the column `email` on the `user` table. All the data in the column will be lost.
  - You are about to drop the `friendship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."friendship" DROP CONSTRAINT "friendship_friendId_fkey";

-- DropForeignKey
ALTER TABLE "public"."friendship" DROP CONSTRAINT "friendship_userId_fkey";

-- DropIndex
DROP INDEX "public"."user_email_key";

-- AlterTable
ALTER TABLE "public"."message" ADD COLUMN     "groupId" TEXT,
ALTER COLUMN "receiverId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "public"."user" DROP COLUMN "email";

-- DropTable
DROP TABLE "public"."friendship";

-- CreateTable
CREATE TABLE "public"."group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."groupmember" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,

    CONSTRAINT "groupmember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "groupmember_userId_groupId_key" ON "public"."groupmember"("userId", "groupId");

-- AddForeignKey
ALTER TABLE "public"."message" ADD CONSTRAINT "message_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."groupmember" ADD CONSTRAINT "groupmember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."groupmember" ADD CONSTRAINT "groupmember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."group"("id") ON DELETE CASCADE ON UPDATE CASCADE;
