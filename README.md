# API Health Monitor

A self-hosted uptime monitoring tool that periodically pings your APIs and websites and records whether they are up or down. Built with React, Node.js, and MongoDB - fully containerized with Docker.

---

## What the App Does

Users sign up, add URLs they want to monitor, and the app automatically pings those URLs every 5 minutes. The dashboard shows the current status, response time, and uptime percentage for each monitored endpoint. Data persists across container restarts via a Docker named volume.

The focus of this project was not the application itself - it was to learn Docker and CI/CD by implementing them in a production-style containerized setup.

---

## Docker Architecture

The application runs as five isolated containers, all managed by Docker Compose:

```
┌─────────────────────────────────────────────┐
│                   User                      │
└─────────────────┬───────────────────────────┘
                  │ port 80
┌─────────────────▼───────────────────────────┐
│              Nginx (Reverse Proxy)          │
│  /        → React Frontend (client:5173)    │
│  /api/    → Node Backend   (server:5000)    │
└─────────────────────────────────────────────┘
         │                           │
┌────────▼──────┐          ┌─────────▼────────┐
│ React + Clerk │          │  Express + Cron  │
│  (Frontend)   │          │    (Backend)     │
└───────────────┘          └─────────┬────────┘
                                     │
                           ┌─────────▼────────┐
                           │    MongoDB       │
                           │   (Persistent    │
                           │   via Volume)    │
                           └──────────────────┘
```

| Container     | Image                   | Role                                           |
|---------------|-------------------------|------------------------------------------------|
| nginx         | nginx:alpine            | Reverse proxy - single entry point on port 80  |
| client        | Custom (node:20-alpine) | React frontend served via Vite                 |
| server        | Custom (node:18-alpine) | Express REST API + background ping scheduler   |
| mongo         | mongo:latest            | Database with named volume for persistence     |
| mongo-express | mongo-express:1.0.2-20  | Visual database GUI accessible on port 8081    |

### Key Docker Concepts Demonstrated

- **Reverse Proxy with Nginx** - Only Nginx is exposed on port 80. It routes `/api/` requests to the backend and everything else to the frontend. The client and server containers are never directly accessible from outside.

- **Named Volumes** - MongoDB data is stored in a named volume (`mongo_data`) outside any container, so data survives container restarts and removals. Only `docker compose down -v` deletes it.

- **Custom Bridge Network** - All containers talk to each other over a private Docker network using service names (e.g., `mongodb://mongo:27017`) instead of IP addresses.

- **Bind Mounts for Hot Reload** - In development, source code folders are mounted into containers as volumes. File changes on the host machine reflect inside the container instantly, no rebuild needed.

- **Multi-container Orchestration** - Docker Compose manages startup order, networking, environment variables, and port bindings for all five services with a single command.

- **Dev and Prod Compose Files** - `docker-compose.yml` builds images from source for development. `docker-compose.prod.yml` pulls pre-built images from Docker Hub for running the app without the source code.

- **CI/CD Pipeline** - GitHub Actions builds and pushes both Docker images to Docker Hub automatically on every push to `main`.

---

## Running the App

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- [Git](https://git-scm.com/)

No Node.js, no MongoDB, and no other dependencies need to be installed on your machine.

### Who Are You?

Choose the section that applies to you:

- [I want to run the app](#option-1---production-mode-pre-built-images-from-docker-hub)
- [I want to develop and edit the code](#option-2---development-mode-builds-from-source-hot-reload-enabled)

### Option 1 - Production Mode (pre-built images from Docker Hub)

**Step 1 - Clone the repo**
```bash
git clone https://github.com/yourusername/api-health-monitor.git
cd api-health-monitor
```

**Step 2 - Create your `.env` file**
```bash
cp .env.example .env
```

Then open `.env` and fill in your Clerk keys:
```env
MONGO_URI=mongodb://mongo:27017/apihealthmonitor
PORT=5000
CLERK_SECRET_KEY=your_clerk_secret_key_here
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key_here
```

> 🔑 Get your Clerk keys from [clerk.com](https://clerk.com) - it's free. Create an app and copy the API keys from the dashboard.

**Step 3 - Run it**
```bash
docker compose -f docker-compose.prod.yml up
```

That's it. Docker will pull all images and start everything automatically.

**Step 4 - Open the app**

| URL | What it is |
|-----|------------|
| `http://localhost` | The app |
| `http://localhost:8081` | MongoDB GUI (Mongo Express) |

---

### Option 2 - Development Mode (builds from source, hot reload enabled)


This builds everything from source. Edit any file and the browser updates instantly - no rebuilding needed.

**Step 1 - Clone the repo**
```bash
git clone https://github.com/yourusername/api-health-monitor.git
cd api-health-monitor
```

**Step 2 - Create your `.env` file**
```bash
cp .env.example .env
```

**Fill in your Clerk keys (same as above).**


**Step 3 - Build and run**
```bash
docker compose up --build
```

**Step 4 - Start editing**

Edit any file inside `client/src/` or `server/src/` and changes reflect immediately in the browser. You don't need Node.js installed - everything runs inside Docker.

**Step 5 - Open the app**

| URL | What it is |
|-----|------------|
| `http://localhost` | The app |
| `http://localhost:8081` | MongoDB GUI (Mongo Express) |

---

## Useful Commands

```bash
# Start in development mode
docker compose up --build

# Start in production mode
docker compose -f docker-compose.prod.yml up

# Stop all containers (data is preserved)
docker compose down

# Stop all containers and delete all data
docker compose down -v

# View logs for a specific container
docker compose logs server
docker compose logs client

# Rebuild a single service without restarting others
docker compose up --build server
```

---

## Closing Note

This project was built as a hands-on way to learn Docker and CI/CD. The application itself is simple by design - the goal was to focus on containerization, multi-container orchestration, and automating the build pipeline, not on building a feature-rich product.