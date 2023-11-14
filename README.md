# RAGS
Build a retrieval augmented generation system via langchain, huggingFaceBGE embeddings, and a chromaDB vector store. The LLM uses llama-2-70B-chat hosted by together.ai

![prompt QA](./paste-screenshot.png)

prerequisits:
`python -m venv rag-env`
`source rag-env/bin/activate`
`pip install requirements.txt`

When running this for the first time you'll need to create the vector store:

1.) put pdf files in stage_data/
2.) run pipeline_rag.py to generate embeddings and vector store (`python pipeline_rag.py`)
3.) run backend (`uvicorn main:app --reload`)


run backend:
`uvicorn main:app --reload`

run frontend:
`npm run dev`
