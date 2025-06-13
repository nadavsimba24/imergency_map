import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon } from 'react-leaflet';
import L from 'leaflet';
import './App.css';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different resource types
const createIcon = (color, icon) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin marker-${color}">
             <i class="fas fa-${icon}"></i>
           </div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
    popupAnchor: [0, -42]
  });
};

const resourceIcons = {
  generator: createIcon('orange', 'bolt'),
  medical: createIcon('red', 'plus'),
  shelter: createIcon('blue', 'shield-alt'),
  fire_station: createIcon('red', 'fire'),
  police: createIcon('navy', 'shield'),
  supply: createIcon('green', 'box'),
  water: createIcon('cyan', 'tint'),
  evacuation: createIcon('purple', 'route')
};

const priorityColors = {
  critical: '#dc2626',
  high: '#f59e0b',
  medium: '#10b981',
  low: '#6b7280'
};

// Static data - Emergency resources
const emergencyResources = [
  // Generators
  { id: "gen-1", name: "Central Generator Unit", name_he: "יחידת גנרטור מרכזית", type: "generator", lat: 32.0853, lng: 34.7818, status: "active", capacity: 500, description: "Main backup power for downtown area", description_he: "כוח גיבוי ראשי לאזור המרכז", contact_phone: "03-1234567", priority: "high", last_updated: "2025-03-15T10:00:00" },
  { id: "gen-2", name: "Hospital Backup Generator", name_he: "גנרטור גיבוי בית חולים", type: "generator", lat: 32.0808, lng: 34.7805, status: "active", capacity: 300, description: "Emergency power for medical facilities", description_he: "כוח חירום למתקנים רפואיים", contact_phone: "03-2345678", priority: "critical", last_updated: "2025-03-15T09:30:00" },
  { id: "gen-3", name: "North Generator Station", name_he: "תחנת גנרטור צפון", type: "generator", lat: 32.7940, lng: 34.9896, status: "active", capacity: 400, description: "Northern district emergency power", description_he: "כוח חירום למחוז הצפוני", contact_phone: "04-3456789", priority: "high", last_updated: "2025-03-15T08:45:00" },
  { id: "gen-4", name: "South Generator Hub", name_he: "מרכז גנרטור דרום", type: "generator", lat: 31.2518, lng: 34.7915, status: "maintenance", capacity: 250, description: "Southern region backup power", description_he: "כוח גיבוי לאזור הדרום", contact_phone: "08-4567890", priority: "medium", last_updated: "2025-03-15T07:20:00" },
  { id: "gen-5", name: "Industrial Generator", name_he: "גנרטור תעשייתי", type: "generator", lat: 31.8927, lng: 34.8077, status: "active", capacity: 600, description: "Industrial zone emergency power", description_he: "כוח חירום לאזור התעשייה", contact_phone: "02-5678901", priority: "high", last_updated: "2025-03-15T06:15:00" },
  
  // Medical facilities
  { id: "med-1", name: "Ichilov Hospital", name_he: "בית חולים איכילוב", type: "medical", lat: 32.0853, lng: 34.7818, status: "active", capacity: 500, description: "Major medical center", description_he: "מרכז רפואי מרכזי", contact_phone: "03-6974444", priority: "critical", last_updated: "2025-03-15T10:30:00" },
  { id: "med-2", name: "Hadassah Medical Center", name_he: "המרכז הרפואי הדסה", type: "medical", lat: 31.7683, lng: 35.1370, status: "active", capacity: 800, description: "Leading medical facility", description_he: "מתקן רפואי מוביל", contact_phone: "02-6777111", priority: "critical", last_updated: "2025-03-15T10:15:00" },
  { id: "med-3", name: "Rambam Health Care Campus", name_he: "קמפוס הבריאות רמב\"ם", type: "medical", lat: 32.7940, lng: 34.9896, status: "active", capacity: 600, description: "Northern medical hub", description_he: "מרכז רפואי צפוני", contact_phone: "04-7772888", priority: "critical", last_updated: "2025-03-15T09:45:00" },
  { id: "med-4", name: "Soroka Medical Center", name_he: "המרכז הרפואי סורוקה", type: "medical", lat: 31.2518, lng: 34.7915, status: "active", capacity: 400, description: "Southern region medical center", description_he: "מרכז רפואי באזור הדרום", contact_phone: "08-6400111", priority: "critical", last_updated: "2025-03-15T09:00:00" },
  { id: "med-5", name: "Emergency Clinic Center", name_he: "מרכז מרפאת חירום", type: "medical", lat: 32.0808, lng: 34.7805, status: "active", capacity: 100, description: "24/7 emergency clinic", description_he: "מרפאת חירום 24/7", contact_phone: "03-1112222", priority: "high", last_updated: "2025-03-15T08:30:00" },
  
  // Shelters
  { id: "shelter-1", name: "Central Shelter Complex", name_he: "מתחם מקלט מרכזי", type: "shelter", lat: 32.0665, lng: 34.7748, status: "active", capacity: 1000, description: "Main emergency shelter", description_he: "מקלט חירום ראשי", contact_phone: "03-9998888", priority: "critical", last_updated: "2025-03-15T10:45:00" },
  { id: "shelter-2", name: "School Emergency Shelter", name_he: "מקלט חירום בבית ספר", type: "shelter", lat: 32.0753, lng: 34.7888, status: "active", capacity: 300, description: "School converted to shelter", description_he: "בית ספר שהוסב למקלט", contact_phone: "03-7776666", priority: "high", last_updated: "2025-03-15T10:00:00" },
  { id: "shelter-3", name: "Community Center Shelter", name_he: "מקלט במרכז קהילתי", type: "shelter", lat: 31.7683, lng: 35.1370, status: "active", capacity: 200, description: "Community emergency shelter", description_he: "מקלט חירום קהילתי", contact_phone: "02-5554444", priority: "medium", last_updated: "2025-03-15T09:15:00" },
  { id: "shelter-4", name: "Underground Shelter", name_he: "מקלט תת קרקעי", type: "shelter", lat: 32.7940, lng: 34.9896, status: "active", capacity: 500, description: "Underground emergency shelter", description_he: "מקלט חירום תת קרקעי", contact_phone: "04-3332222", priority: "high", last_updated: "2025-03-15T08:00:00" },
  { id: "shelter-5", name: "Sports Hall Shelter", name_he: "מקלט באולם ספורט", type: "shelter", lat: 31.2518, lng: 34.7915, status: "active", capacity: 400, description: "Sports facility emergency shelter", description_he: "מקלט חירום במתקן ספורט", contact_phone: "08-1119999", priority: "medium", last_updated: "2025-03-15T07:45:00" },
  
  // Fire stations
  { id: "fire-1", name: "Central Fire Station", name_he: "תחנת כיבוי מרכזית", type: "fire_station", lat: 32.0853, lng: 34.7818, status: "active", capacity: 20, description: "Main fire and rescue station", description_he: "תחנת כיבוי והצלה ראשית", contact_phone: "102", priority: "critical", last_updated: "2025-03-15T11:00:00" },
  { id: "fire-2", name: "North Fire Station", name_he: "תחנת כיבוי צפון", type: "fire_station", lat: 32.7940, lng: 34.9896, status: "active", capacity: 15, description: "Northern fire station", description_he: "תחנת כיבוי צפונית", contact_phone: "102", priority: "high", last_updated: "2025-03-15T10:30:00" },
  { id: "fire-3", name: "South Fire Station", name_he: "תחנת כיבוי דרום", type: "fire_station", lat: 31.2518, lng: 34.7915, status: "active", capacity: 12, description: "Southern fire station", description_he: "תחנת כיבוי דרומית", contact_phone: "102", priority: "high", last_updated: "2025-03-15T09:45:00" },
  
  // Police stations
  { id: "police-1", name: "Central Police Station", name_he: "תחנת משטרה מרכזית", type: "police", lat: 32.0808, lng: 34.7805, status: "active", capacity: 50, description: "Main police headquarters", description_he: "מטה המשטרה הראשי", contact_phone: "100", priority: "critical", last_updated: "2025-03-15T11:15:00" },
  { id: "police-2", name: "District Police Station", name_he: "תחנת משטרה מחוזית", type: "police", lat: 31.7683, lng: 35.1370, status: "active", capacity: 30, description: "District police station", description_he: "תחנת משטרה מחוזית", contact_phone: "100", priority: "high", last_updated: "2025-03-15T10:50:00" },
  
  // Supply points
  { id: "supply-1", name: "Emergency Supply Center", name_he: "מרכז אספקה לחירום", type: "supply", lat: 32.0753, lng: 34.7888, status: "active", capacity: 1000, description: "Food and medical supplies", description_he: "מזון ואספקה רפואית", contact_phone: "03-4445555", priority: "high", last_updated: "2025-03-15T10:20:00" },
  { id: "supply-2", name: "Mobile Supply Unit", name_he: "יחידת אספקה נייד", type: "supply", lat: 31.8927, lng: 34.8077, status: "active", capacity: 500, description: "Mobile emergency supplies", description_he: "אספקת חירום נייד", contact_phone: "02-8889999", priority: "medium", last_updated: "2025-03-15T09:30:00" },
  
  // Water points
  { id: "water-1", name: "Water Distribution Point", name_he: "נקודת חלוקת מים", type: "water", lat: 32.0665, lng: 34.7748, status: "active", capacity: 2000, description: "Emergency water distribution", description_he: "חלוקת מים לחירום", contact_phone: "03-6667777", priority: "critical", last_updated: "2025-03-15T11:30:00" },
  { id: "water-2", name: "Northern Water Station", name_he: "תחנת מים צפונית", type: "water", lat: 32.7940, lng: 34.9896, status: "active", capacity: 1500, description: "Northern water distribution", description_he: "חלוקת מים צפונית", contact_phone: "04-2223333", priority: "high", last_updated: "2025-03-15T10:40:00" },
  { id: "water-3", name: "Southern Water Hub", name_he: "מרכז מים דרומי", type: "water", lat: 31.2518, lng: 34.7915, status: "active", capacity: 1200, description: "Southern water distribution", description_he: "חלוקת מים דרומית", contact_phone: "08-3334444", priority: "high", last_updated: "2025-03-15T09:20:00" }
];

// Static data - Power outages
const powerOutages = [
  {
    id: "outage-1",
    area_name: "Downtown Tel Aviv",
    area_name_he: "מרכז תל אביב",
    coordinates: [[32.0853, 34.7818], [32.0753, 34.7818], [32.0753, 34.7918], [32.0853, 34.7918]],
    estimated_restoration: "2025-03-15T18:00:00",
    affected_population: 15000,
    status: "active",
    reported_at: "2025-03-15T12:00:00"
  },
  {
    id: "outage-2",
    area_name: "North Jerusalem",
    area_name_he: "ירושלים צפון",
    coordinates: [[31.7783, 35.1270], [31.7683, 35.1270], [31.7683, 35.1470], [31.7783, 35.1470]],
    estimated_restoration: "2025-03-15T20:00:00",
    affected_population: 8000,
    status: "active",
    reported_at: "2025-03-15T11:30:00"
  }
];

function App() {
  const [resources, setResources] = useState(emergencyResources);
  const [incidents, setIncidents] = useState([]);
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [newIncident, setNewIncident] = useState({
    title: '',
    title_he: '',
    description: '',
    description_he: '',
    type: 'other',
    lat: 32.0853,
    lng: 34.7818
  });

  // Load incidents from localStorage on component mount
  useEffect(() => {
    try {
      const storedIncidents = localStorage.getItem('emergency_incidents');
      if (storedIncidents && storedIncidents !== 'undefined') {
        const parsedIncidents = JSON.parse(storedIncidents);
        if (Array.isArray(parsedIncidents)) {
          setIncidents(parsedIncidents);
        }
      }
    } catch (error) {
      console.error('Error loading incidents from localStorage:', error);
      localStorage.removeItem('emergency_incidents');
    }
  }, []);

  // Save incidents to localStorage whenever incidents change
  useEffect(() => {
    try {
      if (incidents.length > 0) {
        localStorage.setItem('emergency_incidents', JSON.stringify(incidents));
      }
    } catch (error) {
      console.error('Error saving incidents to localStorage:', error);
    }
  }, [incidents]);

  const handleIncidentSubmit = (e) => {
    e.preventDefault();
    const newIncidentWithId = {
      ...newIncident,
      id: Date.now().toString(),
      reported_at: new Date().toISOString(),
      status: 'open',
      priority: 'medium',
      reported_by: 'anonymous'
    };

    setIncidents(prev => [...prev, newIncidentWithId]);
    setShowIncidentForm(false);
    setNewIncident({
      title: '',
      title_he: '',
      description: '',
      description_he: '',
      type: 'other',
      lat: 32.0853,
      lng: 34.7818
    });
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh delay
    setTimeout(() => {
      setLoading(false);
      // Update last_updated timestamps
      const updatedResources = resources.map(resource => ({
        ...resource,
        last_updated: new Date().toISOString()
      }));
      setResources(updatedResources);
    }, 1000);
  };

  const filteredResources = selectedResourceType === 'all' 
    ? resources 
    : resources.filter(resource => resource.type === selectedResourceType);

  const resourceTypes = [
    { value: 'all', label: 'הכל', label_en: 'All' },
    { value: 'generator', label: 'גנרטורים', label_en: 'Generators' },
    { value: 'medical', label: 'רפואה', label_en: 'Medical' },
    { value: 'shelter', label: 'מקלטים', label_en: 'Shelters' },
    { value: 'fire_station', label: 'כיבוי אש', label_en: 'Fire Stations' },
    { value: 'police', label: 'משטרה', label_en: 'Police' },
    { value: 'supply', label: 'אספקה', label_en: 'Supply' },
    { value: 'water', label: 'מים', label_en: 'Water' }
  ];

  // Calculate statistics
  const statistics = {
    total_resources: resources.length,
    active_resources: resources.filter(r => r.status === 'active').length,
    open_incidents: incidents.filter(i => i.status === 'open').length,
    active_outages: powerOutages.filter(o => o.status === 'active').length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">מעדכן נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      {/* Header */}
      <header className="bg-blue-900 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center">
              <i className="fas fa-shield-alt ml-3"></i>
              פלטפורמת חירום ישראל
            </h1>
            <div className="flex items-center space-x-4 space-x-reverse">
              <button
                onClick={() => setShowIncidentForm(true)}
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center transition-colors"
              >
                <i className="fas fa-exclamation-triangle ml-2"></i>
                דווח על אירוע
              </button>
              <button
                onClick={handleRefresh}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center transition-colors"
                disabled={loading}
              >
                <i className={`fas fa-sync-alt ml-2 ${loading ? 'animate-spin' : ''}`}></i>
                רענן
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Statistics Dashboard */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <i className="fas fa-map-marker-alt text-blue-600"></i>
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">סה״כ משאבים</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.total_resources}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <i className="fas fa-check-circle text-green-600"></i>
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">משאבים פעילים</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.active_resources}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <i className="fas fa-exclamation-triangle text-orange-600"></i>
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">אירועים פתוחים</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.open_incidents}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <i className="fas fa-bolt text-red-600"></i>
              </div>
              <div className="mr-4">
                <p className="text-sm text-gray-600">הפסקות חשמל</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.active_outages}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-lg font-semibold mb-4">סינון משאבים</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            {resourceTypes.map(type => (
              <button
                key={type.value}
                onClick={() => setSelectedResourceType(type.value)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedResourceType === type.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Map Container */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-semibold">מפת חירום</h2>
            <p className="text-gray-600">
              מציג {filteredResources.length} משאבים מתוך {resources.length}
            </p>
          </div>
          
          <div className="map-container" style={{ height: '600px' }}>
            <MapContainer
              center={[31.7683, 35.2137]}
              zoom={8}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Power Outages */}
              {powerOutages.map(outage => (
                <Polygon
                  key={outage.id}
                  positions={outage.coordinates}
                  pathOptions={{ 
                    color: '#dc2626', 
                    fillColor: '#dc2626', 
                    fillOpacity: 0.3,
                    weight: 2
                  }}
                >
                  <Popup>
                    <div className="text-right" dir="rtl">
                      <h3 className="font-bold text-red-600">הפסקת חשמל</h3>
                      <p><strong>אזור:</strong> {outage.area_name_he}</p>
                      <p><strong>אוכלוסייה מושפעת:</strong> {outage.affected_population?.toLocaleString()}</p>
                      {outage.estimated_restoration && (
                        <p><strong>זמן משוער לשיקום:</strong> {new Date(outage.estimated_restoration).toLocaleString('he-IL')}</p>
                      )}
                      <p><strong>סטטוס:</strong> <span className="text-red-600">{outage.status === 'active' ? 'פעיל' : 'נפתר'}</span></p>
                    </div>
                  </Popup>
                </Polygon>
              ))}
              
              {/* Emergency Resources */}
              {filteredResources.map(resource => (
                <Marker
                  key={resource.id}
                  position={[resource.lat, resource.lng]}
                  icon={resourceIcons[resource.type] || resourceIcons.generator}
                >
                  <Popup>
                    <div className="text-right min-w-64" dir="rtl">
                      <h3 className="font-bold text-lg mb-2 flex items-center">
                        <span 
                          className="w-3 h-3 rounded-full ml-2"
                          style={{ backgroundColor: priorityColors[resource.priority] || priorityColors.medium }}
                        ></span>
                        {resource.name_he}
                      </h3>
                      <p className="text-gray-600 mb-2">{resource.description_he}</p>
                      
                      <div className="space-y-1 text-sm">
                        <p><strong>סוג:</strong> {resourceTypes.find(t => t.value === resource.type)?.label || resource.type}</p>
                        <p><strong>סטטוס:</strong> 
                          <span className={`mr-1 ${
                            resource.status === 'active' ? 'text-green-600' : 
                            resource.status === 'maintenance' ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            {resource.status === 'active' ? 'פעיל' : 
                             resource.status === 'maintenance' ? 'תחזוקה' : 'לא פעיל'}
                          </span>
                        </p>
                        {resource.capacity && (
                          <p><strong>קיבולת:</strong> {resource.capacity.toLocaleString()}</p>
                        )}
                        {resource.contact_phone && (
                          <p><strong>טלפון:</strong> 
                            <a href={`tel:${resource.contact_phone}`} className="text-blue-600 mr-1">
                              {resource.contact_phone}
                            </a>
                          </p>
                        )}
                        <p><strong>עדכון אחרון:</strong> {new Date(resource.last_updated).toLocaleString('he-IL')}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              
              {/* Incidents */}
              {incidents.map(incident => (
                <Marker
                  key={incident.id}
                  position={[incident.lat, incident.lng]}
                  icon={createIcon('red', 'exclamation-triangle')}
                >
                  <Popup>
                    <div className="text-right min-w-64" dir="rtl">
                      <h3 className="font-bold text-lg mb-2 text-red-600">
                        {incident.title_he}
                      </h3>
                      <p className="text-gray-600 mb-2">{incident.description_he}</p>
                      
                      <div className="space-y-1 text-sm">
                        <p><strong>סוג:</strong> {incident.type}</p>
                        <p><strong>סטטוס:</strong> 
                          <span className={`mr-1 ${
                            incident.status === 'open' ? 'text-red-600' : 
                            incident.status === 'in_progress' ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {incident.status === 'open' ? 'פתוח' : 
                             incident.status === 'in_progress' ? 'בטיפול' : 'נפתר'}
                          </span>
                        </p>
                        <p><strong>דווח על ידי:</strong> {incident.reported_by}</p>
                        <p><strong>תאריך דיווח:</strong> {new Date(incident.reported_at).toLocaleString('he-IL')}</p>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Incident Report Modal */}
      {showIncidentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" dir="rtl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">דיווח אירוע חדש</h3>
              <button
                onClick={() => setShowIncidentForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleIncidentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  כותרת בעברית
                </label>
                <input
                  type="text"
                  value={newIncident.title_he}
                  onChange={(e) => setNewIncident({...newIncident, title_he: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  תיאור בעברית
                </label>
                <textarea
                  value={newIncident.description_he}
                  onChange={(e) => setNewIncident({...newIncident, description_he: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  rows="3"
                  required
                ></textarea>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סוג אירוע
                </label>
                <select
                  value={newIncident.type}
                  onChange={(e) => setNewIncident({...newIncident, type: e.target.value})}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="fire">שריפה</option>
                  <option value="medical">רפואי</option>
                  <option value="evacuation">פינוי</option>
                  <option value="power">חשמל</option>
                  <option value="other">אחר</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קו רוחב
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newIncident.lat}
                    onChange={(e) => setNewIncident({...newIncident, lat: parseFloat(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    קו אורך
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    value={newIncident.lng}
                    onChange={(e) => setNewIncident({...newIncident, lng: parseFloat(e.target.value)})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    required
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 space-x-reverse pt-4">
                <button
                  type="submit"
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex-1 transition-colors"
                >
                  שלח דיווח
                </button>
                <button
                  type="button"
                  onClick={() => setShowIncidentForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md flex-1 transition-colors"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;