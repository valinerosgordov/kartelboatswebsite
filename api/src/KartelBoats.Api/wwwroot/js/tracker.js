// ========== CONFIG ==========
const API_BASE = '/api/vessel';
const POSITION_API = 'http://localhost:5001';
const MOCK_MODE = true;

// ========== MOCK DATA ==========
const MOCK_VESSELS = [
    {
        name: 'T-REX VOYAGER',
        type: 'MOTOR YACHT',
        mmsi: '273456780',
        imo: '9834521',
        lat: 48.7120,
        lon: 44.5133,
        speed: 12.4,
        course: 185,
        destination: 'ASTRAKHAN',
        flag: 'RU',
        flagEmoji: '🇷🇺',
        photo: 'images/cards/t-rex-flybridge-card.jpg',
        length: 13.4,
        beam: 4.2,
        draft: 1.1,
        yearBuilt: 2024,
        builder: 'KARTEL BOATS',
        status: 'UNDERWAY',
        callsign: 'UATR1'
    },
    {
        name: 'KARTEL EXPLORER',
        type: 'EXPEDITION YACHT',
        mmsi: '273891234',
        imo: '9834522',
        lat: 55.7558,
        lon: 37.6173,
        speed: 0,
        course: 0,
        destination: 'MOSCOW MARINA',
        flag: 'RU',
        flagEmoji: '🇷🇺',
        photo: 'images/cards/t-rex-cruiser-card.jpg',
        length: 19.6,
        beam: 5.8,
        draft: 1.5,
        yearBuilt: 2025,
        builder: 'KARTEL BOATS',
        status: 'MOORED',
        callsign: 'UAKE1'
    },
    {
        name: 'VOLGA SPIRIT',
        type: 'CARGO VESSEL',
        mmsi: '273112233',
        imo: '8812345',
        lat: 51.5406,
        lon: 46.0086,
        speed: 8.2,
        course: 220,
        destination: 'SARATOV',
        flag: 'RU',
        flagEmoji: '🇷🇺',
        photo: null,
        length: 89.0,
        beam: 12.5,
        draft: 3.8,
        yearBuilt: 2001,
        builder: 'Volga Shipyard',
        status: 'UNDERWAY',
        callsign: 'UBVS3'
    },
    {
        name: 'CASPIAN WIND',
        type: 'OIL TANKER',
        mmsi: '273998877',
        imo: '9156789',
        lat: 43.3500,
        lon: 51.8900,
        speed: 14.1,
        course: 130,
        destination: 'AKTAU',
        flag: 'KZ',
        flagEmoji: '🇰🇿',
        photo: null,
        length: 141.0,
        beam: 21.0,
        draft: 8.2,
        yearBuilt: 2015,
        builder: 'Hyundai Mipo',
        status: 'UNDERWAY',
        callsign: 'UNCW7'
    },
    {
        name: 'SIBERIAN RANGER',
        type: 'SAILING YACHT',
        mmsi: '273654321',
        imo: '9923456',
        lat: 56.3287,
        lon: 44.0020,
        speed: 6.7,
        course: 45,
        destination: 'NIZHNY NOVGOROD',
        flag: 'RU',
        flagEmoji: '🇷🇺',
        photo: null,
        length: 18.3,
        beam: 5.1,
        draft: 2.4,
        yearBuilt: 2019,
        builder: 'Baltic Yachts',
        status: 'UNDERWAY',
        callsign: 'UASR5'
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
    const panel = document.getElementById(side === 'left' ? 'panelLeft' : 'panelRight');

    const statusClass = vessel.status === 'MOORED' ? 'panel-status--offline' : '';
    const photoHtml = vessel.photo
        ? `<div class="panel-photo"><img src="${vessel.photo}" alt="${vessel.name}"></div>`
        : `<div class="panel-photo panel-photo--empty"><span class="mono">NO IMAGE</span></div>`;

    panel.innerHTML = `
        ${photoHtml}
        <div class="panel-body">
            <div class="panel-header">
                <div class="panel-status ${statusClass}"></div>
                <span class="panel-vessel-name mono">${vessel.name}</span>
                <span class="panel-vessel-type mono">${vessel.type}</span>
            </div>
            <div class="panel-flag-row">
                <span>${vessel.flagEmoji || ''} ${vessel.flag}</span>
                <span class="panel-status-text mono">${vessel.status || 'UNKNOWN'}</span>
            </div>
            <div class="panel-divider"></div>
            <div class="panel-row">
                <span class="panel-label mono">MMSI</span>
                <span class="panel-value mono">${vessel.mmsi}</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">IMO</span>
                <span class="panel-value mono">${vessel.imo || '—'}</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">CALLSIGN</span>
                <span class="panel-value mono">${vessel.callsign || '—'}</span>
            </div>
            <div class="panel-divider"></div>
            <div class="panel-row">
                <span class="panel-label mono">LAT</span>
                <span class="panel-value panel-value--accent mono">${vessel.lat.toFixed(4)}°N</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">LON</span>
                <span class="panel-value panel-value--accent mono">${vessel.lon.toFixed(4)}°E</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">SPEED</span>
                <span class="panel-value mono">${vessel.speed} KN</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">COURSE</span>
                <span class="panel-value mono">${vessel.course}°</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">DESTINATION</span>
                <span class="panel-value mono">${vessel.destination}</span>
            </div>
            <div class="panel-divider"></div>
            <div class="panel-row">
                <span class="panel-label mono">LENGTH</span>
                <span class="panel-value mono">${vessel.length || '—'} M</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">BEAM</span>
                <span class="panel-value mono">${vessel.beam || '—'} M</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">DRAFT</span>
                <span class="panel-value mono">${vessel.draft || '—'} M</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">BUILT</span>
                <span class="panel-value mono">${vessel.yearBuilt || '—'}</span>
            </div>
            <div class="panel-row">
                <span class="panel-label mono">BUILDER</span>
                <span class="panel-value mono">${vessel.builder || '—'}</span>
            </div>
        </div>
    `;

    panel.classList.add('visible');
}

function hidePanels() {
    document.getElementById('panelLeft').classList.remove('visible');
    document.getElementById('panelRight').classList.remove('visible');
    document.getElementById('panelLeft').innerHTML = '';
    document.getElementById('panelRight').innerHTML = '';
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

function isMMSI(query) {
    return /^\d{9}$/.test(query.trim());
}

function performSearch(query) {
    if (!query.trim() || scanIsActive) return;

    searchLoading.classList.add('active');
    searchError.classList.remove('active');
    searchResults.classList.remove('active');

    // Start full radar scan animation
    runScanSequence(query, () => {
        const q = query.trim();

        if (isMMSI(q)) {
            // Real vessel lookup via position-api
            searchRealVessel(q);
        } else {
            // Mock search by name/type/destination
            const qUp = q.toUpperCase();
            const results = MOCK_VESSELS.filter(v =>
                v.name.includes(qUp) ||
                v.mmsi.includes(qUp) ||
                v.destination.includes(qUp) ||
                v.type.includes(qUp)
            );
            onSearchResults(query, results);
        }
    });
}

function searchRealVessel(mmsi) {
    // Try MarineTraffic source first, then fallback to MST
    fetch(`${POSITION_API}/legacy/getLastPosition/${mmsi}`)
        .then(r => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
        })
        .then(data => {
            if (data.error || !data.data) {
                onSearchResults(mmsi, []);
                return;
            }

            const pos = data.data;
            const vessel = {
                name: 'MMSI ' + mmsi,
                type: 'VESSEL',
                mmsi: mmsi,
                imo: '',
                lat: pos.latitude,
                lon: pos.longitude,
                speed: pos.speed || 0,
                course: pos.course || 0,
                destination: '',
                flag: '',
                flagEmoji: '',
                photo: null,
                length: null,
                beam: null,
                draft: null,
                yearBuilt: null,
                builder: null,
                status: pos.speed > 0.5 ? 'UNDERWAY' : 'MOORED',
                callsign: ''
            };

            onSearchResults(mmsi, [vessel]);
        })
        .catch(err => {
            updateScanStatus(SCAN_PHASE_NOT_FOUND.text, SCAN_PHASE_NOT_FOUND.sub);
            setTimeout(() => {
                stopScanAnimation();
                searchLoading.classList.remove('active');
                searchError.textContent = `AIS SIGNAL ERROR: ${err.message}`;
                searchError.classList.add('active');
            }, 1000);
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

// ========== AIS LIVE POLLING (snapshot with viewport filter) ==========
const liveVessels = new Map(); // mmsi -> { marker, data }
const MAX_VISIBLE_VESSELS = 50;
let pollTimer = null;

function loadLiveVessels() {
    fetch('/api/vessel/live/snapshot')
        .then(r => r.json())
        .then(vessels => {
            // Filter to map viewport
            const bounds = map.getBounds();
            const visible = vessels.filter(v => {
                const lat = v.Lat ?? v.lat;
                const lon = v.Lon ?? v.lon;
                return lat && lon && bounds.contains([lat, lon]);
            }).slice(0, MAX_VISIBLE_VESSELS);

            // Remove markers outside viewport
            for (const [mmsi, entry] of liveVessels) {
                const inView = visible.some(v => (v.Mmsi || v.mmsi) === mmsi);
                if (!inView) {
                    map.removeLayer(entry.marker);
                    liveVessels.delete(mmsi);
                }
            }

            // Add/update visible vessels
            visible.forEach(v => {
                const vessel = {
                    name: (v.Name || v.name || 'UNKNOWN').trim(),
                    type: 'VESSEL',
                    mmsi: v.Mmsi || v.mmsi,
                    imo: '',
                    lat: v.Lat ?? v.lat,
                    lon: v.Lon ?? v.lon,
                    speed: v.Speed ?? v.speed ?? 0,
                    course: v.Course ?? v.course ?? 0,
                    destination: '',
                    flag: '',
                    flagEmoji: '',
                    photo: null,
                    length: null,
                    beam: null,
                    draft: null,
                    yearBuilt: null,
                    builder: null,
                    status: (v.Speed ?? v.speed ?? 0) > 0.5 ? 'UNDERWAY' : 'MOORED',
                    callsign: ''
                };

                if (liveVessels.has(vessel.mmsi)) {
                    const existing = liveVessels.get(vessel.mmsi);
                    existing.data = vessel;
                    existing.marker.setLatLng([vessel.lat, vessel.lon]);
                } else {
                    const marker = createLiveMarker(vessel);
                    liveVessels.set(vessel.mmsi, { marker, data: vessel });
                }
            });

            document.getElementById('vesselCount').textContent = liveVessels.size;
            document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('en-GB');
        })
        .catch(() => {
            document.getElementById('lastUpdate').textContent = 'ERROR';
        });
}

function startLivePolling() {
    loadLiveVessels();
    pollTimer = setInterval(loadLiveVessels, 10000); // Refresh every 10s
}

// Reload when map moves
map.on('moveend', loadLiveVessels);

function createLiveMarker(vessel) {
    const icon = L.divIcon({
        className: 'vessel-marker vessel-marker--live',
        html: `
            <div class="vessel-label">${vessel.name}</div>
            <div class="vessel-dot vessel-dot--live"></div>
        `,
        iconSize: [8, 8],
        iconAnchor: [4, 4]
    });

    const marker = L.marker([vessel.lat, vessel.lon], { icon }).addTo(map);
    marker.on('click', () => {
        map.flyTo([vessel.lat, vessel.lon], 10, { duration: 1 });
        const fresh = liveVessels.get(vessel.mmsi);
        showVesselPanel(fresh ? fresh.data : vessel, 'left');
    });
    return marker;
}

// ========== INIT ==========
document.getElementById('vesselCount').textContent = '0';
document.getElementById('lastUpdate').textContent = 'LOADING...';
startLivePolling();
