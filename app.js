// SafeRoute App Logic - Stich Edition
mapboxgl.accessToken = 'pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4M29iazA2Z3gycXA4N2pmbDZmangifQ.-g_vE53SD2WrJ6tFX7QHmA';

// --- Constants & Mock Data ---
const USER_COORDS = [-73.9857, 40.7484];

const HAZARDS = [
  { id: 'h1', name: 'Flash Flood', type: 'flood', severity: 'HIGH', coords: [-74.013, 40.700], description: 'Severe road flooding. Avoid low-lying underpasses.' },
  { id: 'h2', name: 'Structural Fire', type: 'fire', severity: 'EXTREME', coords: [-73.948, 40.726], description: 'Large industrial fire. Expect heavy smoke and road closures.' },
  { id: 'h3', name: 'Wind Advisory', type: 'wind', severity: 'MODERATE', coords: [-73.992, 40.762], description: 'High gusts reported. Danger of falling debris.' },
  { id: 'h4', name: 'Coastal Surge', type: 'flood', severity: 'HIGH', coords: [-74.020, 40.710], description: 'Rising water levels near battery park.' }
];

const PREDICTIONS = [
  { timeOffset: 24, type: 'flood', coords: [-73.970, 40.750], name: 'Predicted Flash Flood', probability: '85%' },
  { timeOffset: 48, type: 'wind', coords: [-74.000, 40.730], name: 'Predicted High Winds', probability: '60%' },
  { timeOffset: 72, type: 'fire', coords: [-73.960, 40.780], name: 'Extreme Heat Warning', probability: '90%' }
];

const RESOURCES = {
  shelters: [
    { name: 'Red Cross Emergency Shelter', coords: [-73.975, 40.745], address: '520 W 49th St', occupancy: '82%', type: 'Pet Friendly' },
    { name: 'Javits Convention Center', coords: [-73.995, 40.757], address: '429 11th Ave', occupancy: '45%', type: 'Medical Support' },
    { name: 'East Side Community Hub', coords: [-73.962, 40.738], address: '230 E 20th St', occupancy: 'FULL', type: 'General' },
  ],
  hospitals: [
    { name: 'Bellevue Hospital', coords: [-73.975, 40.739], address: '462 1st Ave', occupancy: '95%', type: 'Trauma Level 1' },
    { name: 'NYU Langone', coords: [-73.974, 40.742], address: '550 1st Ave', occupancy: 'High Wait', type: 'General' },
  ],
  water: [
    { name: 'Water Distribution A', coords: [-73.985, 40.750], address: 'Bryant Park', occupancy: 'Active', type: 'Potable Water' },
  ],
};

// --- State ---
let map;
let markers = { resources: [], predictions: [], hazards: [] };
let activeTab = 'nav';
let currentPredictionTime = 0;
let routeLayers = [];

// --- Initialization ---
function initMap() {
  map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/dark-v11',
    center: USER_COORDS,
    zoom: 13,
    attributionControl: false,
    pitch: 45
  });

  map.addControl(new mapboxgl.AttributionControl({ compact: true }));
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-left');

  map.on('load', () => {
    setupUserLocation();
    renderHazards();
    updateSidebar();
    checkProximityAlerts();
  });
}

function setupUserLocation() {
  map.addSource('user-location', {
    type: 'geojson',
    data: { type: 'Feature', geometry: { type: 'Point', coordinates: USER_COORDS } }
  });

  map.addLayer({
    id: 'user-pulse',
    type: 'circle',
    source: 'user-location',
    paint: { 'circle-radius': 12, 'circle-color': '#10b981', 'circle-opacity': 0.2 }
  });

  map.addLayer({
    id: 'user-dot',
    type: 'circle',
    source: 'user-location',
    paint: { 
      'circle-radius': 6, 
      'circle-color': '#10b981', 
      'circle-stroke-width': 2, 
      'circle-stroke-color': '#fff' 
    }
  });
}

// --- Pillar 1 & 6: Hazards & Predictions ---
function renderHazards() {
  HAZARDS.forEach(h => {
    const color = h.severity === 'EXTREME' ? '#ef4444' : '#f59e0b';
    
    map.addSource(h.id, {
      type: 'geojson',
      data: { type: 'Feature', geometry: { type: 'Point', coordinates: h.coords } }
    });

    map.addLayer({
      id: `${h.id}-glow`,
      type: 'circle',
      source: h.id,
      paint: { 'circle-radius': 80, 'circle-color': color, 'circle-opacity': 0.15 }
    });

    const el = document.createElement('div');
    el.className = 'hazard-marker';
    el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`;
    
    new mapboxgl.Marker(el)
      .setLngLat(h.coords)
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${h.name}</strong><br>${h.description}`))
      .addTo(map);
  });
}

function updatePredictions(time) {
  markers.predictions.forEach(m => m.remove());
  markers.predictions = [];

  PREDICTIONS.forEach(p => {
    if (p.timeOffset <= time && (p.timeOffset > time - 24 || time === 0)) {
       const el = document.createElement('div');
       el.className = 'prediction-marker';
       el.style.opacity = '0.7';
       el.innerHTML = `<div style="background: var(--accent-info); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px dashed #fff;">
          <span style="font-size: 10px; font-weight: 800; color: #fff;">${p.probability}</span>
       </div>`;

       const marker = new mapboxgl.Marker(el)
         .setLngLat(p.coords)
         .setPopup(new mapboxgl.Popup().setHTML(`<strong>${p.name}</strong><br>Forecasted Probability: ${p.probability}`))
         .addTo(map);
       
       markers.predictions.push(marker);
    }
  });

  document.getElementById('prediction-summary').innerHTML = time > 0 ? 
    `<div class="alert-header">
      <div class="alert-badge" style="background: var(--accent-info)">FORECAST</div>
      <span class="alert-title">Elevated risk detected at +${time}h.</span>
    </div>` : 
    `<div class="alert-header">
      <div class="alert-badge">STABLE</div>
      <span class="alert-title">No immediate threats nearby.</span>
    </div>`;
}

// --- Pillar 2: Safe Navigation ---
async function calculateSafeRoute(destination) {
  // Simulate Mapbox Directions API with safety filtering
  // In a real app, we'd fetch multiple routes and pick the one with fewest hazard intersections
  
  const emptyState = document.querySelector('.empty-state');
  if (emptyState) emptyState.remove();

  const routeList = document.getElementById('route-list');
  routeList.innerHTML = `
    <div class="route-option active glass" onclick="selectRoute(0)">
      <div class="route-header">
        <span class="route-name">SAFETY OPTIMIZED</span>
        <span class="route-safety">98% SAFE</span>
      </div>
      <div class="route-meta">12 mins • 3.2 km • Zero Hazards</div>
    </div>
    <div class="route-option glass" onclick="selectRoute(1)">
      <div class="route-header">
        <span class="route-name">FASTEST</span>
        <span class="route-safety" style="color: var(--accent-warning)">72% SAFE</span>
      </div>
      <div class="route-meta">9 mins • 2.8 km • Near Flood Zone</div>
    </div>
  `;

  // Draw a simulated safe route
  drawMockRoute([[destination[0], destination[1]], USER_COORDS]);
}

function drawMockRoute(coords) {
  if (map.getSource('route')) {
    map.removeLayer('route');
    map.removeSource('route');
  }

  map.addSource('route', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [USER_COORDS, [-73.97, 40.75], [-73.96, 40.76], coords[0]] }
    }
  });

  map.addLayer({
    id: 'route',
    type: 'line',
    source: 'route',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#10b981', 'line-width': 6, 'line-opacity': 0.8 }
  });
}

// --- Pillar 3: SOS System ---
let sosTimer;
function startSOS() {
  const modal = document.getElementById('modal');
  const timerEl = document.getElementById('sos-timer');
  modal.classList.remove('hidden');
  
  let count = 5;
  timerEl.innerText = count;
  
  sosTimer = setInterval(() => {
    count--;
    timerEl.innerText = count;
    if (count <= 0) {
      clearInterval(sosTimer);
      activateSOS();
    }
  }, 1000);
}

function activateSOS() {
  const sosBtn = document.getElementById('sos-btn');
  const modal = document.getElementById('modal');
  
  modal.classList.add('hidden');
  sosBtn.innerHTML = `<span class="live-pulse"></span> SOS ACTIVATED`;
  sosBtn.style.background = '#1a1a1a';
  sosBtn.style.color = 'var(--accent-hazard)';
  sosBtn.style.border = '1px solid var(--accent-hazard)';
  sosBtn.disabled = true;

  // Simulate contact alerts
  new mapboxgl.Popup({ closeButton: false })
    .setLngLat(USER_COORDS)
    .setHTML('<div style="color: var(--accent-hazard); font-weight: 800;">EMERGENCY BROADCAST ACTIVE</div>')
    .addTo(map);
}

// --- Pillar 4: Resource Locator ---
function showResources(type) {
  markers.resources.forEach(m => m.remove());
  markers.resources = [];

  const container = document.getElementById('resource-container');
  container.innerHTML = '';

  RESOURCES[type].forEach(r => {
    const el = document.createElement('div');
    el.className = 'resource-marker-el';
    el.style.background = 'var(--accent-safe)';

    const marker = new mapboxgl.Marker(el)
      .setLngLat(r.coords)
      .setPopup(new mapboxgl.Popup().setHTML(`<strong>${r.name}</strong><br>${r.address}<br>Capacity: ${r.occupancy}`))
      .addTo(map);
    
    markers.resources.push(marker);

    // List view
    const card = document.createElement('div');
    card.className = 'resource-card glass';
    card.innerHTML = `
      <div class="resource-name">${r.name}</div>
      <div class="resource-meta">${r.type} • ${r.occupancy}</div>
    `;
    container.appendChild(card);
  });
}

// --- UI Interaction Handlers ---
function setupEventListeners() {
  // Tabs
  document.querySelectorAll('.tab').forEach(t => {
    t.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      t.classList.add('active');
      const pane = document.getElementById(`tab-${t.dataset.tab}`);
      if (pane) pane.classList.add('active');
      
      if (t.dataset.tab === 'resources') showResources('shelters');
    });
  });

  // Search
  document.getElementById('search-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      calculateSafeRoute([-73.96, 40.77]); // Mock destination
    }
  });

  // Predictions Slider
  document.getElementById('prediction-slider').addEventListener('input', (e) => {
    updatePredictions(parseInt(e.target.value));
  });

  // SOS
  document.getElementById('sos-btn').addEventListener('click', startSOS);
  document.getElementById('modal-cancel').addEventListener('click', () => {
    clearInterval(sosTimer);
    document.getElementById('modal').classList.add('hidden');
  });
  document.getElementById('modal-confirm').addEventListener('click', () => {
    clearInterval(sosTimer);
    activateSOS();
  });
}

function checkProximityAlerts() {
  const alertsList = document.getElementById('active-alerts-list');
  alertsList.innerHTML = '';

  HAZARDS.forEach(h => {
    // Simple mock check
    const card = document.createElement('div');
    card.className = 'alert-card';
    card.style.marginBottom = '12px';
    const recommendation = h.type === 'flood' ? 'Move to higher ground immediately.' : 
                           h.type === 'fire' ? 'Evacuate upwind. Close all windows.' : 
                           'Seek sturdy shelter. Stay away from glass.';
                           
    card.innerHTML = `
      <div class="alert-header">
        <div class="alert-badge">${h.severity}</div>
        <span class="alert-title">${h.name} Detected</span>
      </div>
      <div style="font-size: 11px; color: var(--text-secondary); margin-top: 4px; line-height: 1.4;">
        <strong>Recommendation:</strong> ${recommendation}<br>
        <span style="font-size: 10px; opacity: 0.7;">Nearby • ${h.description}</span>
      </div>
    `;
    alertsList.appendChild(card);
  });
}

function updateSidebar() {
  // Logic for dynamic updates
}

// --- Start ---
initMap();
setupEventListeners();
