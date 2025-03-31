# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy app source code
COPY . .

# Add verification step before build
RUN ls -la /app/src && \
    test -f /app/src/reportWebVitals.js || echo "ERROR: reportWebVitals.js is missing!"

# Build the app - setting CI=false to prevent treating warnings as errors
ENV CI=false
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Make sure service worker is served from root
WORKDIR /usr/share/nginx/html

# Create a health check file
RUN echo "OK" > health.txt

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
