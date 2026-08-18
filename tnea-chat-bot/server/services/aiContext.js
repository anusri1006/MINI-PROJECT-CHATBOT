/**
 * Formats deterministic JavaScript calculations into a clean textual context for the LLM.
 * @param {object} params
 * @param {number} params.cutoff
 * @param {string} params.community
 * @param {string} [params.branch]
 * @param {string|array} [params.collegeQuery]
 * @param {array} params.results
 * @returns {string} compiled context string
 */
export function buildAiContext({ cutoff, community, branch, collegeQuery, collegeType, location, results }) {
  let context = `TNEA DATA SOURCE\n`;
  context += `Source: TNEA Cutoff Marks - 2025\n`;
  context += `Authority: Tamilnadu Engineering Admissions, Directorate of Technical Education Chennai\n\n`;

  context += `STUDENT:\n`;
  context += `- Cutoff Score: ${cutoff}\n`;
  context += `- Community: ${community}\n`;
  if (branch) {
    context += `- Preferred Branch: ${branch}\n`;
  }
  if (collegeQuery) {
    const colStr = Array.isArray(collegeQuery) ? collegeQuery.join(', ') : collegeQuery;
    context += `- Searched College: ${colStr}\n`;
  }
  if (collegeType) {
    context += `- Preferred College Type: ${collegeType}\n`;
  }
  if (location) {
    context += `- Preferred Location: ${location}\n`;
  }
  context += `\n`;

  if (!results || results.length === 0) {
    context += `VERIFIED PREDICTION RESULTS:\n`;
    context += `No matching verified records were found in the dataset for these criteria.\n`;
    return context;
  }

  context += `VERIFIED PREDICTION RESULTS:\n\n`;
  
  results.forEach((res, idx) => {
    const diffPrefix = res.difference !== null ? (res.difference >= 0 ? '+' : '') : '';
    context += `${idx + 1}. College: ${res.collegeName}\n`;
    context += `   Branch: ${res.branch}\n`;
    context += `   Historical ${res.community} Cutoff: ${res.historicalCutoff !== null ? res.historicalCutoff : 'Data unavailable'}\n`;
    context += `   Difference: ${res.difference !== null ? diffPrefix + res.difference : 'N/A'}\n`;
    context += `   Prediction Category: ${res.prediction}\n`;
    context += `   College Type: ${res.collegeType || 'N/A'}${res.isAutonomous ? ' (Autonomous)' : ''}\n`;
    context += `   Location/District: ${res.district || 'N/A'}\n\n`;
  });

  context += `CRITICAL DIRECTIVE:\n`;
  context += `You must strictly adhere to the verified cutoff scores, difference values, and prediction categories listed above. Do not compute, modify, or invent these values yourself.`;

  return context;
}
