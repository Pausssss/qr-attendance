CREATE DATABASE IF NOT EXISTS qr_attendance
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE qr_attendance;

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';


CREATE TABLE Users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fullName VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  passwordHash VARCHAR(255) NULL,
  role ENUM('TEACHER','STUDENT') NOT NULL,
  googleId VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL
);


CREATE TABLE Classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  className VARCHAR(255) NOT NULL,
  code VARCHAR(20) NOT NULL UNIQUE,
  teacherId INT NOT NULL,
  createdAt DATETIME NOT NULL,
  FOREIGN KEY (teacherId) REFERENCES Users(id)
    ON DELETE CASCADE
);

CREATE TABLE ClassMembers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classId INT NOT NULL,
  studentId INT NOT NULL,
  joinedAt DATETIME NOT NULL,
  FOREIGN KEY (classId) REFERENCES Classes(id)
    ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES Users(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_class_student (classId, studentId)
);

CREATE TABLE Sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  classId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  sessionDate DATETIME NOT NULL,
  status ENUM('OPEN','CLOSED') NOT NULL DEFAULT 'CLOSED',
  qrToken VARCHAR(255) NULL,
  qrTokenExpiresAt DATETIME NULL,
  -- Lưu vị trí GPS của GIẢNG VIÊN lúc mở buổi học
  teacherLat DECIMAL(10,7) NULL,
  teacherLng DECIMAL(10,7) NULL,
  createdAt DATETIME NOT NULL,
  FOREIGN KEY (classId) REFERENCES Classes(id)
    ON DELETE CASCADE
);

CREATE TABLE Attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessionId INT NOT NULL,
  studentId INT NOT NULL,
  checkInTime DATETIME NOT NULL,
  gpsLat DECIMAL(10,7) NULL,
  gpsLng DECIMAL(10,7) NULL,
  photoUrl VARCHAR(1024) NULL,
  status ENUM('ON_TIME','LATE','ABSENT') NOT NULL DEFAULT 'ON_TIME',
  FOREIGN KEY (sessionId) REFERENCES Sessions(id)
    ON DELETE CASCADE,
  FOREIGN KEY (studentId) REFERENCES Users(id)
    ON DELETE CASCADE,
  UNIQUE KEY uq_session_student (sessionId, studentId)
);
