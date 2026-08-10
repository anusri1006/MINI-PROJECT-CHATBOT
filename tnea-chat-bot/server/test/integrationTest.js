import { parseQuery, extractConversationContext } from '../services/queryParser.js';
import { buildAiContext } from '../services/aiContext.js';
import { findMatchingColleges } from '../services/cutoffService.js';

let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    failedTests++;
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log("=== Starting TNEA Integration & Context Propagation Tests ===");

// 1. Test parseQuery on direct predictions
const p1 = parseQuery("My cutoff is 192.5 and I am BC. I want CSE.");
assert(p1.cutoff === 192.5, "Should extract decimal cutoff 192.5");
assert(p1.community === "BC", "Should extract community BC");
assert(p1.branch === "CSE", "Should extract branch CSE");
assert(p1.intent === "prediction", "Intent should be prediction");

// 2. Test parseQuery on college query
const p2 = parseQuery("Can I get GCT Coimbatore?");
assert(p2.collegeQuery === "GCT", "Should extract known college abbreviation GCT");
assert(p2.intent === "college_search", "Intent should be college_search");

// 3. Test parseQuery on comparison
const p3 = parseQuery("Compare GCT and CIT.");
assert(Array.isArray(p3.collegeQuery) && p3.collegeQuery[0] === "GCT" && p3.collegeQuery[1] === "CIT", "Should extract array of colleges for comparison");
assert(p3.intent === "comparison", "Intent should be comparison");

// 4. Test parseQuery on general questions
const p4 = parseQuery("What is choice filling?");
assert(p4.intent === "general_tnea", "Intent should be general_tnea for general questions");

// 5. Test parseQuery on branch search
const p5 = parseQuery("What branches can I get?");
assert(p5.intent === "branch_search", "Intent should be branch_search");

// 6. Test Context propagation (Backfilling from history)
const history1 = [
  { role: "user", content: "I'm BC and my cutoff is 192." },
  { role: "assistant", content: "Great score! What branches or colleges are you interested in?" },
  { role: "user", content: "I want CSE." }
];

const context1 = extractConversationContext(history1);
assert(context1.cutoff === 192, "Context should pull cutoff 192 from history");
assert(context1.community === "BC", "Context should pull community BC from history");
assert(context1.branch === "CSE", "Context should pull branch CSE from history");

// 7. Test Context change (Preserving old context but updating branch)
const history2 = [
  { role: "user", content: "I'm BC and my cutoff is 192." },
  { role: "assistant", content: "..." },
  { role: "user", content: "I want CSE." },
  { role: "assistant", content: "..." },
  { role: "user", content: "What about ECE?" }
];

const context2 = extractConversationContext(history2);
assert(context2.cutoff === 192, "Context should preserve cutoff 192");
assert(context2.community === "BC", "Context should preserve community BC");
assert(context2.branch === "ECE", "Context should update branch to ECE");

// 8. Test community priority matching (BCM vs BC, SCA vs SC)
const pCommBCM = parseQuery("My cutoff is 192 and I'm BCM.");
assert(pCommBCM.community === "BCM", "Should extract community BCM (not BC)");

const pCommSCA = parseQuery("My cutoff is 192 and I'm SCA category.");
assert(pCommSCA.community === "SCA", "Should extract community SCA (not SC)");

// 9. Test student cutoff context parsing limits
const pCodeMatch = parseQuery("Can I get college code 2005?");
assert(pCodeMatch.cutoff === null, "Should ignore college code 2005 as student cutoff");

const pYearMatch = parseQuery("What is TNEA 2025?");
assert(pYearMatch.cutoff === null, "Should ignore TNEA year 2025 as student cutoff");

const pGeneralCutoffQuery = parseQuery("I heard GCT BC cutoff was 180. Is that correct?");
assert(pGeneralCutoffQuery.cutoff === null, "Should ignore college cutoff query value 180 as student cutoff");

// 10. Test Context Corrections (Overrides)
const historyCorrection1 = [
  { role: "user", content: "I'm BC." },
  { role: "assistant", content: "..." },
  { role: "user", content: "Actually I'm MBC." }
];
const contextCorrection1 = extractConversationContext(historyCorrection1);
assert(contextCorrection1.community === "MBC", "Context correction should update community BC -> MBC");

const historyCorrection2 = [
  { role: "user", content: "My cutoff is 192." },
  { role: "assistant", content: "..." },
  { role: "user", content: "Actually my cutoff is 188." }
];
const contextCorrection2 = extractConversationContext(historyCorrection2);
assert(contextCorrection2.cutoff === 188, "Context correction should update cutoff score 192 -> 188");

// 11. Test aiContext builder structure
const sampleResults = findMatchingColleges({
  studentCutoff: 192,
  community: "BC",
  branch: "CSE",
  limit: 2
});

const aiContextStr = buildAiContext({
  cutoff: 192,
  community: "BC",
  branch: "CSE",
  results: sampleResults
});

assert(typeof aiContextStr === 'string', "buildAiContext should return a formatted prompt string");
assert(aiContextStr.includes("Source: TNEA Cutoff Marks - 2025"), "Prompt should contain source credits");
assert(aiContextStr.includes("STUDENT:"), "Prompt should contain student header");
assert(aiContextStr.includes("VERIFIED PREDICTION RESULTS:"), "Prompt should contain results header");

console.log("\n=== Integration Test Suite Summary ===");
if (failedTests > 0) {
  console.error(`❌ Completed with ${failedTests} failure(s).`);
  process.exit(1);
} else {
  console.log("🏆 All integration tests passed successfully!");
  process.exit(0);
}
