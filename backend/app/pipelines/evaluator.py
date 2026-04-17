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

    system_message = """You are an expert MLOps evaluator assessing two distinct RAG architectures. 
Your job is to objectively compare two AI-generated answers to the same question. 

## Context Asymmetry (CRITICAL)
- **Answer A (Vectorless)** had access to the ENTIRE source document. It may include valid facts, equations, and details that are missing from the Context Data.
- **Answer B (Vectored)** only had access to the limited text in the provided Context Data.

## Evaluation Dimensions (score each 1-10):
- **Accuracy**: Does the answer contain factual errors? 
    - For Answer B: Score based STRICTLY on the provided Context Data.
    - For Answer A: Assume its domain-specific claims (like equations or deep details) are accurate UNLESS they directly contradict the Context Data.
- **Completeness**: Does the answer address the core of the user's question? (Answer A will naturally score higher here if the Context Data is sparse).
- **Clarity**: Is the answer logically structured and easy to read?
- **Conciseness**: Is the answer direct and free of unnecessary filler?
- **Citation Quality**: Does the answer explicitly reference the source material?

## Rules
- Be objective. Base scores purely on the text provided.
- Do not penalize Answer A's Accuracy or Grounding for including valid technical information (like math formulas) that extends beyond the Context Data.
- If an answer is factually correct but lacks explicit citations, penalize 'Citation Quality', but DO NOT penalize 'Accuracy'.
- Reply ONLY with valid JSON."""


    # Format the chunks into a readable string so the LLM has ground truth
    context_text = "\n".join([f"Chunk {i+1}: {chunk}" for i, chunk in enumerate(vectored_chunks)]) if vectored_chunks else "NO CONTEXT PROVIDED."


    # Detect hallucination risk before calling the LLM
    hallucination_warning = ""
    if len(vectored_chunks) == 0:
        hallucination_warning = """
## CRITICAL WARNING
No context chunks were retrieved. Both answers must be evaluated heavily for potential hallucination based on general knowledge.
"""

    user_message = f"""## Context Data
{context_text}

## Question
{query}

## Answer A
{vectorless_answer}

## Answer B
{vectored_answer}

{hallucination_warning}

## Your Task
Evaluate both answers against the Context Data. If the hallucination warning is present, heavily penalize accuracy and mark grounding as FAILED for whichever answer lacks context.

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
    "vectorless": "<grounded | hallucinated | partial>",
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