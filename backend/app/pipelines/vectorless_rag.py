from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil, os, uuid
from dotenv import load_dotenv
from groq import Groq
import  json, hashlib
import fitz
load_dotenv()


def init_llm(groq_api_key: str): 
    print("Groq key loaded:", "✅" if groq_api_key else "❌ Missing!")
    client = Groq(api_key=groq_api_key)
    print("✅ Groq client ready")
    return client

GROQ_KEY    = os.getenv("GROQ_API_KEY")
groq_client = init_llm(GROQ_KEY)





TREE_CACHE_DIR = "./tree_cache"
os.makedirs(TREE_CACHE_DIR, exist_ok=True)




def get_file_hash(file_path: str) -> str:
    """Unique fingerprint of a file based on its contents."""
    hasher = hashlib.md5()
    with open(file_path, "rb") as f:
        while chunk := f.read(8192):
            hasher.update(chunk)
    return hasher.hexdigest()




def build_local_tree(pdf_path: str) -> list:   # this function creates a local copy of the tree for better performance. It's required because pageindex has rate limits.
    """
    Parse a PDF into a structured node tree locally using PyMuPDF.
    Each page becomes one node — title, page number, and full text.

    """
    doc  = fitz.open(pdf_path)
    tree = []
    for i, page in enumerate(doc):
        text = page.get_text().strip()
        if not text:
            continue  # skip blank pages
        tree.append({
            "node_id":    f"{i+1:04d}",
            "title":      f"Page {i+1}",
            "page_index": i + 1,
            "text":       text,
            "nodes":      []   # no children — flat page-level tree
        })
    doc.close()
    return tree




def get_or_build_tree(pdf_path: str) -> list:
    """
    Build tree once, cache to disk, reuse forever.
    Same file → same hash → instant load.
    Works across server restarts and multiple users.
    
    """
    file_hash  = get_file_hash(pdf_path)
    cache_path = os.path.join(TREE_CACHE_DIR, f"{file_hash}.json")

    if os.path.exists(cache_path):
        print("✅ Tree found in cache — loading instantly")
        with open(cache_path, "r") as f:
            return json.load(f)

    print(f"🔨 New document — building tree for {pdf_path}...")
    tree = build_local_tree(pdf_path)

    with open(cache_path, "w") as f:
        json.dump(tree, f, indent=2)

    print(f"✅ Tree built and cached ({len(tree)} pages)")
    return tree




def print_tree(nodes: list, indent: int = 0):
    """Recursively print tree titles for a visual overview."""
    for node in nodes:
        prefix = "  " * indent + ("└─ " if indent > 0 else "")
        page   = node.get("page_index", "?")
        print(f"{prefix}[{node['node_id']}] {node['title']}  (p.{page})")
        if node.get("nodes"):
            print_tree(node["nodes"], indent + 1)



def count_nodes(nodes: list) -> int:
    total = len(nodes)
    for n in nodes:
        if n.get("nodes"):
            total += count_nodes(n["nodes"])
    return total





def llm_tree_search(query: str, tree: list, model: str = "llama-3.3-70b-versatile") -> dict:
    """
    Sends the query + compressed document tree to an LLM.
    LLM reasons over the structure and returns relevant node_ids.
    Returns: dict with 'thinking' and 'node_list'.

    """

    def compress(nodes):
        out = []
        for n in nodes:
            entry = {
                "node_id": n["node_id"],
                "title":   n["title"],
                "page":    n.get("page_index", "?"),
                "summary": n.get("text", "")[:150]
            }
            if n.get("nodes"):
                entry["children"] = compress(n["nodes"])
            out.append(entry)
        return out

    compressed_tree = compress(tree)

    prompt = f"""You are a precise document navigation assistant. Given a query and a document's hierarchical tree structure (representing its Table of Contents with node IDs), your job is to identify the exact node IDs whose sections are most likely to contain the answer.

## Rules
- Select ONLY nodes whose content would directly answer the query — not parent/ancestor nodes unless no specific child exists.
- Prefer the most specific (deepest) relevant node over a broad parent node.
- If multiple sibling nodes are relevant, include all of them.
- If NO node is relevant, return an empty list — do not guess.
- Do NOT include nodes based on superficial keyword overlap alone; reason about actual content relevance.
- Return a maximum of 5 node IDs. Prioritize precision over recall.

## Query
{query}

## Document Tree
{json.dumps(compressed_tree, indent=2)}

## Output Format
Reply ONLY with valid JSON. No explanation outside the JSON block. No markdown fences. No extra keys.

{{
  "thinking": "<step-by-step reasoning: what the query is asking, which sections address it, why you included or excluded specific nodes>",
  "node_list": ["node_id1", "node_id2"]
}}"""

    response = groq_client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"}
    )

    return json.loads(response.choices[0].message.content)



def find_nodes_by_ids(tree: list, target_ids: list) -> list:
    """Recursively walk the tree and collect nodes matching target_ids."""
    found = []
    for node in tree:
        if node["node_id"] in target_ids:
            found.append(node)
        if node.get("nodes"):
            found.extend(find_nodes_by_ids(node["nodes"], target_ids))
    return found




def generate_answer(query: str, nodes: list, model: str = "llama-3.3-70b-versatile") -> str:
    """
    Takes retrieved nodes as context and generates a grounded answer.
    Returns a plain string — rendering is handled by the caller.
    
    """
    if not nodes:
        return "⚠️ No relevant sections found in the document."

    context_parts = []
    for node in nodes:
        context_parts.append(
            f"[Section: '{node['title']}' | Page {node.get('page_index', '?')}]\n"
            f"{node.get('text', 'Content not available.')}"
        )
    context = "\n\n---\n\n".join(context_parts)

    system_message = """You are an expert document analyst with strict grounding discipline.

## Core Rules
- Answer ONLY using information explicitly present in the provided context.
- You MUST use ALL provided context sections in your answer, not just the first one.
- If the context does not contain enough information to answer, respond exactly with:
  "The provided context does not contain sufficient information to answer this question."
- Never infer, assume, or use outside knowledge — even if you are confident.
- Never fabricate citations, page numbers, or section titles.
- If the context contains mathematical formulas, you must include them in your response,else include them in your answer.
- Format all formulas using standard LaTeX enclosed in $$ for block equations and $ for inline equations.

## Citation Format
After every distinct claim, cite inline as: (Section: "<title>", Page: <number>)

## Answer Quality
- Lead with the answer directly and explain a little in points — no preamble.
- Show politeness and normal interactive behaviour.
- Use bullet points for multi-part answers; prose for single-fact answers.
- Structure with subheadings if multiple sections cover distinct subtopics.
- Wrap all equations in $$...$$ for block display."""

    user_message = f"""## Question
{query}

## Context
{context}"""

    response = groq_client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_message},
            {"role": "user",   "content": user_message}
        ]
    )

    return response.choices[0].message.content






def vectorless_rag(query: str, tree: list, verbose: bool = True) -> str:
    """
    Full end-to-end Vectorless RAG pipeline:
    Step 1: LLM Tree Search  → finds relevant node_ids
    Step 2: Node Retrieval   → fetches section content from tree
    Step 3: Answer Generation → produces cited, grounded answer
    
    """
    if verbose:
        print(f"{'='*55}")
        print(f"🔍 Query: {query}")
        print(f"{'='*55}")

    # Step 1: Tree search
    search_result = llm_tree_search(query, tree)
    node_ids      = search_result.get("node_list", [])

    if verbose:
        print(f"\n🧠 Reasoning: {search_result.get('thinking', '')[:200]}...")
        print(f"🎯 Retrieved node IDs: {node_ids}")

    # Step 2: Retrieve nodes
    nodes = find_nodes_by_ids(tree, node_ids)

    if verbose:
        print(f"📄 Sections found: {[n['title'] for n in nodes]}")

    # Step 3: Generate answer
    answer = generate_answer(query, nodes)

    return answer,nodes








# app = FastAPI()

# # Allow frontend to call this API
# app.add_middleware(
#      CORSMiddleware,
#      allow_origins=["*"],
#      allow_methods=["*"],
#      allow_headers=["*"]
# )

# TEMP_DIR = "./temp_uploads"
# os.makedirs(TEMP_DIR, exist_ok=True)

# @app.post("/query")
# async def query_document(
#      file: UploadFile = File(...),
#      question: str    = ""
# ):
#      # Step 1 — Save uploaded file temporarily
#     temp_path = os.path.join(TEMP_DIR, f"{uuid.uuid4()}_{file.filename}")
    
#     with open(temp_path, "wb") as f:
#          shutil.copyfileobj(file.file, f)
    
#     try:
#          # Step 2 — get_or_build_tree works EXACTLY as before
#          # Same file from any user = same hash = instant cache hit
#          tree = get_or_build_tree(temp_path)
        
#          # Step 3 — Run RAG pipeline
#          answer = generate_answer(question, tree)
        
#          return {
#              "answer":   answer,
#              "filename": file.filename,
#              "pages":    len(tree)
#          }
    
    
#     finally:
#          # Step 4 — Clean up temp file (cache remains untouched)
#          os.remove(temp_path)



################################################################################