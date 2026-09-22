from fastapi import FastAPI
from pymongo import AsyncMongoClient
app=FastAPI()
client = AsyncMongoClient("mongodb://localhost:27017/")
db=client["college"]

#Select Collection
student_collection = db["student"]
@app.get("/")
async def home():
    return{
        "message":"FastAPI with Mongo is running"

    }
@app.get("/health")
async def health():
    result=await db.command("ping")
    return{"mongdb":"Connected", "ping":result["ok"]}
