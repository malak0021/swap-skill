const express = require('express');
const cors = require('cors');
const { findMatches } = require('./matching/matchingEngine');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// مصفوفة فارغة تماماً - بدون أي بيانات ثابتة أو مسبقة
let students = [];

// مسار ترحيبي
app.get('/', (req, res) => {
  res.send('🎓 Skill Swap API is running (Zero Static Data)!');
});

/**
 * 1. تسجيل طالب جديد (أي حد يسجل بياناته هنا)
 */
app.post('/api/register', (req, res) => {
  const { name, email, phone, faculty, skillsToTeach, skillsToLearn } = req.body;

  // التحقق من الحقول المطلوبة
  if (!name || !email || !skillsToTeach || !skillsToLearn) {
    return res.status(400).json({ error: "الاسم، الإيميل، والمهارات مطلوبة!" });
  }

  // منع تكرار الإيميل
  const existingUser = students.find(s => s.email === email);
  if (existingUser) {
    return res.status(400).json({ error: "هذا الإيميل مسجل بالفعل!" });
  }

  // إنشاء حساب الطالب وحفظه ديناميكياً
  const newStudent = {
    id: "usr_" + Date.now(),
    name,
    email,
    phone: phone || "",
    faculty: faculty || "عام",
    skillsToTeach: Array.isArray(skillsToTeach) 
      ? skillsToTeach.map(s => s.toLowerCase().trim()) 
      : skillsToTeach.split(',').map(s => s.toLowerCase().trim()),
    skillsToLearn: Array.isArray(skillsToLearn) 
      ? skillsToLearn.map(s => s.toLowerCase().trim()) 
      : skillsToLearn.split(',').map(s => s.toLowerCase().trim())
  };

  students.push(newStudent);
  console.log(`✅ تم تسجيل طالب جديد بنجاح: ${newStudent.name} (إجمالي الطلبة: ${students.length})`);

  // إرجاع البيانات العامة فقط دون الإيميل أو التليفون (تطبيقاً لـ ASR-3)
  res.status(201).json({
    message: "تم التسجيل بنجاح!",
    student: {
      id: newStudent.id,
      name: newStudent.name,
      faculty: newStudent.faculty,
      skillsToTeach: newStudent.skillsToTeach,
      skillsToLearn: newStudent.skillsToLearn
    }
  });
});

/**
 * 2. عرض كل الطلاب المسجلين حالياً (فاضية في البداية)
 */
app.get('/api/students', (req, res) => {
  const publicProfiles = students.map(({ email, phone, ...publicData }) => publicData);
  res.json(publicProfiles);
});

/**
 * 3. حساب الماتشينج لأي طالب بناءً على المسجلين معاه
 */
app.get('/api/matches/:studentId', (req, res) => {
  const { studentId } = req.params;
  
  const currentStudent = students.find(s => s.id === studentId);
  if (!currentStudent) {
    return res.status(404).json({ error: "الطالب غير موجود!" });
  }

  // حساب التوافق مع باقي الطلاب المسجلين
  const matches = findMatches(currentStudent, students);

  res.json({
    student: {
      id: currentStudent.id,
      name: currentStudent.name,
      skillsToTeach: currentStudent.skillsToTeach,
      skillsToLearn: currentStudent.skillsToLearn
    },
    totalMatches: matches.length,
    matches: matches
  });
});

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`🚀 Skill Swap Server is running on port ${PORT}`);
  console.log(`Database is currently empty (0 students).`);
  console.log(`===============================================`);
});