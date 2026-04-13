// ========== CONFIG ==========
const API_BASE = '/api/vessel';
const MOCK_MODE = true;

// ========== MOCK DATA ==========
const MOCK_VESSELS = [
    {
        name: 'T-REX VOYAGER',
        type: 'YACHT',
        mmsi: '273456780',
        lat: 48.7120,
        lon: 44.5133,
        speed: 12.4,
        course: 185,
        destination: 'ASTRAKHAN',
        flag: 'RU'
    },
    {
        name: 'KARTEL EXPLORER',
        type: 'EXPEDITION',
        mmsi: '273891234',
        lat: 55.7558,
        lon: 37.6173,
        speed: 0,
        course: 0,
        destination: 'MOSCOW MARINA',
        flag: 'RU'
    },
    {
        name: 'VOLGA SPIRIT',
        type: 'CARGO',
        mmsi: '273112233',
        lat: 51.5406,
        lon: 46.0086,
        speed: 8.2,
        course: 220,
        destination: 'SARATOV',
        flag: 'RU'
    },
    {
        name: 'CASPIAN WIND',
        type: 'TANKER',
        mmsi: '273998877',
        lat: 43.3500,
        lon: 51.8900,
        speed: 14.1,
        course: 130,
        destination: 'AKTAU',
        flag: 'KZ'
    },
    {
        name: 'SIBERIAN RANGER',
        type: 'YACHT',
        mmsi: '273654321',
        lat: 56.3287,
        lon: 44.0020,
        speed: 6.7,
        course: 45,
        destination: 'NIZHNY NOVGOROD',
        flag: 'RU'
    }
];

// ========== MAP SETUP ==========
const map = L.map('map', {
    center: [52.0, 45.0],
    zoom: 5,
    zoomControl: false,
    attributionControl: false,
    minZoom: 3,
    maxZoom: 14
});

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19
}).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd',
    maxZoom: 19,
    opacity: 0.3
}).addTo(map);

// ========== MARKER FACTORY ==========
const markers = [];

function createVesselMarker(vessel) {
    const icon = L.divIcon({
        className: 'vessel-marker',
        html: `
            <div class="vessel-label">${vessel.name}</div>
            <div class="vessel-dot"></div>
        `,
        iconSize: [10, 10],
        iconAnchor: [5, 5]
    });

    const marker = L.marker([vessel.lat, vessel.lon], { icon }).addTo(map);
    marker.vesselData = vessel;
    marker.on('click', () => showVesselPanel(vessel, 'left'));
    markers.push(marker);
    return marker;
}

function clearMarkers() {
    markers.forEach(m => map.removeLayer(m));
    markers.length = 0;
}

// ========== PANELS ==========
function showVesselPanel(vessel, side) {
    const prefix = side === 'left' ? 'pl' : 'pr';
    const panel = document.getElementById(side === 'left' ? 'panelLeft' : 'panelRight');

    document.getElementById(`${prefix}Name`).textContent = vessel.name;
    document.getElementById(`${prefix}Type`).textContent = vessel.type;
    document.getElementById(`${prefix}Mmsi`).textContent = vessel.mmsi;
    document.getElementById(`${prefix}Lat`).textContent = vessel.lat.toFixed(4) + '°N';
    document.getElementById(`${prefix}Lon`).textContent = vessel.lon.toFixed(4) + '°E';
    document.getElementById(`${prefix}Speed`).textContent = vessel.speed + ' KN';
    document.getElementById(`${prefix}Course`).textContent = vessel.course + '°';
    document.getElementById(`${prefix}Dest`).textContent = vessel.destination;

    panel.classList.add('visible');
}

function hidePanels() {
    document.getElementById('panelLeft').classList.remove('visible');
    document.getElementById('panelRight').classList.remove('visible');
}

// ========== SCANNER ENGINE ==========
const radarSweep = document.querySelector('.radar-sweep');
const scanOverlay = document.getElementById('scanOverlay');
const scanStatus = document.getElementById('scanStatus');
const scanStatusText = document.getElementById('scanStatusText');
const scanStatusSub = document.getElementById('scanStatusSub');
let scanCoordInterval = null;
let scanIsActive = false;

const SCAN_PHASES = [
    { text: 'INITIALIZING AIS SCANNER...', sub: 'CONNECTING TO SATELLITE FEED', duration: 600 },
    { text: 'SCANNING AIS DATABASE...', sub: 'SECTOR 1 / 12', duration: 500 },
    { text: 'SCANNING AIS DATABASE...', sub: 'SECTOR 4 / 12', duration: 500 },
    { text: 'SCANNING AIS DATABASE...', sub: 'SECTOR 7 / 12', duration: 500 },
    { text: 'SCANNING AIS DATABASE...', sub: 'SECTOR 11 / 12', duration: 400 },
    { text: 'TRIANGULATING POSITION...', sub: 'CROSS-REFERENCING AIS SIGNALS', duration: 700 },
    { text: 'VERIFYING COORDINATES...', sub: 'MATCHING VESSEL REGISTRY', duration: 600 },
];

const SCAN_PHASE_FOUND = { text: '● TARGET ACQUIRED', sub: 'SIGNAL LOCKED' };
const SCAN_PHASE_NOT_FOUND = { text: '✕ NO SIGNAL DETECTED', sub: 'TARGET NOT IN AIS RANGE' };

function generateRandomCoord() {
    const lat = (40 + Math.random() * 25).toFixed(4);
    const lon = (30 + Math.random() * 40).toFixed(4);
    const ns = Math.random() > 0.3 ? 'N' : 'S';
    const ew = Math.random() > 0.3 ? 'E' : 'W';
    return `${lat}°${ns}  ${lon}°${ew}`;
}

function spawnScanCoord() {
    const el = document.createElement('div');
    el.className = 'scan-coord mono';
    el.textContent = generateRandomCoord();
    el.style.left = (5 + Math.random() * 85) + '%';
    el.style.top = (10 + Math.random() * 80) + '%';
    scanOverlay.appendChild(el);
    setTimeout(() => el.remove(), 1200);
}

function startScanAnimation() {
    scanIsActive = true;

    // Speed up radar
    radarSweep.classList.add('scanning');

    // Show scan overlay with coordinate rain
    scanOverlay.classList.add('active');
    scanCoordInterval = setInterval(() => {
        for (let i = 0; i < 3; i++) spawnScanCoord();
    }, 150);

    // Show center status
    scanStatus.classList.add('active');
}

function stopScanAnimation() {
    scanIsActive = false;

    // Slow radar back to normal
    radarSweep.classList.remove('scanning');

    // Stop coordinate rain
    scanOverlay.classList.remove('active');
    if (scanCoordInterval) {
        clearInterval(scanCoordInterval);
        scanCoordInterval = null;
    }
    scanOverlay.innerHTML = '';

    // Hide center status after a beat
    setTimeout(() => scanStatus.classList.remove('active'), 800);
}

function updateScanStatus(text, sub) {
    scanStatusText.textContent = text;
    scanStatusSub.textContent = sub;
}

function createTargetFlash(vessel) {
    // Convert vessel lat/lon to screen position
    const point = map.latLngToContainerPoint([vessel.lat, vessel.lon]);
    const xPct = (point.x / window.innerWidth * 100);
    const yPct = (point.y / window.innerHeight * 100);

    // Flash
    const flash = document.createElement('div');
    flash.className = 'scan-flash';
    flash.style.setProperty('--flash-x', xPct + '%');
    flash.style.setProperty('--flash-y', yPct + '%');
    document.querySelector('.tracker-wrapper').appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    // Expanding rings
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const ring = document.createElement('div');
            ring.className = 'scan-ring';
            ring.style.left = (point.x - 100) + 'px';
            ring.style.top = (point.y - 100) + 'px';
            document.querySelector('.tracker-wrapper').appendChild(ring);
            setTimeout(() => ring.remove(), 1500);
        }, i * 300);
    }
}

// Run scan phases sequentially, then call onComplete with results
function runScanSequence(query, onComplete) {
    startScanAnimation();
    clearMarkers();
    hidePanels();

    let i = 0;
    function nextPhase() {
        if (i >= SCAN_PHASES.length) {
            onComplete();
            return;
        }
        const phase = SCAN_PHASES[i];
        updateScanStatus(phase.text, phase.sub);
        i++;
        setTimeout(nextPhase, phase.duration);
    }

    nextPhase();
}

// ========== SEARCH ==========
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const searchLoading = document.getElementById('searchLoading');
const searchError = document.getElementById('searchError');
const searchResults = document.getElementById('searchResults');

function performSearch(query) {
    if (!query.trim() || scanIsActive) return;

    searchLoading.classList.add('active');
    searchError.classList.remove('active');
    searchResults.classList.remove('active');

    // Start full radar scan animation
    runScanSequence(query, () => {
        // Scan phases done — now resolve results
        let results;

        if (MOCK_MODE) {
            const q = query.trim().toUpperCase();
            results = MOCK_VESSELS.filter(v =>
                v.name.includes(q) ||
                v.mmsi.includes(q) ||
                v.destination.includes(q) ||
                v.type.includes(q)
            );
            onSearchResults(query, results);
        } else {
            fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`)
                .then(r => {
                    if (!r.ok) throw new Error(`HTTP ${r.status}`);
                    return r.json();
                })
                .then(data => onSearchResults(query, data.vessels || []))
                .catch(err => {
                    updateScanStatus(SCAN_PHASE_NOT_FOUND.text, SCAN_PHASE_NOT_FOUND.sub);
                    setTimeout(() => {
                        stopScanAnimation();
                        searchLoading.classList.remove('active');
                        searchError.textContent = `CONNECTION ERROR: ${err.message}`;
                        searchError.classList.add('active');
                    }, 1000);
                });
        }
    });
}

function onSearchResults(query, results) {
    searchLoading.classList.remove('active');

    if (!results || results.length === 0) {
        // NOT FOUND sequence
        updateScanStatus(SCAN_PHASE_NOT_FOUND.text, SCAN_PHASE_NOT_FOUND.sub);
        setTimeout(() => {
            stopScanAnimation();
            searchError.textContent = `NO VESSELS FOUND FOR "${query.toUpperCase()}"`;
            searchError.classList.add('active');
        }, 1200);
        return;
    }

    // FOUND sequence
    updateScanStatus(SCAN_PHASE_FOUND.text, SCAN_PHASE_FOUND.sub);

    setTimeout(() => {
        stopScanAnimation();

        if (results.length === 1) {
            selectVessel(results[0]);
        } else {
            showResultsList(results);
        }
    }, 1000);
}

function showResultsList(vessels) {
    searchResults.innerHTML = vessels.map(v => `
        <div class="result-item" data-mmsi="${v.mmsi}">
            <span class="result-dot"></span>
            <span class="result-name mono">${v.name}</span>
            <span class="result-meta mono">${v.type}</span>
        </div>
    `).join('');

    searchResults.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', () => {
            const mmsi = item.dataset.mmsi;
            const vessel = (MOCK_MODE ? MOCK_VESSELS : []).find(v => v.mmsi === mmsi);
            if (vessel) selectVessel(vessel);
        });
    });

    searchResults.classList.add('active');
}

function selectVessel(vessel) {
    searchResults.classList.remove('active');
    clearMarkers();

    // Fly to vessel location
    map.flyTo([vessel.lat, vessel.lon], 8, { duration: 1.5 });

    // After map moves — flash + marker + panel
    setTimeout(() => {
        createTargetFlash(vessel);
        createVesselMarker(vessel);
        showVesselPanel(vessel, 'left');
    }, 1600);

    document.getElementById('vesselCount').textContent = '1';
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('en-GB');
}

// Event listeners
searchBtn.addEventListener('click', () => performSearch(searchInput.value));
searchInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') performSearch(searchInput.value);
});

// ========== INIT: clean map, no pre-loaded vessels ==========
document.getElementById('vesselCount').textContent = '0';
document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('en-GB');

// ========== CLOCK UPDATE ==========
setInterval(() => {
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('en-GB');
}, 30000);
