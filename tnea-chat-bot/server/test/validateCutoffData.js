import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseCutoff } from '../services/cutoffService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cutoffPath = path.join(__dirname, '../data/cutoff.json');

console.log("=== TNEA Dataset Validation Script ===");

try {
  const rawData = JSON.parse(fs.readFileSync(cutoffPath, 'utf8'));
  const records = rawData.data || [];
  const expectedCount = rawData.record_count || 3457;
  const actualCount = records.length;

  let validCount = 0;
  const missingCounts = {
    OC: 0,
    BC: 0,
    BCM: 0,
    MBC: 0,
    SC: 0,
    SCA: 0,
    ST: 0
  };

  let hasCrashed = false;
  let missingBasicInfo = 0;

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    try {
      if (rec.college_name === undefined || rec.college_name === null || rec.branch === undefined || rec.branch === null) {
        missingBasicInfo++;
        console.log(`[Diagnostic] Record ${i} is missing basic info:`, JSON.stringify(rec));
        continue;
      }

      // Check community parsing
      Object.keys(missingCounts).forEach(comm => {
        const parsed = parseCutoff(rec[comm]);
        if (parsed === null) {
          missingCounts[comm]++;
        }
      });

      validCount++;
    } catch (err) {
      console.error(`Crash on record ${i}:`, err);
      hasCrashed = true;
    }
  }

  const isPass = (actualCount === expectedCount) && (missingBasicInfo === 0) && !hasCrashed;

  console.log("\nTNEA Dataset Validation");
  console.log("-----------------------");
  console.log(`Expected records: ${expectedCount}`);
  console.log(`Actual records:   ${actualCount}`);
  console.log();
  console.log(`Valid records: ${validCount}`);
  Object.keys(missingCounts).forEach(comm => {
    console.log(`Records with missing ${comm}: ${missingCounts[comm]}`);
  });
  console.log();
  console.log(`Status: ${isPass ? "PASS" : "FAIL"}`);

  if (!isPass) {
    process.exit(1);
  } else {
    process.exit(0);
  }

} catch (error) {
  console.error("Fatal error loading cutoff.json:", error);
  process.exit(1);
}
