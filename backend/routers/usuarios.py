from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import List
import bcrypt
from jose import JWTError, jwt
from datetime import datetime, timedelta
from database import database
from models import usuarios, RolEnum
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

SECRET_KEY = "your_secret_key_here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="usuarios/token")

router = APIRouter()

class UserBase(BaseModel):
    nombre: str
    correo: EmailStr
    rol: RolEnum = RolEnum.vendedor

class UserCreate(UserBase):
    contrasena: str

class UserOut(UserBase):
    id: int
    fecha_creacion: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verificar contraseña usando bcrypt"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password: str) -> str:
    """Hash de contraseña usando bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def get_user_by_email(email: str):
    query = usuarios.select().where(usuarios.c.correo == email)
    user = await database.fetch_one(query)
    return user

async def authenticate_user(email: str, password: str):
    user = await get_user_by_email(email)
    if not user:
        return False
    if not verify_password(password, user["contrasena"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = await get_user_by_email(email)
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserOut)
async def register_user(user: UserCreate):
    existing_user = await get_user_by_email(user.correo)
    if existing_user:
        raise HTTPException(status_code=400, detail="Correo ya registrado")
    hashed_password = get_password_hash(user.contrasena)
    query = usuarios.insert().values(
        nombre=user.nombre,
        correo=user.correo,
        contrasena=hashed_password,
        rol=user.rol
    )
    user_id = await database.execute(query)
    return {**user.dict(), "id": user_id, "fecha_creacion": datetime.utcnow()}

@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user["correo"]})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserOut)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[UserOut])
async def get_users(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "administrador":
        raise HTTPException(status_code=403, detail="No tienes permisos para ver usuarios")
    query = usuarios.select()
    users = await database.fetch_all(query)
    return users

@router.put("/{user_id}")
async def update_user(user_id: int, user_data: dict, current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "administrador":
        raise HTTPException(status_code=403, detail="No tienes permisos para editar usuarios")
    
    query = usuarios.update().where(usuarios.c.id == user_id).values(**user_data)
    await database.execute(query)
    return {"message": "Usuario actualizado exitosamente"}

@router.delete("/{user_id}")
async def delete_user(user_id: int, current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "administrador":
        raise HTTPException(status_code=403, detail="No tienes permisos para eliminar usuarios")
    
    query = usuarios.delete().where(usuarios.c.id == user_id)
    await database.execute(query)
    return {"message": "Usuario eliminado exitosamente"}
