FROM node:18

# Set working directory
WORKDIR /app

# Copy package.json & package-lock.json first (for caching)
COPY package*.json /app/

# Install dependencies
RUN npm install

# Copy all frontend code
COPY . /app

# Expose the React dev server port
EXPOSE 3000

# Start React development server
CMD ["npm", "start"]
