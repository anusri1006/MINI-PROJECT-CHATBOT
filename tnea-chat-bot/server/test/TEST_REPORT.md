# TNEA COUNSELLING AI ACCURACY TEST REPORT

## Dataset
- **Name**: TNEA Cutoff Marks - 2025
- **Authority**: Tamilnadu Engineering Admissions, Directorate of Technical Education Chennai
- **Total Records**: 3,457

---

## --------------------------------
## DATA VALIDATION
## --------------------------------
**Status**: PASS

- **Expected records**: 3,457
- **Actual records**: 3,457
- Every record verified to contain the keys `college_name` and `branch`.
- Handled empty college names (`""` in some records) without crashing.
- Community fields exist and are validated.
- `—` parsed to `null` properly (counts listed in dataset validation summary).

---

## --------------------------------
## PREDICTION CALCULATION
## --------------------------------
**Status**: PASS

- Threshold assertions passed:
  - Difference >= 3: Strong Chance (🟢)
  - Difference >= -3 && difference < 3: Possible (🟡)
  - Difference >= -8 && difference < -3: Reach (🟠)
  - Difference < -8: Unlikely (🔴)
  - Historical Cutoff is `null`: Data unavailable.

---

## --------------------------------
## COMMUNITY EXTRACTION
## --------------------------------
**Status**: PASS

- Correctly parses case-insensitive communities (`bc`, `Bc`, `BC`).
- Uses prioritized matching logic ensuring that longer labels are resolved correctly:
  - `BCM` category is NOT parsed as `BC`.
  - `SCA` category is NOT parsed as `SC`.
  - Rejects invalid communities (e.g. `XYZ`) with HTTP 400.

---

## --------------------------------
## CUTOFF EXTRACTION
## --------------------------------
**Status**: PASS

- Successfully extracts floats and integers in student score contexts.
- Correctly ignores year numbers (e.g., `2025`, `2026`) and college codes (e.g., `2005`, `3016`).
- Ignores college cutoff query values (e.g. `180` in *"I heard GCT BC cutoff was 180"*).

---

## --------------------------------
## BRANCH EXTRACTION
## --------------------------------
**Status**: PASS

- Handles expansion of abbreviations (`CSE`, `ECE`, `EEE`, `IT`, `MECH`, `CIVIL`, `AIDS`, `AIML`).
- Performs safe substring checking on branches (e.g., matches `"COMPUTER SCIENCE AND ENGINEERING"` and `"COMPUTER SCIENCE AND ENGINEERING (SS)"`).
- Does not use aggressive fuzzy matching.

---

## --------------------------------
## CONVERSATION CONTEXT
## --------------------------------
**Status**: PASS

- Context propagation behaves as expected across conversation logs.
- Overrides (corrections) work immediately:
  - Changing cutoff score (e.g. *"Actually my cutoff is 188"* overrides previous `192`).
  - Changing community (e.g. *"Actually I'm MBC"* overrides previous `BC`).
  - Merged values from the current message take immediate priority.

---

## --------------------------------
## COLLEGE SEARCH
## --------------------------------
**Status**: PASS

- Case-insensitive substring matching.
- Mapped common abbreviations (`GCT`, `CIT`, `PSG`, `MIT`, `CEG`).
- Resolves multiple matching branches under the same college.

---

## --------------------------------
## COMPARISON
## --------------------------------
**Status**: PASS

- Extracts multiple colleges (e.g. `compare GCT and CIT`).
- Resolves calculations and prediction categories for all target items deterministically.
- AI presents results in a markdown comparison table.

---

## --------------------------------
## HALLUCINATION RESISTANCE
## --------------------------------
**Status**: PASS

- Prompt injection shield blocks instructions attempting to override grounding rules (e.g., asking for fake cutoffs).
- Missing data handled safely:
  - If a college is not found: AI says *"The available TNEA 2025 dataset does not contain that college."*
  - If a cutoff is missing (`null`): AI says *"The available TNEA 2025 data does not contain a cutoff for this community and branch, so I can't make a reliable prediction for it."*
- AI strictly uses supplied backend-calculated numbers and is prohibited from inventing cutoffs.

---

## --------------------------------
## ERROR HANDLING
## --------------------------------
**Status**: PASS

- Express validations return HTTP 400 for negative, excessive, or non-numeric cutoffs, and invalid communities.
- Catch blocks capture NVIDIA AI API errors (e.g., invalid/unconfigured keys, rate limits, timeouts) and log technical details server-side, returning only a friendly generic reply to the client.

---

## --------------------------------
## OVERALL
## --------------------------------
**Status**: PASS

- All unit and integration test assertions passed successfully.
- Dataset verified.
- Grounding and context boundaries are strictly enforced.
