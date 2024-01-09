from fastapi import FastAPI, UploadFile, File, Form
from rag import *
from chunk_and_embed import chunk_and_embed
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from typing import List
import json
from configs import *



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
    # vector_db_list = ["oncology4-bge-large-c2000-o400"]

    with open("../benchmarking/prompts-and-answers.json", 'r') as file:
        data = json.load(file)
        questions = [item['q'] for item in data]
        control_answers = [item['a'] for item in data]
    for vector_db in vector_db_list:
        llm_response_list = []
        qa_chain = create_chain(vector_db)
        for question in questions:
            query = json.dumps(question)
            llm_response = qa_chain(query)
            print(f"query: {query}")
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
                json.dump(llm_response_list, file, indent=4, ensure_ascii=False)
                print("json.dump")
            except:
                file.write(llm_response_list)
                print("file.write")
    
    return "answers made"


@app.get("/evaluate")
async def evaluate():
    file_paths = [
    '../benchmarking/prompts-and-answers.json',
    '../benchmarking/oncology2-bge-large-c1000-o200-benchmarking.json', 
    '../benchmarking/oncology3-bge-large-c500-o100-benchmarking.json',
    '../benchmarking/oncology4-bge-large-c2000-o400-benchmarking.json'
    ]

    # Read the files
    data_files = [read_json_file(path) for path in file_paths]
    answers = []
    sources = []
    # Iterate through control_data and add a new list for each question
    for item in data_files[0]:  # Assuming control_file is the first in the list
        if 'a' in item:
            answers.append([item['a']])
            sources.append([item['a']])

    
    # Add answers from other files
    for data in data_files[1:]:  # Skip the control file
        for index, item in enumerate(data):
            if 'answer' in item and index < len(answers):
                answers[index].append(item['answer'])
            if 'sources' in item and index < len(sources):
                source = ' '.join(item['sources'])
                sources[index].append(source)
    llm_answers_by_question = []
    llm_sources_by_question = []
    # Print results
    for i, answer_list in enumerate(answers):
        llm_answers_by_question.append(answer_list)
    for i, sources_list in enumerate(sources):
        llm_sources_by_question.append(sources_list)

    def format_answers_prompt(list_of_strings):
        if not list_of_strings:
            return ""
        first_element = f"Control Treatment: {list_of_strings[0]}"
        remaining_elements = '\n'.join([f"TREATMENT {index}: {value}" for index, value in enumerate(list_of_strings[1:], start=1)])
        return first_element + ('\n' + remaining_elements if remaining_elements else '')

    formatted_answers = [format_answers_prompt(sublist) for sublist in llm_answers_by_question]
    formatted_sources = [format_answers_prompt(sublist) for sublist in llm_sources_by_question]

    llm_comparison_responses = []
    llm_comparison_sources = []
    qa_chain = create_evaluation_chain()
    for formatted_answer in formatted_answers:
        query_evaluation_template = f"""Which of the following treatments is closest to the Control Treatment?
        {formatted_answer}
        """
        llm_response = qa_chain(query_evaluation_template)
        llm_comparison_responses.append(llm_response['result'])
        print(f"ANSWER========== {llm_response['result']}")
        print(f"==========================")

    for formatted_source in formatted_sources:
        sources_evaluation_template = f"""Which of the following TREATMENTS contains the most relevant supporting text to the Control Treatment?
        {formatted_source}
        """
        llm_response = qa_chain(sources_evaluation_template)
        llm_comparison_sources.append(llm_response['result'])
        print(f"SOURCE========== {llm_response['result']}")
        print(f"==========================")

    with open(f'../benchmarking/evaluation-answers.json', 'w+') as file:
        try:
            json.dump(llm_comparison_responses, file, indent=4, ensure_ascii=False)
            json.dump(llm_comparison_sources, file, indent=4, ensure_ascii=False)
            print("json.dump")
        except:
            file.write(llm_comparison_responses)
            print("file.write")
    
    # return llm_comparison_responses
    return llm_comparison_sources




if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



# provide a mock case study for a renal cancer patient, and provide a personalized treatment plan with timelines and dosages.