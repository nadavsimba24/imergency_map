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

function App() {
  const [resources, setResources] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [powerOutages, setPowerOutages] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [selectedResourceType, setSelectedResourceType] = useState('all');
  const [loading, setLoading] = useState(true);
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

  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [resourcesRes, incidentsRes, outagesRes, statsRes] = await Promise.all([
        fetch(`${backendUrl}/api/resources`),
        fetch(`${backendUrl}/api/incidents`),
        fetch(`${backendUrl}/api/power-outages`),
        fetch(`${backendUrl}/api/statistics`)
      ]);

      if (resourcesRes.ok) {
        const resourcesData = await resourcesRes.json();
        setResources(resourcesData.resources || []);
      }

      if (incidentsRes.ok) {
        const incidentsData = await incidentsRes.json();
        setIncidents(incidentsData.incidents || []);
      }

      if (outagesRes.ok) {
        const outagesData = await outagesRes.json();
        setPowerOutages(outagesData.outages || []);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStatistics(statsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIncidentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${backendUrl}/api/incidents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newIncident),
      });

      if (response.ok) {
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
        fetchAllData();
      }
    } catch (error) {
      console.error('Error submitting incident:', error);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">טוען נתונים...</p>
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
                className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg flex items-center"
              >
                <i className="fas fa-exclamation-triangle ml-2"></i>
                דווח על אירוע
              </button>
              <button
                onClick={fetchAllData}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center"
              >
                <i className="fas fa-sync-alt ml-2"></i>
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
                <p className="text-2xl font-bold text-gray-900">{statistics.total_resources || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{statistics.active_resources || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{statistics.open_incidents || 0}</p>
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
                <p className="text-2xl font-bold text-gray-900">{statistics.active_outages || 0}</p>
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
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex-1"
                >
                  שלח דיווח
                </button>
                <button
                  type="button"
                  onClick={() => setShowIncidentForm(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md flex-1"
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