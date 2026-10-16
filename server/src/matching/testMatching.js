const { findMatches } = require('./matchingEngine');

// 1. بيانات تجريبية (Seed Data: Sara, Ahmed, Omar)
const mockStudents = [
  {
    id: "usr_1",
    name: "Sara Mohamed",
    faculty: "Engineering",
    skillsToTeach: ["photoshop", "ui design"],
    skillsToLearn: ["english", "excel"]
  },
  {
    id: "usr_2",
    name: "Ahmed Ali",
    faculty: "Business",
    skillsToTeach: ["english", "presentation"],
    skillsToLearn: ["photoshop"]
  },
  {
    id: "usr_3",
    name: "Omar Khaled",
    faculty: "Science",
    skillsToTeach: ["excel"],
    skillsToLearn: ["python"] // مش هيعمل تبادل كامل مع سارة
  }
];

console.log("=================================================");
console.log("🔍 TESTING MATCHING MODULE (ASR-1 & ASR-2 & T1)");
console.log("=================================================\n");

const currentStudent = mockStudents[0]; // سارة
console.log(`Finding matches for: ${currentStudent.name}`);
console.log(`Teaches: [${currentStudent.skillsToTeach}]`);
console.log(`Wants to learn: [${currentStudent.skillsToLearn}]\n`);

const results = findMatches(currentStudent, mockStudents);

console.log(`🎯 Found (${results.length}) Matches:`);
console.log(JSON.stringify(results, null, 2));

console.log("\n=================================================");
if (results[0].partnerName === "Ahmed Ali" && results[0].matchType === "FULL_MATCH") {
  console.log("✅ TEST PASSED: Full Match detected correctly with Ahmed!");
} else {
  console.log("❌ TEST FAILED");
}
console.log("=================================================");