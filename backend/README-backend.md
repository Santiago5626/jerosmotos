# Backend Setup for Jeros'Motos

## Prerequisites
- Python 3.8+
- MySQL server running and accessible
- Git (optional)

## Setup Steps

1. Clone the repository (if not already done):
```
git clone <repo-url>
cd jerosmotos/backend
```

2. Create and activate a virtual environment:
```
python -m venv venv
# Windows
venv\Scripts\activate
# Linux/macOS
source venv/bin/activate
```

3. Install dependencies:
```
pip install -r requirements.txt
```

4. Configure the database connection:
- Edit the `DATABASE_URL` environment variable or modify `backend/database.py` to set your MySQL connection string.
- Example:
```
mysql+mysqlconnector://user:password@localhost/jerosmotos
```

5. Create the database tables:
- Use Alembic or run the following Python script to create tables:
```python
from database import engine, metadata
metadata.create_all(engine)
```

6. Run the FastAPI server:
```
uvicorn main:app --reload
```

7. Access the API docs at:
```
http://localhost:8000/docs
```

## Notes
- Update the `SECRET_KEY` in `routers/usuarios.py` for JWT token security.
- Implement additional authentication and authorization as needed.
- Frontend setup is in the `frontend` directory (to be created).
