import os
import together
import textwrap
from typing import Any, Dict
import json
from pydantic import Extra
from langchain.llms.base import LLM
from langchain.utils import get_from_dict_or_env
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.embeddings import HuggingFaceBgeEmbeddings
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationBufferMemory, ConversationSummaryMemory
from langchain.chains.conversation.memory import ConversationKGMemory
import configs


## Default LLaMA-2 prompt style
B_INST, E_INST = "[INST]", "[/INST]"
B_SYS, E_SYS = "<<SYS>>\n", "\n<</SYS>>\n\n"
# DEFAULT_SYSTEM_PROMPT = """You have 30 years of experience as both a professor of medicine and a highly esteemed researcher in human genetic engineering. Your goal is to invent novel treatments for human cancers.
# Always answer as helpfully as possible using the context text provided. 
# If a question does not make any sense, or is not factually coherent, provide what information is needed for the question to be answered. If you don't know the answer to a question, please don't share false information.
# Your superior logic and reasoning abilities coupled with you vast knowledge in biology, genetics, and medicine allow you to conduct innovative experiments resulting in significant advancements in medicine.
# """

DEFAULT_SYSTEM_PROMPT = """You have 30 years experience as both a practicing oncologist and professor of medicine.
Always anwser the question as helpfully as possible, or provide a treatment regimen as detailed as possible using the context text provided. 
The treatment regimen should specify dosages, timelines and enough information colleagues to begin treatment. 
If you don't know the answer to a question, please don't share false information.


"""

instruction = """CONTEXT:/n/n {context}/n

Question: {question}"""



def get_prompt(instruction, new_system_prompt=DEFAULT_SYSTEM_PROMPT ):
    SYSTEM_PROMPT = B_SYS + new_system_prompt + E_SYS
    prompt_template =  B_INST + SYSTEM_PROMPT + instruction + E_INST
    return prompt_template

get_prompt(instruction, DEFAULT_SYSTEM_PROMPT)

prompt_template = get_prompt(instruction, DEFAULT_SYSTEM_PROMPT)

llama_prompt = PromptTemplate(
    template=prompt_template, input_variables=["context", "question", "chat_history"]
)


chain_type_kwargs = {"prompt": llama_prompt}

memory = ConversationBufferMemory(memory_key="chat_history", input_key='query', output_key='result', return_messages=True)


def extract_up_to_number(s):
    for i, char in enumerate(s):
        if char.isdigit():
            return s[:i]
    return s  # Return the entire string if no number is found



def create_chain(input_directory):
    """create the chain to answer questions"""
    prompt_specialist = input_directory
    if input_directory == 'db':
        prompt_specialist = 'oncology'

    prompt_specialist = extract_up_to_number(input_directory)

    PARAMETERIZED_SYSTEM_PROMPT = f"""You have 30 years experience practicing {prompt_specialist}.
    Always anwser the question as helpfully as possible, or provide a detailed treatment regimen using the context text provided. 
    The treatment regimen should specify medication dosages, timelines and enough information colleagues to begin treatment. 
    If you don't know the answer to a question, please don't share false information.
    
    """

    instruction = """CONTEXT:/n/n {context}/n

    Question: {question}"""

    SYSTEM_PROMPT = B_SYS + PARAMETERIZED_SYSTEM_PROMPT + E_SYS
    prompt_template =  B_INST + SYSTEM_PROMPT + instruction + E_INST
    llama_prompt = PromptTemplate(
        template=prompt_template, input_variables=["context", "question", "chat_history"]
    )
    persist_directory = f'custom_db/{input_directory}'
    chain_type_kwargs = {"prompt": llama_prompt}
    vectordb = Chroma(embedding_function=configs.embedding,persist_directory=persist_directory)
    retriever = vectordb.as_retriever(search_type="mmr", search_kwargs={"k": 7})
    return RetrievalQA.from_chain_type(llm=configs.llm,
                                        chain_type="stuff",
                                        retriever=retriever,
                                        chain_type_kwargs=chain_type_kwargs,
                                        return_source_documents=True,
                                        verbose=True,
                                        memory=memory)



def create_evaluation_chain(input_directory='none'):
    """create the chain to answer questions"""
    prompt_specialist = input_directory
    if input_directory == 'db':
        prompt_specialist = 'oncology'

    prompt_specialist = extract_up_to_number(input_directory)

    EVALUATION_SYSTEM_PROMPT = f"""You have 30 years experience practicing oncology.
    Your job is to compare a correct Control Treatment plan to either multiple following treatments or supporting texts.
    The "Control Treatment" will always come first, followed by TREATMENT 1:, TREATMENT 2:, TREATMENT 3:, etc.
    You need to identify which of the treatments is the most like the "Control Treatment".
    If you don't know the answer to a question, please don't share false information.
    
    """

    instruction = """CONTEXT:/n/n {context}/n

    Question: {question}"""

    SYSTEM_PROMPT = B_SYS + EVALUATION_SYSTEM_PROMPT + E_SYS
    prompt_template =  B_INST + SYSTEM_PROMPT + instruction + E_INST
    llama_prompt = PromptTemplate(
        template=prompt_template, input_variables=["context", "question", "chat_history"]
    )
    persist_directory = f'custom_db/{input_directory}'
    chain_type_kwargs = {"prompt": llama_prompt}
    vectordb = Chroma(embedding_function=configs.embedding,persist_directory=persist_directory)
    retriever = vectordb.as_retriever(search_type="mmr", search_kwargs={"k": 7})
    return RetrievalQA.from_chain_type(llm=configs.llm,
                                        chain_type="stuff",
                                        retriever=retriever,
                                        chain_type_kwargs=chain_type_kwargs,
                                        return_source_documents=True,
                                        verbose=True,
                                        memory=memory)



## Cite sources
def wrap_text_preserve_newlines(text, width=110):
    # Split the input text into lines based on newline characters
    lines = text.split('\n')
    # Wrap each line individually
    wrapped_lines = [textwrap.fill(line, width=width) for line in lines]
    # Join the wrapped lines back together using newline characters
    wrapped_text = '\n'.join(wrapped_lines)
    return wrapped_text

def process_llm_response(llm_response):
    return llm_response['result']

query = "A 65-year-old woman is diagnosed with metastatic bladder cancer. She has a history of hypertension and chronic kidney disease with baseline creatinine of 2. Programmed death-ligand 1 (PD-L1) score is <1% and she has a FGFR2 mutation on next-generation sequencing. What is the appropriate first-line treatment?"

# A 65-year-old woman is diagnosed with metastatic bladder cancer. She has a history of hypertension and chronic kidney disease with baseline creatinine of 2. Programmed death-ligand 1 (PD-L1) score is <1% and she has a FGFR2 mutation on next-generation sequencing. What is the appropriate first-line treatment?

def read_json_file(file_path):
    with open(file_path, 'r') as file:
        return json.load(file)