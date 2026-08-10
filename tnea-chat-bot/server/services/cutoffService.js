import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cutoffPath = path.join(__dirname, '../data/cutoff.json');

// Load cutoff dataset once on startup
let dataset = { source: "TNEA Cutoff Marks - 2025", data: [], record_count: 0 };
try {
  dataset = JSON.parse(fs.readFileSync(cutoffPath, 'utf8'));
} catch (error) {
  console.error("Fatal error: Failed to read cutoff.json:", error);
}

const cutoffRecords = dataset.data || [];
const recordCount = dataset.record_count || 0;
const sourceName = dataset.source || "TNEA Cutoff Marks - 2025";

// Supported community lists
const SUPPORTED_COMMUNITIES = new Set(['OC', 'BC', 'BCM', 'MBC', 'SC', 'SCA', 'ST']);

// Abbreviation mapping for branches
const BRANCH_ABBREVIATIONS = {
  'CSE': 'COMPUTER SCIENCE AND ENGINEERING',
  'ECE': 'ELECTRONICS AND COMMUNICATION ENGINEERING',
  'EEE': 'ELECTRICAL AND ELECTRONICS ENGINEERING',
  'IT': 'INFORMATION TECHNOLOGY',
  'MECH': 'MECHANICAL ENGINEERING',
  'CIVIL': 'CIVIL ENGINEERING',
  'AIDS': 'ARTIFICIAL INTELLIGENCE AND DATA SCIENCE',
  'AIML': 'ARTIFICIAL INTELLIGENCE AND MACHINE LEARNING'
};

// Abbreviation mapping for colleges
const COLLEGE_ABBREVIATIONS = {
  'GCT': 'GOVERNMENT COLLEGE OF TECHNOLOGY',
  'CIT': 'COIMBATORE INSTITUTE OF TECHNOLOGY',
  'PSG': 'PSG COLLEGE OF TECHNOLOGY',
  'MIT': 'MIT CAMPUS',
  'CEG': 'CEG CAMPUS'
};

/**
 * Safely parses TNEA cutoff strings
 * @param {string|null|undefined} value 
 * @returns {number|null}
 */
export function parseCutoff(value) {
  if (value === null || value === undefined) return null;
  
  const cleanVal = String(value).trim().replace(/\*$/, '');
  if (cleanVal === '—' || cleanVal === '' || cleanVal.toLowerCase() === 'null') {
    return null;
  }
  
  const parsed = parseFloat(cleanVal);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Validates and normalizes community code input
 * @param {string} community 
 * @returns {string} normalized community code
 */
export function normalizeCommunity(community) {
  if (!community) {
    throw new Error("Community is required");
  }
  const norm = String(community).trim().toUpperCase();
  if (!SUPPORTED_COMMUNITIES.has(norm)) {
    throw new Error(`Unsupported community: "${community}". Supported: ${[...SUPPORTED_COMMUNITIES].join(', ')}`);
  }
  return norm;
}

/**
 * Normalizes branch queries, expanding common abbreviations
 * @param {string} branchQuery 
 * @returns {string} normalized branch query
 */
export function normalizeBranchQuery(branchQuery) {
  if (!branchQuery) return '';
  const upper = String(branchQuery).trim().replace(/\s+/g, ' ').toUpperCase();
  return BRANCH_ABBREVIATIONS[upper] || upper;
}

/**
 * Normalizes college queries, expanding abbreviations
 * @param {string} collegeQuery 
 * @returns {string} normalized college query
 */
export function normalizeCollegeQuery(collegeQuery) {
  if (!collegeQuery) return '';
  const upper = String(collegeQuery).trim().replace(/\s+/g, ' ').toUpperCase();
  return COLLEGE_ABBREVIATIONS[upper] || upper;
}

/**
 * Calculates prediction category and difference
 * @param {number} studentCutoff 
 * @param {number|null} historicalCutoff 
 * @returns {object} prediction metadata
 */
export function calculatePrediction(studentCutoff, historicalCutoff) {
  if (historicalCutoff === null || historicalCutoff === undefined) {
    return {
      prediction: "Data unavailable",
      difference: null
    };
  }

  const diff = parseFloat((studentCutoff - historicalCutoff).toFixed(2));

  let prediction = "Unlikely";
  if (diff >= 3) {
    prediction = "Strong Chance";
  } else if (diff >= -3 && diff < 3) {
    prediction = "Possible";
  } else if (diff >= -8 && diff < -3) {
    prediction = "Reach";
  }

  return {
    prediction,
    difference: diff
  };
}

/**
 * Performs search and comparisons inside the stored cutoff dataset
 */
export function findMatchingColleges({
  studentCutoff,
  community,
  branch,
  collegeQuery,
  limit = 10
}) {
  // Validate cutoff
  const parsedStudentCutoff = parseFloat(studentCutoff);
  if (isNaN(parsedStudentCutoff) || parsedStudentCutoff < 0 || parsedStudentCutoff > 200) {
    throw new Error(`Invalid student cutoff: "${studentCutoff}". Must be a number between 0 and 200.`);
  }

  // Validate and normalize community
  const normCommunity = normalizeCommunity(community);

  // Normalize branch and college query
  const normBranch = normalizeBranchQuery(branch);
  const normCollege = normalizeCollegeQuery(collegeQuery);

  const matchedResults = [];

  for (let i = 0; i < cutoffRecords.length; i++) {
    const record = cutoffRecords[i];

    // Branch match (substring check)
    if (normBranch && !record.branch.toUpperCase().includes(normBranch)) {
      continue;
    }

    // College match (substring check)
    if (normCollege && !record.college_name.toUpperCase().includes(normCollege)) {
      continue;
    }

    // Get community cutoff value
    const rawVal = record[normCommunity];
    const historicalCutoff = parseCutoff(rawVal);

    // Ignore records where relevant cutoff is missing/null
    if (historicalCutoff === null) {
      continue;
    }

    const { prediction, difference } = calculatePrediction(parsedStudentCutoff, historicalCutoff);

    matchedResults.push({
      collegeName: record.college_name,
      branch: record.branch,
      community: normCommunity,
      studentCutoff: parsedStudentCutoff,
      historicalCutoff,
      difference,
      prediction,
      source: sourceName
    });
  }

  // Prediction sorting priority weights
  const predictionWeights = {
    "Strong Chance": 1,
    "Possible": 2,
    "Reach": 3,
    "Unlikely": 4
  };

  // Sort matching results
  matchedResults.sort((a, b) => {
    const weightA = predictionWeights[a.prediction] || 99;
    const weightB = predictionWeights[b.prediction] || 99;

    if (weightA !== weightB) {
      return weightA - weightB; // Prioritize Strong Chance -> Possible -> Reach -> Unlikely
    }

    // Within same prediction group, sort by closeness to student's score
    return Math.abs(a.difference) - Math.abs(b.difference);
  });

  // Apply limit
  const maxResults = parseInt(limit, 10);
  return matchedResults.slice(0, isNaN(maxResults) ? 10 : maxResults);
}

/**
 * Groups raw search results into prediction category buckets
 * @param {array} results 
 * @returns {object} grouped categories object
 */
export function groupPredictions(results) {
  const grouped = {
    strongChance: [],
    possible: [],
    reach: [],
    unlikely: []
  };

  results.forEach(res => {
    if (res.prediction === "Strong Chance") {
      grouped.strongChance.push(res);
    } else if (res.prediction === "Possible") {
      grouped.possible.push(res);
    } else if (res.prediction === "Reach") {
      grouped.reach.push(res);
    } else if (res.prediction === "Unlikely") {
      grouped.unlikely.push(res);
    }
  });

  return grouped;
}

/**
 * Builds textual representation of predictions for prompt engineering context
 * @param {array} results 
 * @returns {string} context prompt snippet
 */
export function buildPredictionContext(results) {
  if (!results || results.length === 0) {
    return "No matching verified college predictions found for this score.";
  }

  const student = results[0];
  let context = `TNEA DATA SOURCE:\n${sourceName}\n\n`;
  context += `Student cutoff: ${student.studentCutoff}\n`;
  context += `Community: ${student.community}\n\n`;
  context += `VERIFIED RESULTS:\n\n`;

  results.forEach((res, index) => {
    context += `${index + 1}. College: ${res.collegeName}\n`;
    context += `   Branch: ${res.branch}\n`;
    context += `   Historical Cutoff: ${res.historicalCutoff !== null ? res.historicalCutoff : 'Data unavailable'}\n`;
    context += `   Difference: ${res.difference !== null ? (res.difference >= 0 ? '+' : '') + res.difference : 'N/A'}\n`;
    context += `   Prediction Category: ${res.prediction}\n\n`;
  });

  return context.trim();
}

// Expose total records count for verification
export function getRecordCount() {
  return recordCount;
}
