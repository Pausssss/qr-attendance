// File: backend/src/models/index.js
import { sequelize } from '../config/db.js';
import UserModel from './userModel.js';
import ClassModel from './classModel.js';
import ClassMemberModel from './classMemberModel.js';
import SessionModel from './sessionModel.js';
import AttendanceModel from './attendanceModel.js';

// Khởi tạo models
const User = UserModel(sequelize);
const Class = ClassModel(sequelize);
const ClassMember = ClassMemberModel(sequelize);
const Session = SessionModel(sequelize);
const Attendance = AttendanceModel(sequelize);

// Associations
Class.belongsTo(User, { as: 'teacher', foreignKey: 'teacherId' });
User.hasMany(Class, { as: 'classes', foreignKey: 'teacherId' });

ClassMember.belongsTo(Class, { foreignKey: 'classId' });
ClassMember.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Class.hasMany(ClassMember, { as: 'members', foreignKey: 'classId' });
User.hasMany(ClassMember, { as: 'classMemberships', foreignKey: 'studentId' });

Session.belongsTo(Class, { foreignKey: 'classId' });
Class.hasMany(Session, { as: 'sessions', foreignKey: 'classId' });

Attendance.belongsTo(Session, { foreignKey: 'sessionId' });
Attendance.belongsTo(User, { as: 'student', foreignKey: 'studentId' });
Session.hasMany(Attendance, {
  as: 'attendanceRecords',
  foreignKey: 'sessionId'
});
User.hasMany(Attendance, { as: 'attendance', foreignKey: 'studentId' });

export { sequelize, User, Class, ClassMember, Session, Attendance };
