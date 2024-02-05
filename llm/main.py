from fastapi import BackgroundTasks, FastAPI, UploadFile, File, Form, Depends, HTTPException, Query
from fastapi.responses import JSONResponse, FileResponse
from rag import *
from chunk_and_embed import chunk_and_embed
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import os
import shutil
from typing import List
import json
from configs import *
from fastapi import APIRouter
import models
# from models import *
from sqlalchemy.inspection import inspect
from database import *
from sqlalchemy import text 
from sqlalchemy.orm import Session
from starlette import status
import schemas
from pypdf import PdfReader, PdfWriter

import router.posts

models.Base.metadata.create_all(bind=engine)

app = FastAPI()
origins = ["*"]
prefix_router = APIRouter(prefix="/api")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
class Prompt(BaseModel):
    query: str
    input_directory: str
    user_id: str
    system_prompt: str
    privacy_mode: bool

class Rag(BaseModel):
    user_id: str
    input_directory: str

class QueryRequest(BaseModel):
    uid: str

class UserRagConfigsRequest(BaseModel):
    uid: str
    input_directory: str
    system_prompt: str

class Privacy(BaseModel):
    user_id: str


# Check if table exists and create if not
if not inspect(engine).has_table(models.UserRagConfigs.__tablename__):
    models.UserRagConfigs.__table__.create(bind=engine)
    # Execute the ALTER TABLE command to add the unique constraint
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE user_rag_configs ADD UNIQUE (uid, rag)"))

# Check if table exists and create if not
if not inspect(engine).has_table(models.PrivateUsers.__tablename__):
    models.UserRagConfigs.__table__.create(bind=engine)


@prefix_router.post('/convo_history', response_model=List[schemas.UserConvoHistoryBase])
def test_posts(request_body: QueryRequest, db: Session = Depends(get_db)):
    uid = request_body.uid
    sql_query = text("SELECT rag,prompt,response,sources,system_prompt, created_at FROM user_convos WHERE uid = :uid")
    result = db.execute(sql_query, {'uid': uid})
    posts = result.fetchall()
    formatted_posts = []
    for post in posts:
        formatted_post = {
            "rag": post.rag,
            "prompt": post.prompt,
            "response": post.response,
            "sources": post.sources,
            "system_prompt": post.system_prompt,
            "created_at": post.created_at.isoformat() if post.created_at else None
        }
        formatted_posts.append(formatted_post)
    return formatted_posts


@prefix_router.post('/archive_message', status_code=status.HTTP_201_CREATED, response_model=List[schemas.CreateUserConvo])
def test_posts_sent(post_post:schemas.CreateUserConvo, db:Session = Depends(get_db)):
    new_convo = models.UserConvos(**post_post.dict())
    db.add(new_convo)
    db.commit()
    db.refresh(new_convo)
    return [new_convo]


@prefix_router.post("/rag_configs") 
async def fetch_rag_configs(request_body: Rag, db: Session = Depends(get_db)):
    uid = request_body.user_id
    rag_name = request_body.input_directory
    sql_query = text("select system_prompt FROM user_rag_configs WHERE uid = :uid AND rag = :rag_name")
    result = db.execute(sql_query, {'uid': uid, 'rag_name': rag_name})
    system_prompt_row = result.fetchone()
    # Check if a row was returned
    if system_prompt_row is not None:
        # Extract system_prompt value from the row
        system_prompt = system_prompt_row[0]  # Assuming system_prompt is the first column
        return system_prompt  # Return the system_prompt value as a string
    else:
        return "You are a helpful, respectful and honest assistant. Always answer as helpfully as possible using the context text provided. Your answers should only answer the question once and not have any text after the answer is done. If a question does not make any sense, or is not factually coherent, provide what information is needed for the question to be answered. If you don't know the answer to a question, please ask follow up questions that could lead you to the correct answer."

@prefix_router.post("/jobs_in_progress") 
async def fetch_rag_configs(request_body: QueryRequest, db: Session = Depends(get_db)):
    uid = request_body.uid
    sql_query = text("select rag FROM running_pipelines WHERE uid = :uid")
    result = db.execute(sql_query, {'uid': uid})
    running_rag_row = result.fetchone()
    # Check if a row was returned
    if running_rag_row is not None:
        # Extract system_prompt value from the row
        running_rag = running_rag_row[0]  # Assuming system_prompt is the first column
        return [running_rag]  # Return the system_prompt value as a string
    else:
        return []

@prefix_router.post("/set_privacy_flag") 
async def set_privacy_flag(request_body: Privacy, db: Session = Depends(get_db)):
    uid = request_body.user_id
    sql_query = text("""
                INSERT INTO private_users (uid)
                VALUES (:uid)
                ON CONFLICT (uid) 
                DO UPDATE SET uid = EXCLUDED.uid
                """
                )
    result = db.execute(sql_query, {'uid': uid})
    db.commit()
    return "privacy mode set"
    
@prefix_router.post("/is_private") 
async def set_privacy_flag(request_body: Privacy, db: Session = Depends(get_db)):
    uid = request_body.user_id
    sql_query = text("select uid FROM private_users WHERE uid = :uid")

    result = db.execute(sql_query, {'uid': uid})
    is_private = result.fetchone()
    return {"privacy": bool(is_private)}

    # return {"privacy": is_private}

@prefix_router.post('/delete_convo_history')
def test_posts(request_body: Rag, db: Session = Depends(get_db)):
    uid = request_body.user_id
    rag_name = request_body.input_directory

    sql_query = text("DELETE FROM user_convos WHERE uid = :uid AND rag = :rag_name")
    result = db.execute(sql_query, {'uid': uid, 'rag_name': rag_name})
    db.commit()

    return JSONResponse(content={"message": "Convo history deleted"})

@prefix_router.post('/save_rag_config')
def save_rag_config(request_body: UserRagConfigsRequest, db: Session = Depends(get_db)):
    uid = request_body.uid
    system_prompt = request_body.system_prompt
    rag_name = request_body.input_directory
    sql_query = text("""
                    INSERT INTO user_rag_configs (uid, rag, system_prompt)
                    VALUES (:uid, :rag_name, :system_prompt)
                    ON CONFLICT (uid, rag) 
                    DO UPDATE SET system_prompt = EXCLUDED.system_prompt
                    """
                    )
    result = db.execute(sql_query, {'uid': uid, 'rag_name': rag_name, 'system_prompt': system_prompt})
    db.commit()
    return result


@prefix_router.post("/qa")
async def read_question(item: Prompt, db: Session = Depends(get_db)):
    query = json.dumps(item.query)
    uid = item.user_id
    rag_name = item.input_directory
    privacy_mode = item.privacy_mode
    system_prompt = item.system_prompt
    # fix for privacy users
    if privacy_mode:
        system_prompt = item.system_prompt
    else:
        sql_query = text("SELECT system_prompt FROM user_rag_configs WHERE uid = :uid and rag = :rag_name")
        result = db.execute(sql_query, {'uid': uid, 'rag_name': rag_name})
        row = result.fetchone()
        system_prompt = row[0]
    
    print(f"system_prompt before create_chain:::: {system_prompt}")
    qa_chain = create_user_chain(item.user_id, item.input_directory, system_prompt)
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


# Utility function to sanitize PDFs
def sanitize_pdf(input_path, output_path):
    reader = PdfReader(input_path)
    writer = PdfWriter()

    for page in reader.pages:
        writer.add_page(page)

    with open(output_path, 'wb') as output_pdf:
        writer.write(output_pdf)


@prefix_router.post("/chunk_and_embed")
async def upload_to_vector_db(background_tasks: BackgroundTasks, files: List[UploadFile] = File(...), input_directory: str = Form(...), user_id: str = Form(...), is_privacy: bool = Form(...), db: Session = Depends(get_db)):
    staging_path = f'./rag_data/stage_data/{user_id}/'
    if not os.path.exists(staging_path):
        os.makedirs(staging_path)
    for file in files:
        try:
            temp_path = f"./temp_{file.filename}"
            with open(temp_path, 'wb') as f:
                shutil.copyfileobj(file.file, f)
                print("1......copy of file made")

             # Sanitize the PDF file
            sanitized_path = f"{staging_path}{file.filename}"
            sanitize_pdf(temp_path, sanitized_path)
            print("2......... file sanitized and moved to staging")
        except Exception:
            return {"message": f"Error: {Exception})"}
        finally:
            file.file.close()
             # Clean up the temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    sql_query = text("""
                    INSERT INTO running_pipelines (uid, rag)
                    VALUES (:uid, :rag)
                    ON CONFLICT (uid, rag) 
                    DO NOTHING
                     RETURNING *
                    """
                    )
    result = db.execute(sql_query, {'uid': user_id, 'rag': input_directory})
    db.commit()
    if result is None:
        return {"message": "You already have a running pipeline."}
    else:
        print("3.......... chunk_and_embed starting")
        # chunk_and_embed(user_id, input_directory, is_privacy)
        background_tasks.add_task(chunk_and_embed, user_id, input_directory, is_privacy)
        return {"message": "The data pipeline has begun and is running. You will be notified upon completion."}





@prefix_router.get("/databases/{userId}") 
async def fetch_vector_databases(userId: str):
    try:
        filenames = os.listdir(f"./rag_data/custom_db/{userId}")
    except:
        filenames = []
    return sorted(filenames)
    

@prefix_router.get("/sourcefiles/{userId}/{ragName}") 
async def fetch_source_files(userId: str, ragName: str):
    try:
        sourceFilenames = os.listdir(f"./rag_data/data/{userId}/{ragName}")
    except:
        sourceFilenames = []
    return sourceFilenames
    
@prefix_router.get("/download/{userId}/{ragName}/{filename}")
async def download_file(filename: str, ragName: str, userId: str):
    file_path = f"./rag_data/data/{userId}/{ragName}/{filename}"
    if os.path.exists(file_path):
        return FileResponse(file_path, headers={"Content-Disposition": "attachment; filename=" + os.path.basename(file_path)})
    else:
        raise HTTPException(status_code=404, detail="File not found")


@prefix_router.post("/delete") 
async def delete_vector_database(item: Rag):
    # filenames = os.listdir(f"./rag_data/custom_db/{userId}")
    # Path to the directory to be removed
    directory_path = f'./rag_data/custom_db/{item.user_id}/{item.input_directory}'
    archive_path = f'./rag_data/data/{item.user_id}/{item.input_directory}'

    if os.path.exists(archive_path):
        # Remove the directory and all its contents
        shutil.rmtree(archive_path)
    else:
        print(f"Directory '{archive_path}' does not exist.")
    # Check if directory exists
    if os.path.exists(directory_path):
        # Remove the directory and all its contents
        shutil.rmtree(directory_path)
    else:
        print(f"Directory '{directory_path}' does not exist.")
   
    return f'{item.input_directory} has been deleted'


@prefix_router.get("/benchmark")
async def benchmarking():
    vector_db_list = ["oncology2-bge-large-c1000-o200", "oncology3-bge-large-c500-o100","oncology4-bge-large-c2000-o400"]
    # vector_db_list = ["oncology4-bge-large-c2000-o400"]

    with open("../benchmarking/prompts-and-answers.json", 'r') as file:
        data = json.load(file)
        questions = [item['q'] for item in data]
    for vector_db in vector_db_list:
        llm_response_list = []
        # using intergalactictrash27@protonmail.com account
        qa_chain = create_chain(vector_db, user_id="uLlf51AUjehmXndE7HiUB0W3Fvg2")
        print(f"==================================")
        print(f"vectorDB: {vector_db}")
        print(f"==================================")
        question_number = 1
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
            print(f"question: {question_number}")
            question_number += 1
            
        with open(f'../benchmarking/{vector_db}-benchmarking.json', 'w+') as file:
            try:
                json.dump(llm_response_list, file, indent=4, ensure_ascii=False)
                print("json.dump")
            except:
                file.write(llm_response_list)
                print("file.write")
    
    return "answers made"


@prefix_router.get("/evaluate")
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


app.include_router(prefix_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)



# provide a mock case study for a renal cancer patient, and provide a personalized treatment plan with timelines and dosages.