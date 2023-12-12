from fastapi import FastAPI, UploadFile, File
from rag import *
from chunk_and_embed import chunk_and_embed
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from typing import List
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
    # print("QUESTION::::::")
    query = json.dumps(item.query)
    # query = item.query
    # print(query)
    qa_chain = create_chain('db')
    llm_response = qa_chain(query)
    # print("LLM RESPONSE:::")
    # print(llm_response)
    wrap_text_preserve_newlines(llm_response['result'])
    sources = []
    try:
        for source in llm_response["source_documents"]:
            sources.append(source)
            # print(source.metadata['source'])   
    except:
        print("NO SOURCES??")
        pass
 
    return {
        "answer": process_llm_response(llm_response),
        "sources": sources
    }


@app.post("/chunk_and_embed")
async def upload_to_vector_db(files: List[UploadFile] = File(...)):
    for file in files:
        try:
            with open(file.filename, 'wb') as f:
                shutil.copyfileobj(file.file, f)
                shutil.move(f"./{file.filename}", f"./stage_data/{file.filename}")
        except Exception:
            return {"message": "There was an error uploading the file(s)"}
        finally:
            file.file.close()

    chunk_and_embed('dietetics')
    qa_chain = create_chain('dietetics')
    query = "what is an ideal diet for a patient with CHF?"
    llm_response = qa_chain(query)
    wrap_text_preserve_newlines(llm_response['result'])
    # return {"message": f"Successfuly uploaded {[file.filename for file in files]}"} 
    wrap_text_preserve_newlines(llm_response['result'])
    sources = []
    try:
        for source in llm_response["source_documents"]:
            sources.append(source)
            # print(source.metadata['source'])   
    except:
        print("NO SOURCES??")
        pass
 
    return {
        "answer": process_llm_response(llm_response),
        "sources": sources
    }




@app.get("/databases") 
def fetch_vector_databases():
    filenames = os.listdir ("./custom_db")
    print(f"custom vector stores::: {filenames}")
    return filenames
    


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



# provide a mock case study for a renal cancer patient, and provide a personalized treatment plan with timelines and dosages.