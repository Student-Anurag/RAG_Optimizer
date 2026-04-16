import json
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def evaluate_pipelines(
    query: str,
    vectorless_answer: str,
    vectored_answer: str,
    vectored_chunks: list,   
    model: str = "llama-3.3-70b-versatile"
) -> dict:
    
    """
    LLM-as-Judge evaluator that compares vectorless RAG vs vector RAG answers.
    Returns a structured evaluation report for the frontend.
    """

    system_message = """You are an expert RAG systems evaluator. 
Your job is to objectively compare two AI-generated answers to the same question and evaluate them across multiple dimensions.

## Evaluation Dimensions (score each 1-10):
- **Accuracy**: How factually correct is the answer based on the question context?
- **Completeness**: Does the answer fully address all parts of the question?
- **Clarity**: Is the answer well-structured, easy to understand, and clearly written?
- **Conciseness**: Is the answer appropriately concise without missing key information?
- **Citation Quality**: Are sources/sections properly cited to support claims?

## Rules
- Be objective — do not favor either pipeline by default.
- Base scores purely on answer quality, not on which pipeline produced it.
- If both answers are equally good on a dimension, give them the same score.
- Your reasoning must justify every score difference.
- Reply ONLY with valid JSON. No markdown fences. No extra keys."""


    # Detect hallucination before even calling the LLM

    hallucination_warning = ""
    if len(vectored_chunks) == 0:
        hallucination_warning = """

## CRITICAL WARNING
The Vector RAG retrieved_chunks is EMPTY. This means the vectored answer was generated 
WITHOUT any document context — it is based entirely on the LLM's training data, 
not the uploaded document. Apply a heavy penalty to accuracy and citation_quality 
for the vectored answer, and flag it as potentially hallucinated.
"""

    user_message = f"""## Question
{query}

## Answer A — Vectorless RAG (grounded in document)
{vectorless_answer}

## Answer B — Vector RAG
{vectored_answer}

{hallucination_warning}

## Your Task
Evaluate both answers. If the hallucination warning is present, 
heavily penalize vectored accuracy and mark grounding as FAILED.

Reply ONLY in this exact JSON format:
{{
  "scores": {{
    "vectorless": {{
      "accuracy":         <1-10>,
      "completeness":     <1-10>,
      "clarity":          <1-10>,
      "conciseness":      <1-10>,
      "citation_quality": <1-10>,
      "total":            <sum>
    }},
    "vectored": {{
      "accuracy":         <1-10>,
      "completeness":     <1-10>,
      "clarity":          <1-10>,
      "conciseness":      <1-10>,
      "citation_quality": <1-10>,
      "total":            <sum>
    }}
  }},
  "grounding": {{
    "vectorless": "grounded",
    "vectored": "<grounded | hallucinated | partial>"
  }},
  "winner": "<vectorless | vectored | tie>",
  "reasoning": {{
    "accuracy":         "<why>",
    "completeness":     "<why>",
    "clarity":          "<why>",
    "conciseness":      "<why>",
    "citation_quality": "<why>"
  }},
  "summary":        "<2-3 sentence verdict>",
  "recommendation": "<which pipeline suits this query type and why>",
  "hallucination_risk": "<none | low | high>"
}}"""

    response = groq_client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user",   "content": user_message}
        ],
        response_format={"type": "json_object"}
    )

    raw = json.loads(response.choices[0].message.content)

    # Safely compute totals in case LLM miscalculates
    for pipeline in ["vectorless", "vectored"]:
        s = raw["scores"][pipeline]
        s["total"] = (
            s["accuracy"] +
            s["completeness"] +
            s["clarity"] +
            s["conciseness"] +
            s["citation_quality"]
        )

    # Add score difference for frontend visualisation
    raw["score_diff"] = (
        raw["scores"]["vectorless"]["total"] -
        raw["scores"]["vectored"]["total"]
    )

    return raw