/**
 * Matching Engine (Pure Domain Logic - Independent of DB or Framework)
 * Implements ASR-1 (Modifiability) and ASR-2 (Testability)
 */

function normalize(str) {
  return (str || '').toLowerCase().trim();
}

function calculateMatch(studentA, studentB) {
  const bLearn = (studentB.skillsToLearn || []).map(normalize);
  const aLearn = (studentA.skillsToLearn || []).map(normalize);

  // What studentA can teach studentB
  const aTeachesB = (studentA.skillsToTeach || []).filter(skill =>
    bLearn.includes(normalize(skill))
  );

  // What studentB can teach studentA
  const bTeachesA = (studentB.skillsToTeach || []).filter(skill =>
    aLearn.includes(normalize(skill))
  );

  const isFullMatch = aTeachesB.length > 0 && bTeachesA.length > 0;
  const isPartialMatch = !isFullMatch && (aTeachesB.length > 0 || bTeachesA.length > 0);

  if (!isFullMatch && !isPartialMatch) {
    return null;
  }

  // Score calculation (Full Match prioritized over Partial)
  const score = (isFullMatch ? 100 : 10) + (aTeachesB.length + bTeachesA.length);

  return {
    partnerId: studentB.id,
    partnerName: studentB.name,
    partnerFaculty: studentB.faculty,
    matchType: isFullMatch ? 'FULL_MATCH' : 'PARTIAL_MATCH',
    whatYouTeachThem: aTeachesB,
    whatTheyTeachYou: bTeachesA,
    score: score
  };
}

/**
 * Finds and ranks matching peer partners for a given student
 */
function findMatches(currentStudent, allStudents) {
  if (!currentStudent || !Array.isArray(allStudents)) return [];
  const matches = [];

  for (const candidate of allStudents) {
    if (candidate.id === currentStudent.id) continue;

    const matchResult = calculateMatch(currentStudent, candidate);
    if (matchResult) {
      matches.push(matchResult);
    }
  }

  // Sort: Full match first, then by score descending
  return matches.sort((a, b) => b.score - a.score);
}

module.exports = { calculateMatch, findMatches };