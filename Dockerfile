FROM node:16-alpine as frontend-build

WORKDIR /app/frontend
COPY ./frontend/package*.json ./
RUN npm ci
COPY ./frontend ./
RUN npm run build

FROM node:16-alpine

WORKDIR /app

# Copy backend files
COPY ./backend/package*.json ./
RUN npm ci --production
COPY ./backend ./

# Copy the frontend build
COPY --from=frontend-build /app/frontend/build ./public

# Define NIXPACKS_PATH to prevent undefined variable warning
ENV NIXPACKS_PATH=/app/nixpacks

# If the variable is used in a command, ensure it's properly defined before use
RUN if [ -z "${NIXPACKS_PATH}" ]; then \
    echo "NIXPACKS_PATH is not set, using default" && \
    export NIXPACKS_PATH=/app/nixpacks; \
  fi

# Remove reference to undefined variable and use a proper path
# The NIXPACKS_PATH variable was undefined, so we're using a standard path instead
# ENV NIXPACKS_PATH=/app
# COPY $NIXPACKS_PATH/start.sh /app/start.sh
COPY ./start.sh /app/start.sh
RUN chmod +x ./start.sh

EXPOSE 5000

CMD ["./start.sh"]
