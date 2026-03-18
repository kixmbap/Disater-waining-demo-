from fastapi import FastAPI, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import json
import os
import time

app = FastAPI(title='BCI Disaster Real-time API')

DATA_PATH = os.path.join(os.path.dirname(__file__), '..', 'data', 'real_data.json')

class RealTimeDataRequest(BaseModel):
    force_refresh: bool = False

@app.get('/api/realtime')
async def get_realtime_data():
    """Return latest event data from real_data.json file"""
    if not os.path.exists(DATA_PATH):
        raise HTTPException(status_code=404, detail='real_data.json not found')

    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # For demo we can convert to a compact high-priority event feed
    return JSONResponse(content={'timestamp': time.time(), 'count': len(data), 'events': data})

@app.post('/api/realtime/refresh')
async def refresh_realtime_data(req: RealTimeDataRequest):
    """Optional refresh path to trigger data regeneration via Python script."""
    # This endpoint is just for demonstration purposes in local demo
    try:
        # run fetch_real_data by Python process if requested
        if req.force_refresh:
            import subprocess
            subprocess.run(['python', os.path.join(os.path.dirname(__file__), 'fetch_real_data.py')], check=True)
        return JSONResponse(content={'status': 'ok'})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
