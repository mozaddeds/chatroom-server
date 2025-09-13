/*
  Warnings:

  - You are about to drop the `Friendship` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Friendship" DROP CONSTRAINT "Friendship_friendId_fkey";

-- DropForeignKey
ALTER TABLE "public"."Friendship" DROP CONSTRAINT "Friendship_userId_fkey";

-- DropTable
DROP TABLE "public"."Friendship";

-- CreateTable
CREATE TABLE "public"."friendship" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "friendId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friendship_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friendship_userId_friendId_key" ON "public"."friendship"("userId", "friendId");

-- AddForeignKey
ALTER TABLE "public"."friendship" ADD CONSTRAINT "friendship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friendship" ADD CONSTRAINT "friendship_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
