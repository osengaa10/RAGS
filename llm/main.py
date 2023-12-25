from fastapi import FastAPI, UploadFile, File, Form
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
    input_directory: str

@app.post("/qa")
async def read_question(item: Prompt):
    query = json.dumps(item.query)
    qa_chain = create_chain(item.input_directory)
    llm_response = qa_chain(query)
    wrap_text_preserve_newlines(llm_response['result'])
    sources = []
    try:
        for source in llm_response["source_documents"]:
            sources.append(source)
    except:
        print("NO SOURCES??")
        pass
 
    return {
        "answer": process_llm_response(llm_response),
        "sources": sources
    }


@app.post("/chunk_and_embed")
async def upload_to_vector_db(files: List[UploadFile] = File(...), input_directory: str = Form(...)):
    for file in files:
        try:
            with open(file.filename, 'wb') as f:
                shutil.copyfileobj(file.file, f)
                shutil.move(f"./{file.filename}", f"./stage_data/{file.filename}")
        except Exception:
            return {"message": "There was an error uploading the file(s)"}
        finally:
            file.file.close()

    # print(f"RAG NAME::: {input_directory}")
    chunk_and_embed(input_directory)
    qa_chain = create_chain(input_directory)
    query = "what are some ways of transfering graphene?"
    llm_response = qa_chain(query)
    wrap_text_preserve_newlines(llm_response['result'])
    sources = []
    try:
        for source in llm_response["source_documents"]:
            sources.append(source)
    except:
        print("NO SOURCES??")
        pass
 
    return {
        "answer": process_llm_response(llm_response),
        "sources": sources
    }




@app.get("/databases") 
async def fetch_vector_databases():
    filenames = os.listdir("./custom_db")
    return sorted(filenames)
    



@app.get("/benchmark")
async def benchmarking():
    vector_db_list = ["oncology2-bge-large-c1000-o200", "oncology3-bge-large-c500-o100","oncology4-bge-large-c2000-o400"]
    with open("../benchmarking/prompts-and-answers.json", 'r') as file:
        data = json.load(file)
        questions = [item['q'] for item in data]
    for vector_db in vector_db_list:
        llm_response_list = []
        qa_chain = create_chain(vector_db)
        for question in questions:
            query = json.dumps(question)
            llm_response = qa_chain(query)
            wrap_text_preserve_newlines(llm_response['result'])
            sources = []
            try:
                for source in llm_response["source_documents"]:
                    sources.append(source.page_content)
            except:
                print("NO SOURCES??")
                pass
    
            llm_response_list.append({
            "answer": process_llm_response(llm_response),
            "sources": sources
            })
            
        with open(f'../benchmarking/{vector_db}-benchmarking.json', 'w+') as file:
            try:
                json.dump(llm_response_list, file, indent=4)
                print("json.dump")
            except:
                file.write(llm_response_list)
                print("file.write")
    return "answers made"






if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



# provide a mock case study for a renal cancer patient, and provide a personalized treatment plan with timelines and dosages.