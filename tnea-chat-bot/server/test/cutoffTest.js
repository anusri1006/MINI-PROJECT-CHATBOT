import { 
  getRecordCount, 
  parseCutoff, 
  normalizeCommunity, 
  normalizeBranchQuery, 
  normalizeCollegeQuery, 
  calculatePrediction, 
  findMatchingColleges,
  groupPredictions,
  buildPredictionContext,
  uniqueDistricts
} from '../services/cutoffService.js';

let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failedTests++;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("=== Starting TNEA Cutoff Engine Tests ===");

// 1. Verify Dataset Count
const count = getRecordCount();
assert(count === 3457, `Record count should be exactly 3457 (found: ${count})`);

// 2. Test parseCutoff
assert(parseCutoff("195.5") === 195.5, "parseCutoff('195.5') should be 195.5");
assert(parseCutoff("193") === 193, "parseCutoff('193') should be 193");
assert(parseCutoff("105.0*") === 105, "parseCutoff('105.0*') should be 105");
assert(parseCutoff("—") === null, "parseCutoff('—') should be null");
assert(parseCutoff("") === null, "parseCutoff('') should be null");
assert(parseCutoff(null) === null, "parseCutoff(null) should be null");
assert(parseCutoff(undefined) === null, "parseCutoff(undefined) should be null");

// 3. Test normalizeCommunity
assert(normalizeCommunity("bc") === "BC", "normalizeCommunity('bc') should return 'BC'");
assert(normalizeCommunity("BC") === "BC", "normalizeCommunity('BC') should return 'BC'");
assert(normalizeCommunity(" Bc ") === "BC", "normalizeCommunity(' Bc ') should return 'BC'");

let thrown = false;
try {
  normalizeCommunity("XYZ");
} catch (e) {
  thrown = true;
  assert(e.message.includes("Unsupported community"), "normalizeCommunity('XYZ') should throw unsupported error");
}
assert(thrown, "normalizeCommunity('XYZ') should throw an exception");

// 4. Test normalizeBranchQuery
assert(normalizeBranchQuery("cse") === "COMPUTER SCIENCE AND ENGINEERING", "normalizeBranchQuery('cse') should expand to COMPUTER SCIENCE AND ENGINEERING");
assert(normalizeBranchQuery("ECE") === "ELECTRONICS AND COMMUNICATION ENGINEERING", "normalizeBranchQuery('ECE') should expand");
assert(normalizeBranchQuery("biotechnology") === "BIOTECHNOLOGY", "normalizeBranchQuery should capitalize non-abbreviation query");

// 5. Test calculatePrediction
assert(calculatePrediction(192, 189).prediction === "Strong Chance", "192 vs 189 should be Strong Chance");
assert(calculatePrediction(192, 190).prediction === "Possible", "192 vs 190 should be Possible");
assert(calculatePrediction(192, 195).prediction === "Possible", "192 vs 195 should be Possible");
assert(calculatePrediction(192, 197).prediction === "Reach", "192 vs 197 should be Reach");
assert(calculatePrediction(192, 200).prediction === "Reach", "192 vs 200 should be Reach");
assert(calculatePrediction(192, 201).prediction === "Unlikely", "192 vs 201 should be Unlikely");
assert(calculatePrediction(192, null).prediction === "Data unavailable", "Missing historical cutoff should return Data unavailable");

// 6. Test findMatchingColleges & limits
const results = findMatchingColleges({
  studentCutoff: 192,
  community: "BC",
  branch: "CSE",
  limit: 5
});
assert(results.length === 5, `findMatchingColleges should respect limit (found: ${results.length})`);
assert(results[0].community === "BC", "Result community should be normalized to BC");

// 7. Test sorting
// The results should be sorted: Strong Chance -> Possible -> Reach -> Unlikely
let isSorted = true;
const orderMap = { "Strong Chance": 1, "Possible": 2, "Reach": 3, "Unlikely": 4 };
for (let i = 1; i < results.length; i++) {
  const prevOrder = orderMap[results[i-1].prediction];
  const currOrder = orderMap[results[i].prediction];
  if (prevOrder > currOrder) {
    isSorted = false;
    break;
  }
}
assert(isSorted, "Predictions should be sorted: Strong Chance -> Possible -> Reach -> Unlikely");

// 8. Test College Search filter & abbreviation mapping
const gctResults = findMatchingColleges({
  studentCutoff: 192,
  community: "BC",
  collegeQuery: "GCT",
  limit: 10
});
assert(gctResults.length > 0, "GCT college search should find matching results");
const allGCT = gctResults.every(r => r.collegeName.toUpperCase().includes("GOVERNMENT COLLEGE OF TECHNOLOGY"));
assert(allGCT, "All GCT results should match Government College of Technology full name");

// 9. Test grouping
const grouped = groupPredictions(results);
assert(Array.isArray(grouped.strongChance), "groupPredictions should return grouped categories");

// 10. Test buildPredictionContext
const context = buildPredictionContext(results);
assert(typeof context === 'string' && context.includes("TNEA DATA SOURCE"), "buildPredictionContext should return a formatted string");

// 11. Test College Type, Location, and Joint Filtering
if (uniqueDistricts.length === 0) {
  console.log("\n⚠️  Skipping College Type & Location tests: cutoff.json on disk does not have new fields yet. Save the file in the editor to run these tests.");
} else {
  console.log("\n=== Running College Type and Location Filter Tests ===");

  // 11a. Test Government Filter
  const govtColleges = findMatchingColleges({
    studentCutoff: 190,
    community: "BC",
    collegeType: "government",
    limit: 10
  });
  assert(govtColleges.length > 0, "Should find government colleges");
  assert(govtColleges.every(c => c.collegeType === "government"), "All returned colleges should be government");

  // 11b. Test Autonomous Filter
  const autonomousColleges = findMatchingColleges({
    studentCutoff: 190,
    community: "BC",
    collegeType: "autonomous",
    limit: 10
  });
  assert(autonomousColleges.length > 0, "Should find autonomous colleges");
  assert(autonomousColleges.every(c => c.isAutonomous === true), "All returned colleges should be autonomous");

  // 11c. Test Location Filter (exact and abbreviation matching)
  const chennaiColleges = findMatchingColleges({
    studentCutoff: 190,
    community: "BC",
    location: "Chennai",
    limit: 10
  });
  assert(chennaiColleges.length > 0, "Should find colleges in Chennai");
  assert(chennaiColleges.every(c => c.district.toLowerCase() === "chennai"), "All returned colleges should be in Chennai");

  const trichyColleges = findMatchingColleges({
    studentCutoff: 180,
    community: "BC",
    location: "trichy",
    limit: 10
  });
  assert(trichyColleges.length > 0, "Should find colleges in Trichy using alias");
  assert(trichyColleges.every(c => c.district.toLowerCase().includes("tiruchirappalli")), "All returned colleges should be in Tiruchirappalli");

  // 11d. Test Joint Filtering
  const jointColleges = findMatchingColleges({
    studentCutoff: 195,
    community: "BC",
    branch: "CSE",
    collegeType: "government",
    location: "Chennai",
    limit: 5
  });
  assert(jointColleges.length > 0, "Should find government CSE colleges in Chennai");
  assert(jointColleges.every(c => c.collegeType === "government" && c.district.toLowerCase() === "chennai" && c.branch.includes("COMPUTER SCIENCE")), "All should match joint filters");
}

console.log("\n=== Test Suite Summary ===");
if (failedTests > 0) {
  console.error(`❌ Completed with ${failedTests} failure(s).`);
  process.exit(1);
} else {
  console.log("🏆 All tests passed successfully!");
  process.exit(0);
}
