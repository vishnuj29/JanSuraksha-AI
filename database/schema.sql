-- ==========================================================
-- 🛡️ JanSuraksha AI — Enterprise MySQL Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB & phpMyAdmin
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `jansuraksha_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `jansuraksha_db`;

-- ----------------------------------------------------------
-- 1. Table: users
-- Stores user accounts, roles, hashed passwords and profiles
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(128) NOT NULL,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `role` ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  `plan` VARCHAR(32) NOT NULL DEFAULT 'Free',
  `safety_score` INT UNSIGNED NOT NULL DEFAULT 85,
  `avatar` VARCHAR(8) NOT NULL DEFAULT 'JS',
  `location` VARCHAR(128) NOT NULL DEFAULT 'India',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_users_role` (`role`),
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 2. Table: sos_alerts
-- Stores all emergency alerts (Voice triggered or 1-tap SOS)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sos_alerts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NULL,
  `user_name` VARCHAR(128) NOT NULL,
  `user_email` VARCHAR(191) NOT NULL,
  `alert_type` VARCHAR(64) NOT NULL DEFAULT 'Voice Trigger',
  `latitude` DECIMAL(10, 8) NULL,
  `longitude` DECIMAL(11, 8) NULL,
  `google_maps_url` TEXT NULL,
  `address` VARCHAR(255) NULL,
  `status` ENUM('Active', 'Resolved', 'Escalated', 'False Alarm') NOT NULL DEFAULT 'Active',
  `responders_notified` INT UNSIGNED NOT NULL DEFAULT 3,
  `trigger_phrase` VARCHAR(128) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_alerts_user` (`user_email`),
  INDEX `idx_alerts_status` (`status`),
  INDEX `idx_alerts_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 3. Table: otp_records
-- Stores 6-digit email OTP codes with 10-minute expiry
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `otp_records` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL,
  `otp_code` VARCHAR(8) NOT NULL,
  `purpose` ENUM('login', 'registration', 'password_reset') NOT NULL DEFAULT 'login',
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_otp_email` (`email`),
  INDEX `idx_otp_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. Table: emergency_contacts
-- Stores trusted guardian contacts for each user
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `emergency_contacts` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_email` VARCHAR(191) NOT NULL,
  `contact_name` VARCHAR(128) NOT NULL,
  `contact_phone` VARCHAR(32) NOT NULL,
  `contact_email` VARCHAR(191) NULL,
  `relationship` VARCHAR(64) NOT NULL DEFAULT 'Guardian',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_contacts_user` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5. Table: safety_vault
-- Stores cryptographic evidence logs, recordings & snapshots
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS `safety_vault` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_email` VARCHAR(191) NOT NULL,
  `file_name` VARCHAR(255) NOT NULL,
  `file_type` ENUM('audio', 'video', 'photo', 'sensor_data') NOT NULL DEFAULT 'audio',
  `file_url` TEXT NULL,
  `file_size_kb` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_encrypted` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_vault_user` (`user_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 6. Seed Super Admin User (ec23019@glbitm.ac.in)
-- ----------------------------------------------------------
INSERT INTO `users` (`id`, `name`, `email`, `password_hash`, `phone`, `role`, `plan`, `safety_score`, `avatar`, `location`)
VALUES (
  'u-admin-1',
  'Vishnu Jaiswal (Admin)',
  'ec23019@glbitm.ac.in',
  '$2a$10$3s8FzV8i5QZtT61w/bYVpOkN1jN6rX.hS0H2QZ5pT0aQ7r9p3hC.',
  '+91 88740 47462',
  'admin',
  'Premium',
  99,
  'VJ',
  'Greater Noida, UP'
)
ON DUPLICATE KEY UPDATE 
  `role` = 'admin',
  `plan` = 'Premium';
