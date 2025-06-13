from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pymongo import MongoClient
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from datetime import datetime
import uuid
import json

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# MongoDB connection
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017/')
client = MongoClient(MONGO_URL)
db = client.emergency_platform

# Pydantic models
class EmergencyResource(BaseModel):
    id: str = None
    name: str
    name_he: str
    type: str  # 'generator', 'medical', 'shelter', 'evacuation', 'power_outage', 'supply', 'fire_station', 'police', 'water'
    lat: float
    lng: float
    status: str = 'active'  # 'active', 'inactive', 'maintenance'
    capacity: Optional[int] = None
    description: str = ""
    description_he: str = ""
    contact_phone: Optional[str] = None
    last_updated: str = None
    priority: str = 'medium'  # 'low', 'medium', 'high', 'critical'

class IncidentReport(BaseModel):
    id: str = None
    title: str
    title_he: str
    description: str
    description_he: str
    lat: float
    lng: float
    type: str  # 'fire', 'medical', 'evacuation', 'power', 'other'
    status: str = 'open'  # 'open', 'in_progress', 'resolved'
    priority: str = 'medium'
    reported_by: str = 'anonymous'
    reported_at: str = None

class PowerOutage(BaseModel):
    id: str = None
    area_name: str
    area_name_he: str
    coordinates: List[List[float]]  # polygon coordinates
    estimated_restoration: Optional[str] = None
    affected_population: Optional[int] = None
    status: str = 'active'  # 'active', 'resolved'
    reported_at: str = None

# Sample data initialization
def init_sample_data():
    # Clear existing data
    db.emergency_resources.delete_many({})
    db.incidents.delete_many({})
    db.power_outages.delete_many({})
    
    # Emergency resources sample data
    sample_resources = [
        # Generators
        {"id": str(uuid.uuid4()), "name": "Central Generator Unit", "name_he": "יחידת גנרטור מרכזית", "type": "generator", "lat": 32.0853, "lng": 34.7818, "status": "active", "capacity": 500, "description": "Main backup power for downtown area", "description_he": "כוח גיבוי ראשי לאזור המרכז", "contact_phone": "03-1234567", "priority": "high"},
        {"id": str(uuid.uuid4()), "name": "Hospital Backup Generator", "name_he": "גנרטור גיבוי בית חולים", "type": "generator", "lat": 32.0808, "lng": 34.7805, "status": "active", "capacity": 300, "description": "Emergency power for medical facilities", "description_he": "כוח חירום למתקנים רפואיים", "contact_phone": "03-2345678", "priority": "critical"},
        {"id": str(uuid.uuid4()), "name": "North Generator Station", "name_he": "תחנת גנרטור צפון", "type": "generator", "lat": 32.7940, "lng": 34.9896, "status": "active", "capacity": 400, "description": "Northern district emergency power", "description_he": "כוח חירום למחוז הצפוני", "contact_phone": "04-3456789", "priority": "high"},
        {"id": str(uuid.uuid4()), "name": "South Generator Hub", "name_he": "מרכז גנרטור דרום", "type": "generator", "lat": 31.2518, "lng": 34.7915, "status": "maintenance", "capacity": 250, "description": "Southern region backup power", "description_he": "כוח גיבוי לאזור הדרום", "contact_phone": "08-4567890", "priority": "medium"},
        {"id": str(uuid.uuid4()), "name": "Industrial Generator", "name_he": "גנרטור תעשייתי", "type": "generator", "lat": 31.8927, "lng": 34.8077, "status": "active", "capacity": 600, "description": "Industrial zone emergency power", "description_he": "כוח חירום לאזור התעשייה", "contact_phone": "02-5678901", "priority": "high"},
        
        # Medical facilities
        {"id": str(uuid.uuid4()), "name": "Ichilov Hospital", "name_he": "בית חולים איכילוב", "type": "medical", "lat": 32.0853, "lng": 34.7818, "status": "active", "capacity": 500, "description": "Major medical center", "description_he": "מרכז רפואי מרכזי", "contact_phone": "03-6974444", "priority": "critical"},
        {"id": str(uuid.uuid4()), "name": "Hadassah Medical Center", "name_he": "המרכז הרפואי הדסה", "type": "medical", "lat": 31.7683, "lng": 35.1370, "status": "active", "capacity": 800, "description": "Leading medical facility", "description_he": "מתקן רפואי מוביל", "contact_phone": "02-6777111", "priority": "critical"},
        {"id": str(uuid.uuid4()), "name": "Rambam Health Care Campus", "name_he": "קמפוס הבריאות רמב\"ם", "type": "medical", "lat": 32.7940, "lng": 34.9896, "status": "active", "capacity": 600, "description": "Northern medical hub", "description_he": "מרכז רפואי צפוני", "contact_phone": "04-7772888", "priority": "critical"},
        {"id": str(uuid.uuid4()), "name": "Soroka Medical Center", "name_he": "המרכז הרפואי סורוקה", "type": "medical", "lat": 31.2518, "lng": 34.7915, "status": "active", "capacity": 400, "description": "Southern region medical center", "description_he": "מרכז רפואי באזור הדרום", "contact_phone": "08-6400111", "priority": "critical"},
        {"id": str(uuid.uuid4()), "name": "Emergency Clinic Center", "name_he": "מרכז מרפאת חירום", "type": "medical", "lat": 32.0808, "lng": 34.7805, "status": "active", "capacity": 100, "description": "24/7 emergency clinic", "description_he": "מרפאת חירום 24/7", "contact_phone": "03-1112222", "priority": "high"},
        
        # Shelters
        {"id": str(uuid.uuid4()), "name": "Central Shelter Complex", "name_he": "מתחם מקלט מרכזי", "type": "shelter", "lat": 32.0665, "lng": 34.7748, "status": "active", "capacity": 1000, "description": "Main emergency shelter", "description_he": "מקלט חירום ראשי", "contact_phone": "03-9998888", "priority": "critical"},
        {"id": str(uuid.uuid4()), "name": "School Emergency Shelter", "name_he": "מקלט חירום בבית ספר", "type": "shelter", "lat": 32.0753, "lng": 34.7888, "status": "active", "capacity": 300, "description": "School converted to shelter", "description_he": "בית ספר שהוסב למקלט", "contact_phone": "03-7776666", "priority": "high"},
        {"id": str(uuid.uuid4()), "name": "Community Center Shelter", "name_he": "מקלט במרכז קהילתי", "type": "shelter", "lat": 31.7683, "lng": 35.1370, "status": "active", "capacity": 200, "description": "Community emergency shelter", "description_he": "מקלט חירום קהילתי", "contact_phone": "02-5554444", "priority": "medium"},
        {"id": str(uuid.uuid4()), "name": "Underground Shelter", "name_he": "מקלט תת קרקעי", "type": "shelter", "lat": 32.7940, "lng": 34.9896, "status": "active", "capacity": 500, "description": "Underground emergency shelter", "description_he": "מקלט חירום תת קרקעי", "contact_phone": "04-3332222", "priority": "high"},
        {"id": str(uuid.uuid4()), "name": "Sports Hall Shelter", "name_he": "מקלט באולם ספורט", "type": "shelter", "lat": 31.2518, "lng": 34.7915, "status": "active", "capacity": 400, "description": "Sports facility emergency shelter", "description_he": "מקלט חירום במתקן ספורט", "contact_phone": "08-1119999", "priority": "medium"},
        
        # Fire stations
        {"id": str(uuid.uuid4()), "name": "Central Fire Station", "name_he": "תחנת כיבוי מרכזית", "type": "fire_station", "lat": 32.0853, "lng": 34.7818, "status": "active", "capacity": 20, "description": "Main fire and rescue station", "description_he": "תחנת כיבוי והצלה ראשית", "contact_phone": "102", "priority": "critical"},
        {"id": str(uuid.uuid4()), "name": "North Fire Station", "name_he": "תחנת כיבוי צפון", "type": "fire_station", "lat": 32.7940, "lng": 34.9896, "status": "active", "capacity": 15, "description": "Northern fire station", "description_he": "תחנת כיבוי צפונית", "contact_phone": "102", "priority": "high"},
        {"id": str(uuid.uuid4()), "name": "South Fire Station", "name_he": "תחנת כיבוי דרום", "type": "fire_station", "lat": 31.2518, "lng": 34.7915, "status": "active", "capacity": 12, "description": "Southern fire station", "description_he": "תחנת כיבוי דרומית", "contact_phone": "102", "priority": "high"},
        
        # Police stations
        {"id": str(uuid.uuid4()), "name": "Central Police Station", "name_he": "תחנת משטרה מרכזית", "type": "police", "lat": 32.0808, "lng": 34.7805, "status": "active", "capacity": 50, "description": "Main police headquarters", "description_he": "מטה המשטרה הראשי", "contact_phone": "100", "priority": "critical"},
        {"id": str(uuid.uuid4()), "name": "District Police Station", "name_he": "תחנת משטרה מחוזית", "type": "police", "lat": 31.7683, "lng": 35.1370, "status": "active", "capacity": 30, "description": "District police station", "description_he": "תחנת משטרה מחוזית", "contact_phone": "100", "priority": "high"},
        
        # Supply points
        {"id": str(uuid.uuid4()), "name": "Emergency Supply Center", "name_he": "מרכז אספקה לחירום", "type": "supply", "lat": 32.0753, "lng": 34.7888, "status": "active", "capacity": 1000, "description": "Food and medical supplies", "description_he": "מזון ואספקה רפואית", "contact_phone": "03-4445555", "priority": "high"},
        {"id": str(uuid.uuid4()), "name": "Water Distribution Point", "name_he": "נקודת חלוקת מים", "type": "water", "lat": 32.0665, "lng": 34.7748, "status": "active", "capacity": 2000, "description": "Emergency water distribution", "description_he": "חלוקת מים לחירום", "contact_phone": "03-6667777", "priority": "critical"},
        {"id": str(uuid.uuid4()), "name": "Mobile Supply Unit", "name_he": "יחידת אספקה נייד", "type": "supply", "lat": 31.8927, "lng": 34.8077, "status": "active", "capacity": 500, "description": "Mobile emergency supplies", "description_he": "אספקת חירום נייד", "contact_phone": "02-8889999", "priority": "medium"},
    ]
    
    # Insert sample resources
    for resource in sample_resources:
        if resource.get('last_updated') is None:
            resource['last_updated'] = datetime.now().isoformat()
        db.emergency_resources.insert_one(resource)
    
    # Sample power outages
    sample_outages = [
        {
            "id": str(uuid.uuid4()),
            "area_name": "Downtown Tel Aviv",
            "area_name_he": "מרכز תל אביב",
            "coordinates": [[32.0853, 34.7818], [32.0753, 34.7818], [32.0753, 34.7918], [32.0853, 34.7918]],
            "estimated_restoration": "2025-03-15T18:00:00",
            "affected_population": 15000,
            "status": "active",
            "reported_at": datetime.now().isoformat()
        },
        {
            "id": str(uuid.uuid4()),
            "area_name": "North Jerusalem",
            "area_name_he": "ירושלים צפון",
            "coordinates": [[31.7783, 35.1270], [31.7683, 35.1270], [31.7683, 35.1470], [31.7783, 35.1470]],
            "estimated_restoration": "2025-03-15T20:00:00",
            "affected_population": 8000,
            "status": "active",
            "reported_at": datetime.now().isoformat()
        }
    ]
    
    for outage in sample_outages:
        db.power_outages.insert_one(outage)
    
    print("Sample data initialized successfully!")

# Initialize sample data on startup
@app.on_event("startup")
async def startup_event():
    init_sample_data()

# API Routes
@app.get("/api/resources")
async def get_resources(type: Optional[str] = None):
    query = {}
    if type:
        query["type"] = type
    
    resources = list(db.emergency_resources.find(query, {"_id": 0}))
    return {"resources": resources}

@app.get("/api/resources/{resource_id}")
async def get_resource(resource_id: str):
    resource = db.emergency_resources.find_one({"id": resource_id}, {"_id": 0})
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@app.post("/api/resources")
async def create_resource(resource: EmergencyResource):
    resource.id = str(uuid.uuid4())
    resource.last_updated = datetime.now().isoformat()
    db.emergency_resources.insert_one(resource.dict())
    return resource

@app.put("/api/resources/{resource_id}")
async def update_resource(resource_id: str, resource: EmergencyResource):
    resource.last_updated = datetime.now().isoformat()
    result = db.emergency_resources.update_one(
        {"id": resource_id}, 
        {"$set": resource.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource

@app.get("/api/incidents")
async def get_incidents():
    incidents = list(db.incidents.find({}, {"_id": 0}))
    return {"incidents": incidents}

@app.post("/api/incidents")
async def create_incident(incident: IncidentReport):
    incident.id = str(uuid.uuid4())
    incident.reported_at = datetime.now().isoformat()
    db.incidents.insert_one(incident.dict())
    return incident

@app.get("/api/power-outages")
async def get_power_outages():
    outages = list(db.power_outages.find({}, {"_id": 0}))
    return {"outages": outages}

@app.post("/api/power-outages")
async def create_power_outage(outage: PowerOutage):
    outage.id = str(uuid.uuid4())
    outage.reported_at = datetime.now().isoformat()
    db.power_outages.insert_one(outage.dict())
    return outage

@app.get("/api/statistics")
async def get_statistics():
    total_resources = db.emergency_resources.count_documents({})
    active_resources = db.emergency_resources.count_documents({"status": "active"})
    open_incidents = db.incidents.count_documents({"status": "open"})
    active_outages = db.power_outages.count_documents({"status": "active"})
    
    return {
        "total_resources": total_resources,
        "active_resources": active_resources,
        "open_incidents": open_incidents,
        "active_outages": active_outages
    }

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)