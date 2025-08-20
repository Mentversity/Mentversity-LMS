require('dotenv').config();
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const ModuleModel = require('../src/models/Module');
const Topic = require('../src/models/Topic');

(async () => {
  try {
    await connectDB();

    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      ModuleModel.deleteMany({}),
      Topic.deleteMany({})
    ]);

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@lms.com',
      password: 'Admin@123',
      role: 'admin'
    });

    const student = await User.create({
      name: 'Student User',
      email: 'student@lms.com',
      password: 'Student@123',
      role: 'student'
    });

    const course = await Course.create({
      title: 'MERN LMS 101',
      description: 'Starter course for LMS V1',
      enrolledStudents: [student._id]
    });

    const mod1 = await ModuleModel.create({ course: course._id, title: 'Introduction', order: 1 });
    const mod2 = await ModuleModel.create({ course: course._id, title: 'Core Concepts', order: 2 });

    await Topic.create({ module: mod1._id, title: 'What is an LMS?', order: 1 });
    await Topic.create({ module: mod1._id, title: 'System Overview', order: 2 });
    await Topic.create({ module: mod2._id, title: 'Auth & Roles', order: 1 });
    await Topic.create({ module: mod2._id, title: 'Tracking Progress', order: 2 });

    console.log('Seed complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
