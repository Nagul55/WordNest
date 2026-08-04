import uvicorn

if __name__ == "__main__":
    print("Starting WordNest FastAPI Server on port 8000...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
