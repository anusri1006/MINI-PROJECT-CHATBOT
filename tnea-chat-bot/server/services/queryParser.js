/**
 * Heuristic to check if a numeric value in a message refers to the student's own cutoff
 * @param {string} message 
 * @param {string} numStr 
 * @returns {boolean} true if it represents the student's cutoff
 */
function isStudentCutoffContext(message, numStr) {
  const lower = message.toLowerCase();
  
  // If it looks like a year (e.g. 2025, 2026) and there is no cutoff/score context, reject it.
  if (numStr === "2025" || numStr === "2026") return false;

  // Reject if it's a general/historical cutoff query (e.g., "what was the cutoff", "is that correct")
  const isHistoricalQuery = lower.includes("what was the") || 
                            lower.includes("is that correct") || 
                            lower.includes("heard") || 
                            lower.includes("was") ||
                            lower.includes("previous") ||
                            lower.includes("last year");

  // 1. Direct explicit phrases for student's score
  if (new RegExp(`my\\s+(?:tnea\\s+)?cutoff\\b.*\\b${numStr}`, 'i').test(lower)) return true;
  if (new RegExp(`cutoff\\s*(?:is|was|:)?\\s*\\b${numStr}\\b`, 'i').test(lower) && lower.includes("my")) return true;
  if (new RegExp(`scored?\\s+\\b${numStr}\\b`, 'i').test(lower)) return true;
  if (new RegExp(`got\\s+\\b${numStr}\\b`, 'i').test(lower)) return true;
  
  // 2. "cutoff 185", "score 185", "marks 185" - unless it's a historical query
  if (!isHistoricalQuery) {
    if (new RegExp(`cutoff\\s*(?:is|of|:)?\\s*\\b${numStr}\\b`, 'i').test(lower)) return true;
    if (new RegExp(`score\\s*(?:is|of|:)?\\s*\\b${numStr}\\b`, 'i').test(lower)) return true;
    if (new RegExp(`marks?\\s*(?:is|are|of|:)?\\s*\\b${numStr}\\b`, 'i').test(lower)) return true;
    if (new RegExp(`\\b${numStr}\\b\\s*(?:cutoff|score|marks?)\\b`, 'i').test(lower)) return true;
  }

  // 3. Combined with community (can be separated by words)
  if (new RegExp(`\\b${numStr}\\b.*\\b(bcm|mbc|sca|oc|bc|sc|st)\\b`, 'i').test(lower)) {
    if (!isHistoricalQuery) return true;
  }
  if (new RegExp(`\\b(bcm|mbc|sca|oc|bc|sc|st)\\b.*\\b${numStr}\\b`, 'i').test(lower)) {
    if (!isHistoricalQuery) return true;
  }

  // 4. Short standalone messages (e.g. "192", "192.5 BC")
  const words = lower.split(/\s+/);
  if (words.length <= 4 && words.some(w => w.includes(numStr))) {
    return true;
  }

  return false;
}

/**
 * Parses user input to extract cutoff score, community, branch, and college names
 * @param {string} message 
 * @returns {object} parsed parameters and classified intent
 */
export function parseQuery(message, historyContext = { cutoff: null, community: null, branch: null, collegeQuery: null }) {
  const result = {
    cutoff: null,
    community: null,
    branch: null,
    collegeQuery: null,
    intent: "follow_up"
  };

  if (!message) return result;

  const cleanMsg = message.trim();
  const lowerMsg = cleanMsg.toLowerCase();

  // 1. Extract Cutoff score (Float in range 70-200. Ignore 4-digit integers which are college codes)
  const numbers = cleanMsg.match(/\b\d+(?:\.\d+)?\b/g) || [];
  for (const numStr of numbers) {
    const val = parseFloat(numStr);
    if (val >= 70 && val <= 200 && !(val >= 1000 && val <= 9999 && Number.isInteger(val))) {
      // Validate that the number is actually in the student's cutoff context
      if (isStudentCutoffContext(cleanMsg, numStr)) {
        result.cutoff = val;
        break;
      }
    }
  }

  // 2. Extract Community (Prioritize longer terms: bcm, mbc, sca)
  const commMatch = cleanMsg.match(/\b(bcm|mbc|sca|oc|bc|sc|st)\b/i);
  if (commMatch) {
    result.community = commMatch[1].toUpperCase();
  }

  // 3. Extract Branch
  const branchMatch = cleanMsg.match(/\b(cse|ece|eee|it|mech|civil|aids|aiml)\b/i);
  if (branchMatch) {
    result.branch = branchMatch[1].toUpperCase();
  } else {
    // Substring checking for full names
    if (lowerMsg.includes("computer science") || lowerMsg.includes("computer engineering")) {
      result.branch = "CSE";
    } else if (lowerMsg.includes("information technology")) {
      result.branch = "IT";
    } else if (lowerMsg.includes("electronics and communication") || lowerMsg.includes("electronics engineering")) {
      result.branch = "ECE";
    } else if (lowerMsg.includes("electrical and electronics")) {
      result.branch = "EEE";
    } else if (lowerMsg.includes("mechanical")) {
      result.branch = "MECH";
    } else if (lowerMsg.includes("civil engineering")) {
      result.branch = "CIVIL";
    } else if (lowerMsg.includes("artificial intelligence")) {
      if (lowerMsg.includes("machine learning")) {
        result.branch = "AIML";
      } else {
        result.branch = "AIDS";
      }
    }
  }

  // 4. Extract College Query (Abbreviation lists or search matches)
  const compareMatch = cleanMsg.match(/compare\s+(.+?)\s+and\s+(.+)/i) || cleanMsg.match(/(.+?)\s+vs\s+(.+)/i);
  if (compareMatch) {
    const col1 = compareMatch[1].trim().replace(/[.,?!]$/g, '').trim();
    const col2 = compareMatch[2].trim().replace(/[.,?!]$/g, '').trim();
    result.collegeQuery = [col1, col2];
  } else {
    const knownColleges = ["gct", "cit", "psg", "mit", "ceg", "ssn", "anna university", "thiagarajar"];
    for (const col of knownColleges) {
      if (lowerMsg.includes(col)) {
        result.collegeQuery = col.toUpperCase();
        break;
      }
    }

    if (!result.collegeQuery) {
      const getMatch = cleanMsg.match(/get\s+(?:in|at|into)\s+([A-Za-z\s]+)/i) || cleanMsg.match(/about\s+([A-Za-z\s]+)/i);
      if (getMatch) {
        const candidate = getMatch[1].trim().replace(/[.,?!]$/g, '').trim();
        // Filters out branches or generic TNEA keywords from being treated as college names
        if (candidate.length > 2 && !["cse", "ece", "eee", "it", "mech", "civil", "aids", "aiml", "cutoff", "counselling", "prediction"].includes(candidate.toLowerCase())) {
          result.collegeQuery = candidate;
        }
      }
    }
  }

  // 5. Classify Intent
  const isGreeting = /^(hello|hi|hey|good\s+(morning|afternoon|evening)|how\s+are\s+you|how's\s+it\s+going|how\s+are\s+you\s+doing|yo|sup)\b/i.test(lowerMsg);
  const isCasual = /^(tell\s+me\s+a\s+joke|give\s+me\s+a\s+joke|i'm\s+bored|i\s+am\s+bored|talk\s+to\s+me|tell\s+me\s+a\s+story|what\s+is\s+the\s+weather|how\s+is\s+the\s+weather)\b/i.test(lowerMsg);
  
  // General programming, CS, non-TNEA tech keywords
  const hasTechKeywords = /\b(python|javascript|react|angular|html|css|c\+\+|java|sql|nosql|recursion|recursive|algorithm|programming|code|coder|developer|full-stack|full\s+stack|frontend|backend|software|elon\s+musk|bill\s+gates|steve\s+jobs|chatgpt|openai|google|microsoft)\b/i.test(lowerMsg);

  // Common general question patterns (e.g., "what is ...", "who is ...", "explain ...")
  const isGeneralQuestionPattern = /^(what\s+is|who\s+is|explain|how\s+does|difference\s+between|how\s+to|give\s+me\s+a|write\s+a|create\s+a|can\s+you)\b/i.test(lowerMsg);

  // Explicit TNEA keywords
  const hasTneaKeywords = /\b(tnea|counc?elling|choice\s*filling|choice-?filling|allotment|cutoff|cut-off|cut\s+off|cote|dte|dote)\b/i.test(lowerMsg);
  
  // TNEA College names / abbreviations
  const hasTneaColleges = /\b(gct|cit|psg|mit|ceg|ssn|thiagarajar|anna\s+university)\b/i.test(lowerMsg);

  // Check if we have TNEA context in history
  const hasHistoryTneaContext = (historyContext && (historyContext.cutoff !== null || historyContext.community !== null));

  // Determine intent
  if (isGreeting || isCasual) {
    result.intent = "general";
  } else if ((hasTechKeywords || isGeneralQuestionPattern) && !hasTneaKeywords && !hasTneaColleges && result.cutoff === null && !result.community && !/\b(branch|branches)\b/i.test(lowerMsg)) {
    if (result.branch && hasHistoryTneaContext) {
      result.intent = "follow_up";
    } else {
      result.intent = "general";
    }
  } else if (!hasTneaKeywords && !hasTneaColleges && result.cutoff === null && !result.community && !result.branch && !hasHistoryTneaContext && !/\b(branch|branches)\b/i.test(lowerMsg)) {
    result.intent = "general";
  } else {
    // TNEA or follow_up intent
    if (lowerMsg.includes("compare") || lowerMsg.includes(" vs ")) {
      result.intent = "tnea_comparison";
    } else if (
      lowerMsg.includes("what is tnea") || 
      lowerMsg.includes("how does counselling") || 
      lowerMsg.includes("choice filling") || 
      lowerMsg.includes("community reservation")
    ) {
      result.intent = "tnea_general";
    } else if (
      lowerMsg.includes("what branch") || 
      lowerMsg.includes("which branch") || 
      lowerMsg.includes("what branches") ||
      lowerMsg.includes("branch search") ||
      lowerMsg.includes("branches can i") ||
      lowerMsg.includes("available branches")
    ) {
      result.intent = "tnea_branch_search";
    } else if (result.collegeQuery && result.cutoff === null) {
      result.intent = "tnea_college_search";
    } else if (result.cutoff !== null || result.community !== null) {
      result.intent = "tnea_prediction";
    } else {
      result.intent = "follow_up";
    }
  }

  return result;
}

/**
 * Loops through conversation history to backfill missing parameters from previous user statements
 * @param {array} conversation 
 * @returns {object} accumulated context parameters
 */
export function extractConversationContext(conversation) {
  const context = {
    cutoff: null,
    community: null,
    branch: null,
    collegeQuery: null
  };

  if (!conversation || !Array.isArray(conversation)) {
    return context;
  }

  // Loop backwards from latest to oldest
  for (let i = conversation.length - 1; i >= 0; i--) {
    const msg = conversation[i];
    // We only parse the user's previous inputs for context backfilling
    if (msg.role === 'user') {
      const parsed = parseQuery(msg.content);
      if (context.cutoff === null && parsed.cutoff !== null) {
        context.cutoff = parsed.cutoff;
      }
      if (context.community === null && parsed.community !== null) {
        context.community = parsed.community;
      }
      if (context.branch === null && parsed.branch !== null) {
        context.branch = parsed.branch;
      }
      if (context.collegeQuery === null && parsed.collegeQuery !== null) {
        context.collegeQuery = parsed.collegeQuery;
      }
    }
  }

  return context;
}
