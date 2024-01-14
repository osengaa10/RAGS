#!/bin/sh

# echo "Switching to branch master"
# git checkout master

# echo "Building app"
# npm run build

echo "Deploying files to server"
rsync -avP --exclude='ui/node_modules' --exclude='.git' --exclude='ui/node_modules' --exclude='llm/custom_db' --exclude='llm/data' --exclude='llm/rag-env' --exclude='llm/db' --exclude='llm/rags-venv' --exclude='llm/venv' --exclude='llm/rag_data' ./ austin@osenga.me:~/rags

# rsync -avP ./ austin@osenga.me:~./
echo "Deployment complete"