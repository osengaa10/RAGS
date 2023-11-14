from fastapi import FastAPI, HTTPException
from rag import qa_chain, process_llm_response, wrap_text_preserve_newlines
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware

import json
app = FastAPI()
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
class Prompt(BaseModel):
    query: str

@app.post("/qa")
async def read_question(item: Prompt):
    print("QUESTION::::::")
    query = json.dumps(item.query)
    # query = item.query
    print(query)
    llm_response = qa_chain(query)
    wrap_text_preserve_newlines(llm_response['result'])
    sources = []
    for source in llm_response["source_documents"]:
        sources.append(source)
        print(source.metadata['source'])    
    return {
        "answer": process_llm_response(llm_response),
        "sources": sources
    }


@app.get("/test") 
def ask_question():
    query = "What tp53?"
    print(query)
    llm_response = qa_chain(query)
    sources = []
    for source in llm_response["source_documents"]:
        sources.append(source)
        print(source.metadata['source'])
    process_llm_response(llm_response)
    return {
        "answer": process_llm_response(llm_response),
        "sources": sources
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)


