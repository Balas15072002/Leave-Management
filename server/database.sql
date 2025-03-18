-- Create database
CREATE DATABASE IF NOT EXISTS leave_management;
USE leave_management;

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('admin', 'employee') DEFAULT 'employee',
  department VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leave_types table
CREATE TABLE IF NOT EXISTS leave_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  default_days INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create leaves table
CREATE TABLE IF NOT EXISTS leaves (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  leave_type_id INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INT NOT NULL,
  reason TEXT NOT NULL,
  status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (leave_type_id) REFERENCES leave_types(id) ON DELETE CASCADE
);

-- Insert default admin user
INSERT INTO employees (name, email, password, role, department, position)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2a$10$OMUm5Cmf.nVUfhZ8YvZVW.ib2Qd5vCvYUrqzBjNRqn9gxbfgWNHlO', -- password: admin123
  'admin',
  'Administration',
  'System Administrator'
);

-- Insert default employee user
INSERT INTO employees (name, email, password, role, department, position)
VALUES (
  'John Doe',
  'employee@example.com',
  '$2a$10$OMUm5Cmf.nVUfhZ8YvZVW.ib2Qd5vCvYUrqzBjNRqn9gxbfgWNHlO', -- password: admin123
  'employee',
  'Engineering',
  'Software Developer'
);

-- Insert default leave types
INSERT INTO leave_types (name, description, default_days)
VALUES 
  ('Annual Leave', 'Regular paid time off for vacation or personal matters', 20),
  ('Sick Leave', 'Leave due to illness or medical appointments', 10),
  ('Maternity Leave', 'Leave for female employees before and after childbirth', 90),
  ('Paternity Leave', 'Leave for male employees after the birth of their child', 14),
  ('Bereavement Leave', 'Leave due to death of a family member', 5);

