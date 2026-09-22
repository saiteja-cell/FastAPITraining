from fastapi import FastAPI
from pydantic import BaseModel
app = FastAPI()
@app.get("/")
def read_root():
    return {"message":"Hello World","number":44,"is_fun":True}
@app.get("/about")
def about():
    return {"page":"About","author":"Teja"}
@app.get("/health")
def health():
    return {"status":"ok"}
#POST Request
@app.post("/create")
def create_something():
    return {"Message": "Created"}

#path parameters 
@app.get("/student/{usn}")
def get_result(usn):
    return {"Result":"Distinction","usn":usn}

#path parameters with Type Hint
@app.get("/candidate/{rollno}")
def get_candidate(rollno:int):
    return {"Result":"Distinction","rollno":rollno,"type":str(type(rollno))}

#PYdantic model
class Item(BaseModel):
    name:str
    price:float
    in_stock:bool =True
@app.post("/items")
def create_item(item:Item):
    return {"received":item,"total_price":item.price*1.18}
