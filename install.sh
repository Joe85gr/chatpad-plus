#!/bin/bash

set -e

app_name='chatpad-plus'

PORT=2211

while getopts k: flag
do
    case "${flag}" in
        p) PORT=${OPTARG};;
    esac
done


# Removes existing container if exists
docker rm --force $app_name || true

# Build Docker image

docker build -t $app_name:latest -f ./Dockerfile .

# Run Docker container
docker run -d --name $app_name -p ${PORT}:80 $app_name:latest
