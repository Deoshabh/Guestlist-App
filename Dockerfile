# Use an official Node runtime as the base image
FROM node:16 as build

# Set the working directory in the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm run build

# Use a smaller base image for the production environment
FROM nginx:alpine

# Copy the build output to the nginx server
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Remove reference to undefined variable $NIXPACKS_PATH
# If you need this variable, define it using ENV directive
# ENV NIXPACKS_PATH=/path/to/nixpacks

# Start NGINX server
CMD ["nginx", "-g", "daemon off;"]
