FROM node:20-alpine AS BUILD_IMAGE

ARG CUSTOM_MODULES="default"

WORKDIR /app

RUN apk update && apk add git

COPY  ./*.json ./yarn.lock ./

COPY patches ./patches

RUN yarn install --frozen-lockfile --production

RUN yarn postinstall

COPY ./src ./src
COPY ./*.js ./

RUN CUSTOM_MODULES=${CUSTOM_MODULES} yarn build:node && yarn build:files && yarn build:bundler


FROM gcr.io/distroless/nodejs20-debian11

ARG CUSTOM_MODULES="default"

ENV NODE_PATH="build/modules/${CUSTOM_MODULES}:build/"

COPY --from=BUILD_IMAGE /app/.gvars.json /app/.gvars.json
COPY --from=BUILD_IMAGE /app/build /app/build
COPY ./public /app/public
COPY --from=BUILD_IMAGE /app/public/bundles /app/public/bundles
COPY --from=BUILD_IMAGE /app/node_modules /app/node_modules

WORKDIR /app
COPY ./views ./views

USER 1000

ARG BUILDTIME
ARG COMMITHASH
ENV BUILDTIME ${BUILDTIME}
ENV COMMITHASH ${COMMITHASH}

CMD ["-r", "./build/server/tracing.js", "./build/server/server.js"]
