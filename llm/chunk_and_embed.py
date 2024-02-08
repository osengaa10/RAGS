import os
import together
import shutil
import logging
import time
import textwrap
from typing import Any, Dict, List, Mapping, Optional
from fastapi import BackgroundTasks, WebSocket
from pydantic import Extra, Field, root_validator, model_validator
import langchain
# import langchain_community
from langchain.callbacks.manager import CallbackManagerForLLMRun
from langchain.llms.base import LLM
from langchain.llms.utils import enforce_stop_tokens
from langchain.utils import get_from_dict_or_env
from langchain.vectorstores import Chroma
# from langchain_community.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter

from langchain.chains import RetrievalQA
# from langchain.document_loaders import TextLoader

# from langchain_community.document_loaders import PyPDFLoader, PDFMinerLoader, PyPDFDirectoryLoader, DirectoryLoader, TextLoader
from langchain.document_loaders import PyPDFLoader, PDFMinerLoader, PyPDFDirectoryLoader, DirectoryLoader, TextLoader

# from langchain.document_loaders import DirectoryLoader
# from langchain.embeddings import HuggingFaceBgeEmbeddings
from langchain.embeddings import HuggingFaceBgeEmbeddings
import configs
from sqlalchemy import text
from database import SessionLocal
import pypdf
import asyncio
import threading
# from base import send_websocket_message

connections: Dict[str, WebSocket] = {}

async def notify_user_of_completion(user_id: str, rag: str):
    # Check if the user is connected via WebSocket
    if user_id in connections:
        websocket = connections[user_id]
        print(f"user in connections::: {connections[user_id]}")
        print(f"rag::: {rag}")
        await websocket.send_text(f"updates have completed.")
        print("REMOVING USER FROM NOTIFICATIONS")
        # Remove the user's UID from "job_notifications" after sending notification
        remove_user_from_notifications(user_id, rag)

def remove_user_from_notifications(user_id: str, rag: str):
    # SQL query to delete the user's UID from "job_notifications"
    db = SessionLocal()
    uid = user_id
    print("inside remove_user_from_notifications")
    sql_query = text("""
                         DELETE FROM completed_job_notifications 
                         WHERE uid = :uid and rag = :rag
                         """)
    db.execute(sql_query, {'uid': uid, 'rag': rag})
    db.commit()
    db.close()


def run_async_in_background(task, *args, **kwargs):
    """
    Run an async task in the background by starting a new thread.
    """
    # Define a synchronous wrapper function to run the async function
    def thread_function(async_func, event_loop, args, kwargs):
        asyncio.set_event_loop(event_loop)
        event_loop.run_until_complete(async_func(*args, **kwargs))
    
    # Create a new event loop for the thread
    new_loop = asyncio.new_event_loop()
    # Create and start a thread running the wrapper function
    thread = threading.Thread(target=thread_function, args=(task, new_loop, args, kwargs))
    thread.start()


################################################################################
# split documents into chunks, create embeddings, store embeddings in chromaDB #
################################################################################
async def chunk_and_embed(user_id, input_directory, is_privacy):
    db = SessionLocal()
    src_dir = f'./rag_data/stage_data/{user_id}'
    dst_dir = f'./rag_data/data/{user_id}/{input_directory}'
    files = [f for f in os.listdir(src_dir) if os.path.isfile(os.path.join(src_dir, f))]
    persist_directory = f'rag_data/custom_db/{user_id}/{input_directory}'
    t1 = time.perf_counter()
    try:
        """split documents into chunks, create embeddings, store embeddings in chromaDB"""
        print("4......inside chunk_and_embed try statement")
        chunk_size = 1000
        chunk_overlap=200
        print(f"split PDF files")
        print(os.listdir(src_dir))
        loader = PyPDFDirectoryLoader(f'./rag_data/stage_data/{user_id}')
        documents = loader.load()
        print(f' =========== number of documents {len(documents)} =========== ')
        #splitting the text into
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        texts = text_splitter.split_documents(documents)
        print(f'=========== number of chunks {len(texts)} ===========')
     
        Chroma.from_documents(documents=texts,
                                        embedding=configs.embedding,
                                        persist_directory=persist_directory)

        t2 = time.perf_counter()
        print(f'time taken to embed {len(texts)} chunks:',t2-t1)
        print(f'time taken to embed {len(texts)} chunks:,{(t2-t1)/60} minutes')
        print(f'time taken to embed {len(texts)} chunks:,{((t2-t1)/60)/60} hours')

        if not os.path.exists(dst_dir):
            os.makedirs(dst_dir)

        if not is_privacy:
            for file in files:
                src_file_path = os.path.join(src_dir, file)
                dst_file_path = os.path.join(dst_dir, file)
                shutil.move(src_file_path, dst_file_path)
        else:
            for file in files:
                src_file_path = os.path.join(src_dir, file)
                os.remove(src_file_path)

        print(f"Moved {len(files)} files from {src_dir} to {dst_dir}.")
        print(f"Files moved: {files}")
        print("\n".join(files))
        sql_query = text("""
                         DELETE FROM running_pipelines 
                         WHERE uid = :uid AND rag = :rag
                         """)
        db.execute(sql_query, {'uid': user_id, 'rag': input_directory})
        db.commit()


        sql_query_job_completion = text("""
                        INSERT INTO completed_job_notifications (uid, rag)
                        VALUES (:uid, :rag)
                        ON CONFLICT (uid, rag) 
                        DO NOTHING
                         """)
        db.execute(sql_query_job_completion, {'uid': user_id, 'rag': input_directory})
        db.commit()
        # After successful completion, attempt to send a WebSocket message
        await notify_user_of_completion(user_id, input_directory)
        return f'time taken to embed {len(texts)} chunks:,{(t2-t1)/60} minutes'

    except Exception as e:
        for file in files:
            src_file_path = os.path.join(src_dir, file)
            os.remove(src_file_path)
        print(f"embeddings failed, but still cleaned up staging directory")
        print(f"ERROR NOOOOOOOO: {e}")
        sql_query = text("""
                         DELETE FROM running_pipelines 
                         WHERE uid = :uid AND rag = :rag
                         """)
        db.execute(sql_query, {'uid': user_id, 'rag': input_directory})
        db.commit()
        print(f"ERROR NOOOOOOOOO: {e}")

        # Handle the exception as needed
    finally:
        db.close() 
        


#  WITH SPLITTING PDFS
# def chunk_and_embed(user_id, input_directory, is_privacy):
#     db = SessionLocal()
#     src_dir = f'./rag_data/stage_data/{user_id}'
#     dst_dir = f'./rag_data/data/{user_id}/{input_directory}'
#     files = [f for f in os.listdir(src_dir) if os.path.isfile(os.path.join(src_dir, f))]
#     persist_directory = f'rag_data/custom_db/{user_id}/{input_directory}'
#     t1 = time.perf_counter()
#     try:
#         """split documents into chunks, create embeddings, store embeddings in chromaDB"""
#         print("4......inside chunk_and_embed try statement")
#         chunk_size = 1000
#         chunk_overlap=200
#         # current_dir = os.getcwd()
#         # split_large_pdfs_in_directory(src_dir, 500)
#         # files = [f for f in os.listdir(src_dir) if os.path.isfile(os.path.join(src_dir, f))]
#         print(f"split PDF files")
#         print(os.listdir(src_dir))
#         # for file in files:
#         #     print(f"=========== LOADING: {file} ===========")
#         #     # loader = DirectoryLoader(f'./rag_data/stage_data/{user_id}', glob="./*.pdf", loader_cls=PyPDFLoader)
#         #     loader = PyPDFLoader(f'./rag_data/stage_data/{user_id}/{file}')
#         #     # loader = PyPDFDirectoryLoader(f'./rag_data/stage_data/{user_id}')
#         #     documents = loader.load()
#         #     print(f' =========== number of documents {len(documents)} =========== ')
#         #     #splitting the text into
#         #     text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
#         #     texts = text_splitter.split_documents(documents)
#         #     print(f'=========== number of chunks {len(texts)} ===========')

            
#         #     Chroma.from_documents(documents=texts,
#         #                                     embedding=configs.embedding,
#         #                                     persist_directory=persist_directory)
#         #     os.remove(f'./rag_data/stage_data/{user_id}/{file}')

#             # loader = DirectoryLoader(f'./rag_data/stage_data/{user_id}', glob="./*.pdf", loader_cls=PyPDFLoader)
#             # loader = PyPDFLoader(f'./rag_data/stage_data/{user_id}/{file}')
#         loader = PyPDFDirectoryLoader(f'./rag_data/stage_data/{user_id}')
#         documents = loader.load()
#         print(f' =========== number of documents {len(documents)} =========== ')
#         #splitting the text into
#         text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
#         texts = text_splitter.split_documents(documents)
#         print(f'=========== number of chunks {len(texts)} ===========')
     
#         Chroma.from_documents(documents=texts,
#                                         embedding=configs.embedding,
#                                         persist_directory=persist_directory)

#         t2 = time.perf_counter()
#         print(f'time taken to embed {len(texts)} chunks:',t2-t1)
#         print(f'time taken to embed {len(texts)} chunks:,{(t2-t1)/60} minutes')
#         print(f'time taken to embed {len(texts)} chunks:,{((t2-t1)/60)/60} hours')

#         if not os.path.exists(dst_dir):
#             os.makedirs(dst_dir)

#         if not is_privacy:
#             for file in files:
#                 src_file_path = os.path.join(src_dir, file)
#                 dst_file_path = os.path.join(dst_dir, file)
#                 shutil.move(src_file_path, dst_file_path)
#         else:
#             for file in files:
#                 src_file_path = os.path.join(src_dir, file)
#                 os.remove(src_file_path)

#         print(f"Moved {len(files)} files from {src_dir} to {dst_dir}.")
#         print(f"Files moved: {files}")
#         print("\n".join(files))
#         sql_query = text("""
#                          DELETE FROM running_pipelines 
#                          WHERE uid = :uid AND rag = :rag
#                          """)
#         db.execute(sql_query, {'uid': user_id, 'rag': input_directory})
#         db.commit()
#         return f'time taken to embed {len(texts)} chunks:,{(t2-t1)/60} minutes'
#     except Exception as e:
#         for file in files:
#             src_file_path = os.path.join(src_dir, file)
#             os.remove(src_file_path)
#         print(f"embeddings failed, but still cleaned up staging directory")
#         print(f"ERROR NOOOOOOOO: {e}")
#         sql_query = text("""
#                          DELETE FROM running_pipelines 
#                          WHERE uid = :uid AND rag = :rag
#                          """)
#         db.execute(sql_query, {'uid': user_id, 'rag': input_directory})
#         db.commit()
#         print(f"ERROR NOOOOOOOOO: {e}")

#         # Handle the exception as needed
#     finally:
#         db.close() 
        


# def split_pdf(file_path, max_pages_per_file):
#     with open(file_path, 'rb') as infile:
#         reader = pypdf.PdfReader(infile)
#         total_pages = len(reader.pages)

#         if total_pages <= max_pages_per_file:
#             return  # No need to split

#         start_page = 0
#         num_files = total_pages // max_pages_per_file + (1 if total_pages % max_pages_per_file else 0)

#         for i in range(num_files):
#             writer = pypdf.PdfWriter()
#             end_page = min(start_page + max_pages_per_file, total_pages)

#             for page_number in range(start_page, end_page):
#                 writer.add_page(reader.pages[page_number] )

#             output_file_path = f"{file_path.split('.pdf')[0]}_part_{i + 1}.pdf"

#             with open(output_file_path, 'wb') as outfile:
#                 writer.write(outfile)

#             start_page = end_page

#     os.remove(file_path)

# def split_large_pdfs_in_directory(directory, max_pages_per_file):
#     for filename in os.listdir(directory):
#         if filename.lower().endswith('.pdf'):
#             file_path = os.path.join(directory, filename)
#             split_pdf(file_path, max_pages_per_file)




def privacy_check(user_id, input_directory, is_privacy):
    src_dir = './rag_data/stage_data'
    dst_dir = f'./rag_data/data/{user_id}/{input_directory}'
    if not os.path.exists(dst_dir):
        os.makedirs(dst_dir)

    files = [f for f in os.listdir(src_dir) if os.path.isfile(os.path.join(src_dir, f))]

    for file in files:
        src_file_path = os.path.join(src_dir, file)
        dst_file_path = os.path.join(dst_dir, file)
        shutil.move(src_file_path, dst_file_path)

    print(f"Moved {len(files)} files from {src_dir} to {dst_dir}.")
    print(f"Files moved: {files}")
    print("\n".join(files))
    return 'foo'