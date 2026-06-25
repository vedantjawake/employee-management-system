-- Employee Management System — Database Schema
-- Run this once to create all tables before starting the application.
-- Usage: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS employee_management
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE employee_management;

-- ── Admins ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
    id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    password      VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    email         VARCHAR(150) NOT NULL UNIQUE,
    profile_image VARCHAR(255) DEFAULT NULL,
    created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Departments ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS departments (
    id              INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL UNIQUE,
    description     TEXT         DEFAULT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ── Employees ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
    id            INT            NOT NULL AUTO_INCREMENT PRIMARY KEY,
    full_name     VARCHAR(100)   NOT NULL,
    email         VARCHAR(150)   NOT NULL UNIQUE,
    phone         VARCHAR(20)    DEFAULT NULL,
    department_id INT            DEFAULT NULL,
    position      VARCHAR(100)   DEFAULT NULL,
    joining_date  DATE           DEFAULT NULL,
    salary        DECIMAL(12, 2) DEFAULT NULL,
    address       TEXT           DEFAULT NULL,
    profile_image VARCHAR(255)   DEFAULT NULL,
    status        ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_employee_department
        FOREIGN KEY (department_id) REFERENCES departments (id)
        ON DELETE SET NULL ON UPDATE CASCADE
);

-- ── Attendance ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance (
    id          INT  NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_id INT  NOT NULL,
    date        DATE NOT NULL,
    status      ENUM('present', 'absent', 'late', 'half-day') NOT NULL DEFAULT 'present',
    check_in    TIME DEFAULT NULL,
    check_out   TIME DEFAULT NULL,
    notes       TEXT DEFAULT NULL,
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_attendance_emp_date (employee_id, date),
    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id) REFERENCES employees (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- ── Salaries ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS salaries (
    id            INT            NOT NULL AUTO_INCREMENT PRIMARY KEY,
    employee_id   INT            NOT NULL,
    month         TINYINT        NOT NULL COMMENT '1-12',
    year          SMALLINT       NOT NULL,
    basic_salary  DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    bonus         DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    deductions    DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    net_salary    DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    payment_date  DATE           DEFAULT NULL,
    status        ENUM('pending', 'paid') NOT NULL DEFAULT 'pending',
    created_at    TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_salary_emp_period (employee_id, month, year),
    CONSTRAINT fk_salary_employee
        FOREIGN KEY (employee_id) REFERENCES employees (id)
        ON DELETE CASCADE ON UPDATE CASCADE
);
