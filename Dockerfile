FROM node:19-slim AS builder

WORKDIR /app

COPY ./package.json package.json

RUN npm i -g parcel\
    && npm install

COPY ./ .

ENV PARCEL_WORKER_BACKEND=process

RUN npm run build

FROM nginx:alpine

# Copy the nginx configuration
COPY  ./docker/default.conf.template /etc/nginx/templates/default.conf.template

# Copy the built react application to the nginx folder
COPY ./dist /usr/share/nginx/html

# Required NGINX env variables
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx/conf.d

# Default env variables
ENV PORT=80
ENV HOST=0.0.0.0
