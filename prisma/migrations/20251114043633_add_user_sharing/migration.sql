-- CreateTable
CREATE TABLE `file_share_users` (
    `id` VARCHAR(191) NOT NULL,
    `fileId` VARCHAR(191) NOT NULL,
    `sharedWithUserId` VARCHAR(191) NOT NULL,
    `sharedByUserId` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `file_share_users_fileId_sharedWithUserId_key`(`fileId`, `sharedWithUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `file_share_users` ADD CONSTRAINT `file_share_users_fileId_fkey` FOREIGN KEY (`fileId`) REFERENCES `files`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_share_users` ADD CONSTRAINT `file_share_users_sharedWithUserId_fkey` FOREIGN KEY (`sharedWithUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `file_share_users` ADD CONSTRAINT `file_share_users_sharedByUserId_fkey` FOREIGN KEY (`sharedByUserId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
