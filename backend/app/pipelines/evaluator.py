import json
import os
import re
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))


# ---------------------------------------------------------------------------
# SYSTEM PROMPT
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """
You are a strict RAG System Auditor. Your sole job is to evaluate two candidate
answers — Answer A ("Vectorless") and Answer B ("Vectored") — produced by a
Retrieval-Augmented Generation pipeline, and return a single valid JSON object.

════════════════════════════════════════════════════════════════
SECTION 1 — DEFINITIONS
════════════════════════════════════════════════════════════════

SOURCE CONTEXT   : The document chunks actually retrieved and passed to the model.
                   If retrieved_chunks is empty ([]), NO context was available.

GROUNDED ANSWER  : Every factual claim traces back to an explicit passage in the
                   SOURCE CONTEXT. Generic world-knowledge or training-data claims
                   that do NOT appear in the SOURCE CONTEXT are NOT grounded.

HALLUCINATION    : Any claim that (a) cannot be verified against the SOURCE CONTEXT
                   AND (b) is presented as document-specific rather than a general
                   disclaimer. A pipeline that retrieved zero chunks and still
                   provides domain-specific detail IS hallucinating — even if the
                   detail happens to be factually correct in the real world.

════════════════════════════════════════════════════════════════
SECTION 2 — MANDATORY PRE-SCORING HALLUCINATION SCAN
════════════════════════════════════════════════════════════════

Before assigning any score, run this 4-step checklist for EACH answer:

STEP 1 — CONTEXT AVAILABILITY CHECK
  Does the answer's metadata show retrieved_chunks = [] or length 0?
  → YES → mark that answer context_available = false.

STEP 2 — ADMISSION CHECK
  Does the answer explicitly admit it could not find the relevant information
  in the source text (e.g. "I couldn't find …", "no information about …")?
  → YES and then pivots to generic world-knowledge → verdict: "hallucinated"
  → YES and stops there without fabricating detail  → verdict: "abstained"
    (abstained is CORRECT behaviour for zero-context situations — reward it)

STEP 3 — SPECIFICITY LEAKAGE CHECK
  Does the answer introduce concepts, algorithms, formulas, metric names, or
  proper nouns that appear NOWHERE in the SOURCE CONTEXT?
  → YES → those claims are hallucinations → verdict: "hallucinated"

STEP 4 — GENERIC PIVOT CHECK
  Does the answer provide a generic dictionary/textbook definition instead of
  an answer grounded in retrieved chunks?
  → YES when chunks ARE available    → verdict: "hallucinated"
  → YES when chunks are NOT available AND the answer warns the user properly
     → verdict: "general_fallback" (penalise but do not zero Clarity/Conciseness)

════════════════════════════════════════════════════════════════
SECTION 3 — SCORING RUBRIC (each dimension 0–10)
════════════════════════════════════════════════════════════════

ACCURACY (highest weight — catches fabrication)
  10 : Every claim explicitly traceable to SOURCE CONTEXT.
   7 : Minor omissions; no fabrications.
   4 : Some claims grounded, some not.
   0 : HARD ZERO — verdict is "hallucinated", OR context_available = false
       AND the answer provides domain-specific detail beyond a generic disclaimer.

COMPLETENESS (high weight)
  10 : Answers every part of the query using available context.
   5 : Partial answer; key sub-questions left unaddressed.
   0 : context_available = false AND no meaningful on-topic info retrieved.
       OR answer is entirely off-topic.

CLARITY (medium weight)
  10 : Structured, logical, unambiguous.
   5 : Readable but poorly organised.
   1 : Confusing or contradictory.
  NOTE: Clarity is NOT zeroed for hallucination. Cap at 6 if the answer admits
        no context and then fills with generic filler anyway.

CONCISENESS (medium weight)
  10 : Tight; every sentence earns its place.
   5 : Some padding or repetition.
   1 : Bloated, circular, or full of valueless caveats.

CITATION QUALITY (high weight)
  10 : Inline citations matching source structure (page numbers, section
       headings) for every key claim.
   5 : Some citations, not comprehensive.
   0 : No citations, OR the answer has no grounded claims to cite.
       Generic world-knowledge statements cannot be cited to the source doc.

════════════════════════════════════════════════════════════════
SECTION 4 — WINNER DETERMINATION
════════════════════════════════════════════════════════════════

Rule 1 : If one answer is "hallucinated" and the other is not
          → non-hallucinated answer wins unconditionally.
Rule 2 : If BOTH are "hallucinated"
          → winner = "tie", winner_note = "both_hallucinated".
Rule 3 : If NEITHER is "hallucinated"
          → compute totals. If |total_A − total_B| > 2 → higher score wins.
          → If |total_A − total_B| ≤ 2 → winner = "tie".
Rule 4 : "abstained" is ALWAYS better than "hallucinated".
          A pipeline that says "I don't know" beats one that fabricates.

════════════════════════════════════════════════════════════════
SECTION 5 — WORKED EXAMPLE
════════════════════════════════════════════════════════════════

Query: "What optimisation algorithm does the paper use?"

Answer A (retrieved_chunks = []):
  "The paper uses gradient descent with momentum…"
  → STEP 1: context_available = false. STEP 3: introduces "gradient descent
    with momentum" — not from context. Verdict: hallucinated.
  → Accuracy=0, Completeness=0, Clarity=7, Conciseness=6, Citation=0. Total=13.

Answer B (retrieved_chunks = ["…the authors employ Adam optimiser (lr=1e-4)
  as described in Section 3.2…"]):
  "According to Section 3.2, the paper uses the Adam optimiser with lr=1e-4."
  → STEP 1: context available. STEP 3: claims match chunk. Verdict: none.
  → Accuracy=10, Completeness=9, Clarity=10, Conciseness=10, Citation=9. Total=48.

Winner: vectored. Hallucination risk: high (Answer A hallucinated).

════════════════════════════════════════════════════════════════
SECTION 6 — OUTPUT FORMAT
════════════════════════════════════════════════════════════════

Return ONLY a valid JSON object. No prose. No markdown fences.

{
  "scores": {
    "vectorless": {
      "accuracy":         <int 0-10>,
      "completeness":     <int 0-10>,
      "clarity":          <int 0-10>,
      "conciseness":      <int 0-10>,
      "citation_quality": <int 0-10>,
      "total":            <int 0-50>
    },
    "vectored": {
      "accuracy":         <int 0-10>,
      "completeness":     <int 0-10>,
      "clarity":          <int 0-10>,
      "conciseness":      <int 0-10>,
      "citation_quality": <int 0-10>,
      "total":            <int 0-50>
    }
  },
  "grounding": {
    "vectorless": "<none|hallucinated|abstained|general_fallback|context_unavailable>",
    "vectored":   "<none|hallucinated|abstained|general_fallback|context_unavailable>"
  },
  "hallucination_scan": {
    "vectorless": {
      "context_available":  <bool>,
      "admission_detected": <bool>,
      "specificity_leakage":<bool>,
      "generic_pivot":      <bool>,
      "verdict":            "<string>"
    },
    "vectored": {
      "context_available":  <bool>,
      "admission_detected": <bool>,
      "specificity_leakage":<bool>,
      "generic_pivot":      <bool>,
      "verdict":            "<string>"
    }
  },
  "winner":      "<vectorless|vectored|tie>",
  "winner_note": "<e.g. both_hallucinated | grounded_wins | score_margin>",
  "reasoning": {
    "accuracy":         "<why each answer got its accuracy score>",
    "completeness":     "<why>",
    "clarity":          "<why>",
    "conciseness":      "<why>",
    "citation_quality": "<why>"
  },
  "summary":        "<2-3 sentence plain-English verdict>",
  "recommendation": "<actionable advice for improving the lower-scoring pipeline>",
  "hallucination_risk": "<low|medium|high>",
  "score_diff":     <int — vectorless.total minus vectored.total>
}
""".strip()



def evaluate_pipelines(
    query: str,
    vectorless_answer: str,
    vectored_answer: str,
    vectored_chunks: list,
    vectorless_nodes: list = [],   # ← ADD THIS — pass the nodes used
    model: str = "llama-3.3-70b-versatile",
    max_retries: int = 1,
) -> dict:

    # Vectorless context block — built from local tree nodes
    if vectorless_nodes:
        vectorless_context_text = "\n\n".join(
            f"[Section: '{n['title']}' | Page {n.get('page_index', '?')}]\n{n.get('text', '')[:300]}"
            for n in vectorless_nodes
        )
        vectorless_context_status = f"CONTEXT AVAILABLE: {len(vectorless_nodes)} section(s) retrieved from local document tree."
    else:
        vectorless_context_text   = "NO SECTIONS RETRIEVED."
        vectorless_context_status = "⚠️ No sections found for this query."

    # Vectored context block — built from retrieved chunks
    if vectored_chunks:
        vectored_context_text   = "\n\n".join(
            f"[Chunk {i+1}]\n{chunk}" for i, chunk in enumerate(vectored_chunks)
        )
        vectored_context_status = f"CHUNKS AVAILABLE: {len(vectored_chunks)} chunk(s) retrieved."
    else:
        vectored_context_text   = "NO CHUNKS RETRIEVED (retrieved_chunks = [])."
        vectored_context_status = (
            "⚠️ CRITICAL: retrieved_chunks is EMPTY. "
            "Any domain-specific detail in this answer is hallucinated."
        )

    user_message = f"""
═══════════════════════════════════
USER QUERY
═══════════════════════════════════
{query}

═══════════════════════════════════
ANSWER A — VECTORLESS
Context status: {vectorless_context_status}
Context used:
{vectorless_context_text}

Answer:
{vectorless_answer}

═══════════════════════════════════
ANSWER B — VECTORED
Context status: {vectored_context_status}
Context used:
{vectored_context_text}

Answer:
{vectored_answer}

═══════════════════════════════════
INSTRUCTIONS
═══════════════════════════════════
1. Evaluate each answer INDEPENDENTLY using its OWN context block above.
2. Answer A has its own context (local document tree). Answer B has its own context (retrieved chunks).
3. Do NOT apply Answer B's empty chunks warning to Answer A.
4. Run the 4-step hallucination scan per Section 2 for EACH answer separately.
5. Apply scoring rubric per Section 3.
6. Determine winner per Section 4.
7. Return ONLY the JSON object from Section 6.
""".strip()

    last_error = None
    for attempt in range(max_retries + 1):
        # On retry, append a correction nudge to the user message
        msg = user_message
        if attempt > 0:
            msg += (
                f"\n\n⚠️ Your previous response failed JSON validation "
                f"(error: {last_error}). "
                "Return ONLY the raw JSON object — no prose, no markdown fences."
            )

        response = groq_client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user",   "content": msg},
            ],
            response_format={"type": "json_object"},
        )

        raw_text = response.choices[0].message.content

        # Strip stray markdown fences if model ignored the instruction
        clean = re.sub(r"^```(?:json)?\s*", "", raw_text.strip(), flags=re.IGNORECASE)
        clean = re.sub(r"\s*```$", "", clean)

        try:
            result = json.loads(clean)

            # ----------------------------------------------------------------
            # POST-PROCESSING: enforce hard zeros and recompute totals
            # so frontend always gets trustworthy numbers even if the LLM
            # slightly under-penalised a hallucinating answer.
            # ----------------------------------------------------------------
            for pipeline in ("vectorless", "vectored"):
                scan   = result.get("hallucination_scan", {}).get(pipeline, {})
                scores = result["scores"][pipeline]
                verdict = scan.get("verdict", result["grounding"].get(pipeline, ""))

                # Hard-zero accuracy for hallucinated answers
                if verdict == "hallucinated":
                    scores["accuracy"]         = 0
                    scores["completeness"]      = 0
                    scores["citation_quality"]  = 0

                # Hard-zero accuracy for unavailable context with specific detail
                if not scan.get("context_available", True) and \
                        scan.get("specificity_leakage", False):
                    scores["accuracy"]         = 0
                    scores["completeness"]      = 0

                # Recompute total server-side — never trust LLM arithmetic
                scores["total"] = (
                    scores["accuracy"] +
                    scores["completeness"] +
                    scores["clarity"] +
                    scores["conciseness"] +
                    scores["citation_quality"]
                )

            # Recompute score_diff after enforced corrections
            result["score_diff"] = (
                result["scores"]["vectorless"]["total"] -
                result["scores"]["vectored"]["total"]
            )

            # Re-apply winner logic after corrections
            g_vl = result["grounding"].get("vectorless", "")
            g_v  = result["grounding"].get("vectored",   "")
            vl_hal = g_vl == "hallucinated"
            v_hal  = g_v  == "hallucinated"

            if vl_hal and not v_hal:
                result["winner"]      = "vectored"
                result["winner_note"] = "grounded_wins"
            elif v_hal and not vl_hal:
                result["winner"]      = "vectorless"
                result["winner_note"] = "grounded_wins"
            elif vl_hal and v_hal:
                result["winner"]      = "tie"
                result["winner_note"] = "both_hallucinated"
            else:
                diff = abs(result["score_diff"])
                if diff > 2:
                    result["winner"] = (
                        "vectorless"
                        if result["scores"]["vectorless"]["total"] >
                           result["scores"]["vectored"]["total"]
                        else "vectored"
                    )
                    result["winner_note"] = "score_margin"
                else:
                    result["winner"]      = "tie"
                    result["winner_note"] = "score_margin"

            return result

        except (json.JSONDecodeError, KeyError, TypeError) as exc:
            last_error = exc
            if attempt >= max_retries:
                raise RuntimeError(
                    f"Evaluator failed to return valid JSON after "
                    f"{max_retries + 1} attempt(s).\nRaw output:\n{raw_text}"
                ) from exc