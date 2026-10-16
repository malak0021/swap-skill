// Mock Database (In-Memory Repository)
const students = [
  {
    id: "usr_1",
    name: "Sara Mohamed",
    faculty: "Engineering",
    email: "sara@eng.cu.edu.eg",      // بيانات حساسة (تخضع لـ ASR-3)
    phone: "01012345678",              // بيانات حساسة (تخضع لـ ASR-3)
    skillsToTeach: ["photoshop", "ui design"],
    skillsToLearn: ["english", "excel"]
  },
  {
    id: "usr_2",
    name: "Ahmed Ali",
    faculty: "Business",
    email: "ahmed@foc.cu.edu.eg",
    phone: "01198765432",
    skillsToTeach: ["english", "presentation"],
    skillsToLearn: ["photoshop"]
  },
  {
    id: "usr_3",
    name: "Omar Khaled",
    faculty: "Science",
    email: "omar@sci.cu.edu.eg",
    phone: "01234567890",
    skillsToTeach: ["excel"],
    skillsToLearn: ["python"]
  },
  {
    id: "usr_4",
    name: "Mariam Youssef",
    faculty: "Engineering",
    email: "mariam@eng.cu.edu.eg",
    phone: "01511223344",
    skillsToTeach: ["excel", "data analysis"],
    skillsToLearn: ["ui design"]
  }
];

module.exports = students;