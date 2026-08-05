FROM node AS build

# Build
COPY . /build/

WORKDIR /build
RUN npm i
RUN npx vite build

# Run
FROM node AS base
COPY --from=build /build/dist /app/
RUN npm i -g http-server
WORKDIR /app/
ENTRYPOINT ["http-server","-p","80","-c-1"]