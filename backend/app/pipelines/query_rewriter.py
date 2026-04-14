import os
import ast
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq

_llm = None

def _get_llm() -> ChatGroq:
    global _llm
    if _llm is None:
        _llm = ChatGroq(
            model="llama-3.1-8b-instant",
            api_key=os.getenv("GROQ_API_KEY"),
            temperature=0
        )
    return _llm

def rewrite_query(original: str) -> list[str]:
    prompt = f"""You are a search query optimizer.
Generate 3 alternative phrasings of this question to improve document retrieval.
Return ONLY a valid Python list of 3 strings. No explanation, no markdown, no extra text.

Question: {original}

Output example: ["alternative 1", "alternative 2", "alternative 3"]"""

    try:
        llm = _get_llm()
        response = llm.invoke(prompt)
        variants = ast.literal_eval(response.content.strip())
        if isinstance(variants, list) and len(variants) == 3:
            return [original] + variants
    except Exception:
        pass
    return [original]