# D&D Note Keeper

A fullstack app for managing D&D session notes, NPCs, loot, and more. Built with React (frontend) and Python (backend).

## Features

- Structured and free-form session notes
- Track combat, roleplay, loot, and NPCs
- Export session data as JSON
- User authentication

## Local Development

### Prerequisites

- Node.js (v18+ recommended)
- Yarn (or npm)
- Python 3.9+
- [Poetry](https://python-poetry.org/) for backend dependencies
- MongoDB (local or Docker)
- (Optional) Docker & Docker Compose

### Environment Variables

Copy `.env.example` to `.env` and adjust as needed.

#### Frontend

Edit `frontend/.env`:

```
REACT_APP_BACKEND_URL=http://localhost:8001
```

#### Backend

Set up your backend `.env` as needed for DB connection, etc.

### Install & Run

#### Backend

```sh
cd backend
poetry install
poetry run uvicorn main:app --reload --host 0.0.0.0 --port 8001
```

#### Frontend

```sh
cd frontend
yarn install
yarn start
```

The frontend will run on [http://localhost:3000](http://localhost:3000).

### Docker (Optional)

You can use the provided `Dockerfile` and `.devcontainer` for a containerized dev environment.

```sh
docker build -t dndnotes .
docker run -p 3000:3000 -p 8001:8001 dndnotes
```

Or use VS Code Dev Containers for a ready-to-go environment.

### Testing

- Backend: Run tests in `backend_test.py`
- Frontend: `yarn test`

## Troubleshooting

- Ensure MongoDB is running locally or update the backend config for your DB.
- Check `.env` files for correct URLs and credentials.

## License

MIT (or your license here)