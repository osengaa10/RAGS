# RAGS
A retrieval augmented generation system (RAGS) via langchain, HuggingFaceBge embeddings, and a chromaDB vector store. The default LLM is llama-2-70B-chat hosted by together.ai. 

![prompt QA](./paste-screenshot.png)

####Prerequisits:
- `python -m venv rag-env`
- `source rag-env/bin/activate`
- `pip install requirements.txt`

####When running this for the first time you'll need to create the vector store:
1. put pdf files in stage_data/  
2. run pipeline_rag.py to generate embeddings and vector store (`python pipeline_rag.py`)  
3. run backend (`uvicorn main:app --reload`)


####run backend:
`uvicorn main:app --reload`

####run frontend:
`npm run dev`
