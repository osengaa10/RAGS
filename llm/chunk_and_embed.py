import os
import together
import shutil
import logging
import time
import textwrap
from typing import Any, Dict, List, Mapping, Optional
from fastapi import FastAPI

from pydantic import Extra, Field, root_validator, model_validator

from langchain.callbacks.manager import CallbackManagerForLLMRun
from langchain.llms.base import LLM
from langchain.llms.utils import enforce_stop_tokens
from langchain.utils import get_from_dict_or_env
from langchain.vectorstores import Chroma
from langchain.text_splitter import RecursiveCharacterTextSplitter

from langchain.chains import RetrievalQA
from langchain.document_loaders import TextLoader
from langchain.document_loaders import PyPDFLoader
from langchain.document_loaders import DirectoryLoader
from langchain.embeddings import HuggingFaceBgeEmbeddings
import configs
from sqlalchemy import text
from database import SessionLocal




################################################################################
# split documents into chunks, create embeddings, store embeddings in chromaDB #
################################################################################
def chunk_and_embed(user_id, input_directory, is_privacy):

    db = SessionLocal()
    # """split documents into chunks, create embeddings, store embeddings in chromaDB"""
    # chunk_size = 1000
    # chunk_overlap=200
    # current_dir = os.getcwd()
    # print(f"chunk_and_embed directory==== {current_dir}")
    # loader = DirectoryLoader(f'./rag_data/stage_data/{user_id}', glob="./*.pdf", loader_cls=PyPDFLoader)
    # documents = loader.load()
    # print(f' number of documents {len(documents)}')
    # #splitting the text into
    # text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    # texts = text_splitter.split_documents(documents)
    # print(f' number of chunks {len(texts)}')

    # persist_directory = f'rag_data/custom_db/{user_id}/{input_directory}'
    # t1 = time.perf_counter()
    # Chroma.from_documents(documents=texts,
    #                                 embedding=configs.embedding,
    #                                 persist_directory=persist_directory)
    # t2 = time.perf_counter()
    # print(f'time taken to embed {len(texts)} chunks:',t2-t1)
    # print(f'time taken to embed {len(texts)} chunks:,{(t2-t1)/60} minutes')
    # print(f'time taken to embed {len(texts)} chunks:,{((t2-t1)/60)/60} hours')

    # src_dir = f'./rag_data/stage_data/{user_id}'
    # dst_dir = f'./rag_data/data/{user_id}/{input_directory}'
    # if not os.path.exists(dst_dir):
    #     os.makedirs(dst_dir)

    # files = [f for f in os.listdir(src_dir) if os.path.isfile(os.path.join(src_dir, f))]

    # if not is_privacy:
    #     for file in files:
    #         src_file_path = os.path.join(src_dir, file)
    #         dst_file_path = os.path.join(dst_dir, file)
    #         shutil.move(src_file_path, dst_file_path)
    # else:
    #     for file in files:
    #         src_file_path = os.path.join(src_dir, file)
    #         os.remove(src_file_path)

    # print(f"Moved {len(files)} files from {src_dir} to {dst_dir}.")
    # print(f"Files moved: {files}")
    # print("\n".join(files))
    # sql_query = text("""
    #                     DELETE FROM running_pipelines 
    #                     WHERE uid = :uid AND rag = :rag
    #                     """)
    # db.execute(sql_query, {'uid': user_id, 'rag': input_directory})
    # db.commit()
    # db.close() 
    # return f'time taken to embed {len(texts)} chunks:,{(t2-t1)/60} minutes'
    try:
        """split documents into chunks, create embeddings, store embeddings in chromaDB"""
        chunk_size = 1000
        chunk_overlap=200
        current_dir = os.getcwd()
        print(f"chunk_and_embed directory==== {current_dir}")
        loader = DirectoryLoader(f'./rag_data/stage_data/{user_id}', glob="./*.pdf", loader_cls=PyPDFLoader)
        documents = loader.load()
        print(f' number of documents {len(documents)}')
        #splitting the text into
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
        texts = text_splitter.split_documents(documents)
        print(f' number of chunks {len(texts)}')

        persist_directory = f'rag_data/custom_db/{user_id}/{input_directory}'
        t1 = time.perf_counter()
        Chroma.from_documents(documents=texts,
                                        embedding=configs.embedding,
                                        persist_directory=persist_directory)
        t2 = time.perf_counter()
        print(f'time taken to embed {len(texts)} chunks:',t2-t1)
        print(f'time taken to embed {len(texts)} chunks:,{(t2-t1)/60} minutes')
        print(f'time taken to embed {len(texts)} chunks:,{((t2-t1)/60)/60} hours')

        src_dir = f'./rag_data/stage_data/{user_id}'
        dst_dir = f'./rag_data/data/{user_id}/{input_directory}'
        if not os.path.exists(dst_dir):
            os.makedirs(dst_dir)

        files = [f for f in os.listdir(src_dir) if os.path.isfile(os.path.join(src_dir, f))]

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
        return f'time taken to embed {len(texts)} chunks:,{(t2-t1)/60} minutes'
    except Exception as e:
        db.rollback()  # Rollback in case of an exception
        print(f"Error: {e}")
        # Handle the exception as needed
    finally:
        db.close() 
        







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