import { companies, buildingNumbers } from './companies.js';

// Global utility functions
function calculateDistance(coord1, coord2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = coord1[1] * Math.PI / 180;
    const φ2 = coord2[1] * Math.PI / 180;
    const Δφ = (coord2[1] - coord1[1]) * Math.PI / 180;
    const Δλ = (coord2[0] - coord1[0]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

// Global navigation state
let navigationActive = false;
let currentRoute = null;

// Utility to load HTML components
async function loadComponent(path) {
    try {
        const res = await fetch(path);
        if (!res.ok) {
            throw new Error(`Failed to load component: ${path} (${res.status} ${res.statusText})`);
        }
        return await res.text();
    } catch (error) {
        console.error(`Error loading component ${path}:`, error);
        throw error;
    }
}

async function renderApp() {
    try {
        const appRoot = document.getElementById('app-root');
        // Load all components
        const [header, map, searchbar, buildingsScroll, buildingsList, footer] = await Promise.all([
            loadComponent('./components/header.html'),
            loadComponent('./components/map.html'),
            loadComponent('./components/searchbar.html'),
            loadComponent('./components/buildings-scroll.html'),
            loadComponent('./components/buildings-list.html'),
            loadComponent('./components/footer.html'),
        ]);

        // Compose the main structure
        appRoot.innerHTML = `
            ${header}
            <div class="main-wrapper">
                ${map}
                <div id="right-panel">
                    <div class="panel-toggle" onclick="togglePanel()"></div>
                    ${searchbar}
                    ${buildingsScroll}
                    ${buildingsList}
                    ${footer}
                </div>
            </div>
        `;

        // After DOM is ready, initialize logic
        initAppLogic();
    } catch (error) {
        console.error('Error rendering app:', error);
        document.getElementById('app-root').innerHTML = `
            <div style="padding: 20px; text-align: center; color: red;">
                <h1>Error Loading Application</h1>
                <p>There was an error loading the application components.</p>
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Placeholder for all app logic (map, search, UI events, etc.)
function initAppLogic() {
    // Add the missing togglePanel function
    window.togglePanel = function() {
        const panel = document.getElementById('right-panel');
        if (panel) {
            panel.classList.toggle('closed');
        }
    };

    // Add manual location test function
    window.testLocation = function() {
        console.log('=== LOCATION TEST ===');
        console.log('Current user location:', userCurrentLocation);
        console.log('Selected destination:', selectedDestination);
        console.log('Navigation active:', navigationActive);
        console.log('Current route:', currentRoute);
        
        if (selectedDestination) {
            const distance = calculateDistance(userCurrentLocation, selectedDestination);
            console.log('Distance to destination:', distance, 'meters (', (distance/1000).toFixed(2), 'km)');
        }
        
        // Test if we can get current location
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                position => {
                    const loc = [position.coords.longitude, position.coords.latitude];
                    console.log('Current GPS location:', loc);
                    console.log('Distance from GPS to destination:', selectedDestination ? calculateDistance(loc, selectedDestination) : 'N/A', 'meters');
                },
                error => console.error('GPS error:', error)
            );
        }
    };

    // Set your Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyaHV6IiwiYSI6ImNseXpvc3RlczJpbnIya3FscDU2aHc5d3EifQ.FHtPjde_lqensSHZxqthgw';

    // Fallback location (Schwanenhöfe)
    const fallbackLocation = [6.8143, 51.2187];
    let userCurrentLocation = fallbackLocation;
    let selectedDestination = null;
    let userMarker = null;
    let routeLine = null;
    let destinationMarker = null;
    let traveledPath = [];

    // Remove old navigation controls logic
    // Add modal dialog for navigation start
    function showNavigationModal(onConfirm) {
        let modal = document.getElementById('navigation-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'navigation-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-title">Start the navigation?</div>
                    <div class="modal-actions">
                        <button id="modal-yes" class="modal-btn modal-btn-yes">Yes</button>
                        <button id="modal-cancel" class="modal-btn modal-btn-cancel">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'block';
        }
        document.getElementById('modal-yes').onclick = () => {
            modal.style.display = 'none';
            onConfirm();
        };
        document.getElementById('modal-cancel').onclick = () => {
            modal.style.display = 'none';
        };
    }

    // Update company and building selection to show modal
    function handleDestinationSelection(coords) {
        console.log('Destination selected:', coords);
        console.log('Current user location:', userCurrentLocation);
        console.log('Distance to destination:', calculateDistance(userCurrentLocation, coords), 'meters');
        
        selectedDestination = coords;
        showNavigationModal(() => {
            startNavigation();
        });
    }

    // Search logic
    const searchInput = document.getElementById('searchInput');
    const clearSearch = document.getElementById('clearSearch');
    
    searchInput.addEventListener('input', e => {
        const val = e.target.value.toLowerCase().trim();
        clearSearch.style.display = val ? 'flex' : 'none';
        
        // Filter companies
        const filteredCompanies = companies.filter(c => {
            const nameMatch = c.name.toLowerCase().includes(val);
            const buildingMatch = c.building.toLowerCase().includes(val);
            return nameMatch || buildingMatch;
        });
        
        // Filter building numbers
        const filteredBuildings = buildingNumbers.filter(num => 
            num.toLowerCase().includes(val)
        );
        
        renderMostVisited(filteredCompanies);
        renderBuildingGrid(filteredBuildings);
    });
    
    clearSearch.onclick = () => {
        searchInput.value = '';
        clearSearch.style.display = 'none';
        renderMostVisited(companies);
        renderBuildingGrid(buildingNumbers);
    };

    // Render most visited companies (scrollable)
    function renderMostVisited(companiesToRender = companies) {
        const container = document.getElementById('mostVisited');
        container.innerHTML = '';
        
        companiesToRender.forEach(c => {
            const btn = document.createElement('button');
            btn.className = 'company-circle company-btn';
            btn.innerHTML = `<img class="company-logo" src="./${c.logo}" alt="${c.name}" /><div class="company-name">${c.name}</div>`;
            btn.onclick = () => {
                document.querySelectorAll('.company-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                let coords = [c.longitude, c.latitude];
                handleDestinationSelection(coords);
            };
            container.appendChild(btn);
        });
    }

    // Render building number circles (grid)
    function renderBuildingGrid(buildingsToRender = buildingNumbers) {
        const grid = document.getElementById('companyGrid');
        grid.innerHTML = '';
        
        // Sort building numbers for consistent display
        const sortedBuildings = [...buildingsToRender].sort((a, b) => {
            // Extract numbers and letters
            const aMatch = a.match(/(\d+)([A-Za-z]*)/);
            const bMatch = b.match(/(\d+)([A-Za-z]*)/);
            
            if (!aMatch || !bMatch) return 0;
            
            const aNum = parseInt(aMatch[1]);
            const bNum = parseInt(bMatch[1]);
            const aLetter = aMatch[2] || '';
            const bLetter = bMatch[2] || '';
            
            // First compare numbers
            if (aNum !== bNum) return aNum - bNum;
            // Then compare letters
            return aLetter.localeCompare(bLetter);
        });
        
        sortedBuildings.forEach(num => {
            const btn = document.createElement('button');
            btn.className = 'company-grid-btn';
            btn.textContent = num;
            
            // Find companies in this building
            const buildingCompanies = companies.filter(c => c.building === num);
            
            btn.onclick = () => {
                document.querySelectorAll('.company-grid-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                
                // If there are companies in this building, use the first one's coordinates
                // Otherwise use the default location
                const company = buildingCompanies[0];
                let coords = company ? [company.longitude, company.latitude] : [6.8143, 51.2187];
                handleDestinationSelection(coords);
            };
            grid.appendChild(btn);
        });
    }

    // Map initialization
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: fallbackLocation,
        zoom: 17.257060940340775,
        pitch: 45,
        bearing: -17.6,
        antialias: true
    });
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Restore full set of 3D buildings (original IDs)
    const ids = [
        282619375, 152447953, 282619377, 152447952, 152447949, 152447945, 282619374,
        152447919, 152447944, 282619379, 152447946, 152447951, 152447950, 152447933,
        282619376, 152447941, 282619380, 282619378, 152447948, 305949322, 152447936,
        152447918, 152447934, 152447925
    ];
    const filters = ids.map(id => ['==', '$id', id]);

    map.on('style.load', () => {
        const layers = map.getStyle().layers;
        const labelLayerId = layers.find(
            (layer) => layer.type === 'symbol' && layer.layout['text-field']
        ).id;

        // Add 3D buildings layer
        map.addLayer(
            {
                'id': 'add-3d-buildings',
                'source': 'composite',
                'source-layer': 'building',
                'filter': [
                    'all',
                    ['==', 'extrude', 'true'],
                    ['any', ...filters]
                ],
                'type': 'fill-extrusion',
                'minzoom': 15,
                'paint': {
                    'fill-extrusion-color': 'skyblue',
                    'fill-extrusion-height': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15, 0,
                        15.05, ['get', 'height']
                    ],
                    'fill-extrusion-base': [
                        'interpolate',
                        ['linear'],
                        ['zoom'],
                        15, 0,
                        15.05, ['get', 'min_height']
                    ],
                    'fill-extrusion-opacity': 1
                },
            },
            labelLayerId
        );

        // Add triangle icons and building labels
        const arrowFeatures = companies
            .filter(c => c.showTriangle)
            .map(c => ({
                coordinates: [c.longitude, c.latitude],
                direction: 120,
                label: c.building
            }));

        map.loadImage('triangle.png', (error, image) => {
            if (error) throw error;
            if (!map.hasImage('arrow-icon')) {
                map.addImage('arrow-icon', image, { sdf: false });
            }
            const arrowGeoJSON = {
                type: 'FeatureCollection',
                features: arrowFeatures.map(obj => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: obj.coordinates },
                    properties: { direction: obj.direction, label: obj.label }
                }))
            };
            if (!map.getSource('arrows')) {
                map.addSource('arrows', { type: 'geojson', data: arrowGeoJSON });
            }
            map.addLayer({
                id: 'arrow-symbols',
                type: 'symbol',
                source: 'arrows',
                layout: {
                    'icon-image': 'arrow-icon',
                    'icon-size': 0.7,
                    'icon-offset': [0, -15],
                    'icon-allow-overlap': true,
                    'icon-rotate': ['get', 'direction'],
                    'icon-rotation-alignment': 'map',
                    'icon-anchor': 'top',
                    'text-optional': true,
                }
            }, labelLayerId);
            map.addLayer({
                id: 'arrow-labels',
                type: 'symbol',
                source: 'arrows',
                layout: {
                    'text-field': ['get', 'label'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 14,
                    'text-offset': [0, 1.2],
                    'text-anchor': 'top',
                    'text-allow-overlap': true
                },
                paint: {
                    'text-color': '#222',
                    'text-halo-color': '#fff',
                    'text-halo-width': 2
                }
            }, labelLayerId);
        });
    });

    // Show user location
    if ('geolocation' in navigator) {
        console.log('Geolocation available, starting location tracking...');
        navigator.geolocation.watchPosition(
            position => {
                const loc = [position.coords.longitude, position.coords.latitude];
                console.log('Location update received:', loc);
                console.log('Accuracy:', position.coords.accuracy, 'meters');
                userCurrentLocation = loc;
                if (userMarker) userMarker.remove();
                userMarker = new mapboxgl.Marker({ color: 'blue' })
                    .setLngLat(loc)
                    .addTo(map);
                
                // Only zoom to location when navigation is active
                if (navigationActive) {
                    map.flyTo({ 
                        center: loc, 
                        zoom: 18,
                        bearing: position.coords.heading || 0,
                        pitch: 60,
                        duration: 1000
                    });
                }
            },
            error => {
                console.error('Error getting location:', error);
                console.log('Using fallback location:', userCurrentLocation);
            },
            { 
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 1000
            }
        );
    } else {
        console.log('Geolocation not available, using fallback location:', userCurrentLocation);
        userMarker = new mapboxgl.Marker({ color: 'blue' })
            .setLngLat(userCurrentLocation)
            .addTo(map);
    }

    // Draw navigation route with gradient from user's current location
    function drawRoute() {
        if (!selectedDestination || !userCurrentLocation) {
            console.error('Missing destination or user location for route drawing');
            return;
        }
        
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userCurrentLocation[0]},${userCurrentLocation[1]};${selectedDestination[0]},${selectedDestination[1]}?geometries=geojson&access_token=${mapboxgl.accessToken}`;
        
        console.log('Drawing route from', userCurrentLocation, 'to', selectedDestination);
        
        fetch(url)
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Directions API error: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then(json => {
                if (!json.routes || json.routes.length === 0) {
                    throw new Error('No route found');
                }
                
                const data = json.routes[0].geometry;
                currentRoute = json.routes[0];
                traveledPath = [userCurrentLocation];

                console.log('Route drawn successfully:', currentRoute);

                // Add or update route with gradient
                if (!map.getSource('route')) {
                    map.addSource('route', { type: 'geojson', data: { type: 'Feature', geometry: data } });
                    map.addLayer({
                        id: 'route',
                        type: 'line',
                        source: 'route',
                        layout: { 'line-join': 'round', 'line-cap': 'round' },
                        paint: {
                            'line-width': 6,
                            'line-gradient': [
                                'interpolate',
                                ['linear'],
                                ['line-progress'],
                                0, '#0d47a1', // dark blue (traveled)
                                0.001, '#0d47a1',
                                0.0011, '#90caf9', // light blue (remaining)
                                1, '#90caf9'
                            ]
                        }
                    });
                    routeLine = true;
                } else {
                    map.getSource('route').setData({ type: 'Feature', geometry: data });
                }

                // Only show one destination marker at a time
                if (destinationMarker) destinationMarker.remove();
                destinationMarker = new mapboxgl.Marker({ color: 'red' })
                    .setLngLat(selectedDestination)
                    .addTo(map);
            })
            .catch(error => {
                console.error('Error drawing route:', error);
                // Show error to user
                alert('Error drawing route: ' + error.message);
            });
    }

    // Start navigation: draw route and activate navigation mode
    function startNavigation() {
        console.log('Starting navigation to:', selectedDestination);
        navigationActive = true;
        drawRoute();
        attachEndNavigationToMarker();
    }

    // End navigation: clear route and deactivate navigation mode
    function stopNavigation() {
        navigationActive = false;
        detachEndNavigationFromMarker();
        if (map.getSource('route')) {
            map.getSource('route').setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: [] } });
        }
        if (destinationMarker) {
            destinationMarker.remove();
            destinationMarker = null;
        }
        selectedDestination = null;
        currentRoute = null;
    }

    // On each geolocation update, update the route and gradient
    function handleLocationUpdate(newLocation) {
        userCurrentLocation = newLocation;
        if (userMarker) userMarker.remove();
        userMarker = new mapboxgl.Marker({ color: 'blue' })
            .setLngLat(userCurrentLocation)
            .addTo(map);
        if (navigationActive && currentRoute) {
            // Find progress along the route
            const coordinates = currentRoute.geometry.coordinates;
            let closestIdx = 0;
            let minDist = Infinity;
            for (let i = 0; i < coordinates.length; i++) {
                const dist = calculateDistance(userCurrentLocation, coordinates[i]);
                if (dist < minDist) {
                    minDist = dist;
                    closestIdx = i;
                }
            }
            // If user is within 10 meters of destination, end navigation and show arrival modal
            const destDist = calculateDistance(userCurrentLocation, coordinates[coordinates.length - 1]);
            if (destDist < 10) {
                stopNavigation();
                showArrivalModal();
                return;
            }
            // Update route gradient
            if (map.getSource('route')) {
                const progress = closestIdx / (coordinates.length - 1);
                map.setPaintProperty('route', 'line-gradient', [
                    'interpolate',
                    ['linear'],
                    ['line-progress'],
                    0, '#0d47a1',
                    Math.max(0.001, progress), '#0d47a1',
                    Math.min(0.0011, progress + 0.0001), '#90caf9',
                    1, '#90caf9'
                ]);
            }
        }
    }

    // End navigation by clicking marker
    function attachEndNavigationToMarker() {
        if (userMarker && navigationActive) {
            userMarker.getElement().style.cursor = 'pointer';
            userMarker.getElement().onclick = () => {
                showEndNavigationModal();
            };
        }
    }
    function detachEndNavigationFromMarker() {
        if (userMarker) {
            userMarker.getElement().style.cursor = '';
            userMarker.getElement().onclick = null;
        }
    }
    function showEndNavigationModal() {
        let modal = document.getElementById('end-navigation-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'end-navigation-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-title">End navigation?</div>
                    <div class="modal-actions">
                        <button id="end-modal-yes" class="modal-btn modal-btn-yes">Yes</button>
                        <button id="end-modal-cancel" class="modal-btn modal-btn-cancel">Cancel</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'block';
        }
        document.getElementById('end-modal-yes').onclick = () => {
            modal.style.display = 'none';
            stopNavigation();
        };
        document.getElementById('end-modal-cancel').onclick = () => {
            modal.style.display = 'none';
        };
    }
    function showArrivalModal() {
        let modal = document.getElementById('arrival-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'arrival-modal';
            modal.innerHTML = `
                <div class="modal-backdrop"></div>
                <div class="modal-content">
                    <div class="modal-title">You have arrived!</div>
                    <div class="modal-actions">
                        <button id="arrival-modal-ok" class="modal-btn modal-btn-yes">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        } else {
            modal.style.display = 'block';
        }
        document.getElementById('arrival-modal-ok').onclick = () => {
            modal.style.display = 'none';
        };
    }

    // Initial render
    renderMostVisited();
    renderBuildingGrid();

    // Responsive fix: prevent horizontal overflow
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.width = '100vw';
    document.documentElement.style.width = '100vw';
}

// Start rendering
renderApp(); 