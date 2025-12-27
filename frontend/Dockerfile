# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Kopiraj package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Kopiraj source
COPY . .

# Build argument za backend URL - MORA SE POSTAVITI PRILIKOM BUILDA!
# Primjer: docker build --build-arg REACT_APP_BACKEND_URL=https://your-domain.com -t frontend .
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=${REACT_APP_BACKEND_URL:-}

# Provjeri da je URL postavljen
RUN if [ -z "$REACT_APP_BACKEND_URL" ]; then \
      echo "ERROR: REACT_APP_BACKEND_URL must be set!"; \
      echo "Use: docker build --build-arg REACT_APP_BACKEND_URL=https://your-domain.com ..."; \
      exit 1; \
    fi

# Build aplikaciju
RUN yarn build

# Production stage
FROM nginx:alpine

# Kopiraj build
COPY --from=build /app/build /usr/share/nginx/html

# Kopiraj nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
