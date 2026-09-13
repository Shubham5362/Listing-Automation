from fastapi import FastAPI

app = FastAPI(
    title="Personal AI Seller Hub API",
    version="0.1.0",
    description="Private Amazon + Flipkart seller operations backend.",
)


@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok"}
