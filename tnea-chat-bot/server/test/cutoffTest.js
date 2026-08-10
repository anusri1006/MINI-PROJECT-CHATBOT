import { 
  getRecordCount, 
  parseCutoff, 
  normalizeCommunity, 
  normalizeBranchQuery, 
  normalizeCollegeQuery, 
  calculatePrediction, 
  findMatchingColleges,
  groupPredictions,
  buildPredictionContext 
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

console.log("\n=== Test Suite Summary ===");
if (failedTests > 0) {
  console.error(`❌ Completed with ${failedTests} failure(s).`);
  process.exit(1);
} else {
  console.log("🏆 All tests passed successfully!");
  process.exit(0);
}
