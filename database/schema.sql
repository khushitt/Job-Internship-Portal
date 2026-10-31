-- ============================================================
-- CareerConnect — Full Database Schema & Migration Script
-- Run this in MySQL to set up / update the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS job_portal;
USE job_portal;

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    user_id    INT          NOT NULL AUTO_INCREMENT,
    name       VARCHAR(100) NOT NULL,
    email      VARCHAR(150) NOT NULL UNIQUE,
    password   VARCHAR(255) NOT NULL,
    role       ENUM('student', 'recruiter', 'admin') NOT NULL DEFAULT 'student',
    created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
);

-- ============================================================
-- STUDENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
    student_id  INT          NOT NULL AUTO_INCREMENT,
    user_id     INT          NOT NULL UNIQUE,
    phone       VARCHAR(20),
    college     VARCHAR(200) NOT NULL,
    degree      VARCHAR(150) NOT NULL,
    skills      TEXT,
    resume      VARCHAR(255),          -- legacy text field (URL / path)
    resume_file VARCHAR(255),          -- NEW: actual uploaded filename
    created_at  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (student_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Add resume_file column if the table already exists (idempotent migration)
ALTER TABLE students ADD COLUMN IF NOT EXISTS resume_file VARCHAR(255) DEFAULT NULL;

-- ============================================================
-- RECRUITERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS recruiters (
    recruiter_id         INT          NOT NULL AUTO_INCREMENT,
    user_id              INT          NOT NULL UNIQUE,
    company_name         VARCHAR(200) NOT NULL,
    company_description  TEXT,
    company_website      VARCHAR(300),
    phone                VARCHAR(20),
    created_at           TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (recruiter_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- JOBS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
    job_id               INT           NOT NULL AUTO_INCREMENT,
    recruiter_id         INT           NOT NULL,
    title                VARCHAR(200)  NOT NULL,
    description          TEXT          NOT NULL,
    company_name         VARCHAR(200)  NOT NULL,
    location             VARCHAR(150)  NOT NULL,
    job_type             ENUM('Job', 'Internship') NOT NULL DEFAULT 'Job',
    skills_required      TEXT,
    salary               VARCHAR(100),
    application_deadline DATE,
    created_at           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (job_id),
    FOREIGN KEY (recruiter_id) REFERENCES recruiters(recruiter_id) ON DELETE CASCADE
);

-- ============================================================
-- APPLICATIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
    application_id     INT  NOT NULL AUTO_INCREMENT,
    student_id         INT  NOT NULL,
    job_id             INT  NOT NULL,
    application_status ENUM('Applied', 'Shortlisted', 'Rejected', 'Selected') NOT NULL DEFAULT 'Applied',
    applied_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (application_id),
    UNIQUE KEY uq_student_job (student_id, job_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id)     REFERENCES jobs(job_id)         ON DELETE CASCADE
);

-- ============================================================
-- SAVED JOBS TABLE  (NEW)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_jobs (
    id         INT NOT NULL AUTO_INCREMENT,
    student_id INT NOT NULL,
    job_id     INT NOT NULL,
    saved_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_saved (student_id, job_id),
    FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
    FOREIGN KEY (job_id)     REFERENCES jobs(job_id)         ON DELETE CASCADE
);

-- ============================================================
-- NOTIFICATIONS TABLE  (NEW)
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
    notification_id INT          NOT NULL AUTO_INCREMENT,
    user_id         INT          NOT NULL,
    message         VARCHAR(500) NOT NULL,
    is_read         TINYINT(1)   NOT NULL DEFAULT 0,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- ============================================================
-- DEFAULT ADMIN USER
-- Password: Admin@1234  (bcrypt hash generated externally)
-- Replace the hash below if you want a different password
-- ============================================================
INSERT IGNORE INTO users (name, email, password, role)
VALUES (
    'Admin',
    'admin@careerconnect.com',
    '$2b$10$9XWR4dj/tZqjKxCY3G3iWuqsH9eVaxWt9LNNXvGmEq3RbxFc0ZMzK',
    'admin'
);
