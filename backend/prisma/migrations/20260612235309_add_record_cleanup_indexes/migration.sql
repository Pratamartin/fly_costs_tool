-- CreateIndex
CREATE INDEX "InviteCode_expiresAt_idx" ON "InviteCode"("expiresAt");

-- CreateIndex
CREATE INDEX "InviteCode_usedAt_idx" ON "InviteCode"("usedAt");

-- CreateIndex
CREATE INDEX "User_passwordResetExpiresAt_idx" ON "User"("passwordResetExpiresAt");

-- CreateIndex
CREATE INDEX "UserSession_expiresAt_idx" ON "UserSession"("expiresAt");

-- CreateIndex
CREATE INDEX "UserSession_revokedAt_idx" ON "UserSession"("revokedAt");
