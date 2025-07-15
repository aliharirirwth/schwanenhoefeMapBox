import { loadComponent } from './js/utils.js';
import { NavigationManager } from './js/navigation.js';
import { UIManager } from './js/ui.js';

// Global variables
let map = null;
let navigationManager = null;
let uiManager = null;

// Remove fallback location - only use actual user location
// const fallbackLocation = [6.8143, 51.2187];

async function renderApp() {
    try {
        const appRoot = document.getElementById('app-root');
        
        // Load all components
        const [header, mapComponent, searchbar, buildingsScroll, buildingsList, footer] = await Promise.all([
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
                ${mapComponent}
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

function initAppLogic() {
    // Set Mapbox access token
    mapboxgl.accessToken = 'pk.eyJ1Ijoic2VyaHV6IiwiYSI6ImNseXpvc3RlczJpbnIya3FscDU2aHc5d3EifQ.FHtPjde_lqensSHZxqthgw';
    
    console.log('Mapbox access token set:', mapboxgl.accessToken ? 'Yes' : 'No');
    console.log('Token preview:', mapboxgl.accessToken.substring(0, 20) + '...');

    // Initialize map with a default center (will be updated when user location is available)
    map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/light-v11',
        center: [6.8143, 51.2187], // Default center, will be updated with user location
        zoom: 17.257060940340775,
        pitch: 45,
        bearing: -17.6,
        antialias: true
    });
    
    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Initialize managers
    navigationManager = new NavigationManager(map, mapboxgl);
    uiManager = new UIManager(navigationManager);
    
    console.log('Navigation manager initialized:', navigationManager);
    console.log('UI manager initialized:', uiManager);

    // Initialize 3D buildings and markers
    initMapFeatures();

    // Initialize geolocation
    initGeolocation();

    // Initial render
    uiManager.renderMostVisited();
    uiManager.renderBuildingGrid();

    // Responsive fix: prevent horizontal overflow
    document.body.style.overflowX = 'hidden';
    document.documentElement.style.overflowX = 'hidden';
    document.body.style.width = '100vw';
    document.documentElement.style.width = '100vw';
    
    console.log('App initialization completed');

    // Add global test function
    window.testLocation = () => {
        this.navigationManager.testLocation();
    };
    
    // Add global navigation test function
    window.testNavigation = () => {
        console.log('=== NAVIGATION TEST ===');
        console.log('Navigation manager:', navigationManager);
        console.log('UI manager:', uiManager);
        console.log('Map:', map);
        console.log('Mapbox access token:', mapboxgl.accessToken);
        
        if (navigationManager) {
            navigationManager.testLocation();
        } else {
            console.error('Navigation manager not initialized');
        }
    };
    
    // Add global manual navigation test function
    window.testManualNavigation = () => {
        console.log('=== MANUAL NAVIGATION TEST ===');
        
        if (!navigationManager) {
            console.error('Navigation manager not initialized');
            return;
        }
        
        // Set a test destination (WHU building)
        const testDestination = [6.8147, 51.2193];
        console.log('Setting test destination:', testDestination);
        navigationManager.setDestination(testDestination);
        
        // Try to start navigation
        console.log('Starting test navigation...');
        const success = navigationManager.startNavigation();
        console.log('Navigation start result:', success);
    };
}

function initMapFeatures() {
    // 3D buildings configuration
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
        addBuildingMarkers(labelLayerId);
    });
}

function addBuildingMarkers(labelLayerId) {
    // Import entrances for building markers
    import('./companies.js').then(module => {
        const { entrances } = module;
        
        console.log('Adding building markers for entrances:', entrances);
        
        // Create green "X" markers for building entrances
        entrances
            .filter(e => e.showTriangle)
            .forEach(entrance => {
                // Create custom green "X" marker element
                const markerElement = document.createElement('div');
                markerElement.style.cssText = `
                    width: 24px;
                    height: 24px;
                    background: #4CAF50;
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    color: white;
                    font-size: 12px;
                    font-family: Arial, sans-serif;
                `;
                
                // Add "X" text
                markerElement.textContent = 'X';
                
                // Create label element
                const labelElement = document.createElement('div');
                labelElement.style.cssText = `
                    position: absolute;
                    top: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #4CAF50;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 4px;
                    font-size: 10px;
                    font-weight: bold;
                    white-space: nowrap;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                `;
                labelElement.textContent = entrance.entrance_code;
                
                // Create container for marker and label
                const container = document.createElement('div');
                container.appendChild(markerElement);
                container.appendChild(labelElement);
                
                // Add marker to map
                const marker = new mapboxgl.Marker({ element: container })
                    .setLngLat([entrance.longitude, entrance.latitude])
                    .addTo(map);
                
                console.log(`Added green "X" marker for ${entrance.entrance_code} at [${entrance.longitude}, ${entrance.latitude}]`);
            });

        // Add red dashed line connecting buildings in sequence
        const sortedEntrances = entrances
            .filter(e => e.showTriangle)
            .sort((a, b) => {
                // Sort by building number (extract number and letter)
                const aMatch = a.entrance_code.match(/(\d+)([A-Za-z]*)/);
                const bMatch = b.entrance_code.match(/(\d+)([A-Za-z]*)/);
                
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

        // Create path coordinates
        const pathCoordinates = sortedEntrances.map(e => [e.longitude, e.latitude]);
        
        // Add red dashed line
        if (pathCoordinates.length > 1) {
            map.addSource('building-path', {
                type: 'geojson',
                data: {
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: pathCoordinates
                    }
                }
            });

            map.addLayer({
                id: 'building-path-line',
                type: 'line',
                source: 'building-path',
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#ff0000',
                    'line-width': 3,
                    'line-dasharray': [2, 2]
                }
            }, labelLayerId);

            // Add red circular markers along the path
            sortedEntrances.forEach((entrance, index) => {
                const circleMarker = document.createElement('div');
                circleMarker.style.cssText = `
                    width: 8px;
                    height: 8px;
                    background: #ff0000;
                    border: 2px solid white;
                    border-radius: 50%;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
                `;
                
                // Create label for path marker
                const pathLabel = document.createElement('div');
                pathLabel.style.cssText = `
                    position: absolute;
                    top: -15px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ff0000;
                    color: white;
                    padding: 1px 4px;
                    border-radius: 3px;
                    font-size: 8px;
                    font-weight: bold;
                    white-space: nowrap;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                    z-index: 1000;
                `;
                pathLabel.textContent = entrance.entrance_code;
                
                // Create container for path marker and label
                const pathContainer = document.createElement('div');
                pathContainer.appendChild(circleMarker);
                pathContainer.appendChild(pathLabel);
                
                // Add path marker to map
                const pathMarker = new mapboxgl.Marker({ element: pathContainer })
                    .setLngLat([entrance.longitude, entrance.latitude])
                    .addTo(map);
                
                console.log(`Added red path marker for ${entrance.entrance_code}`);
            });

            console.log('Red dashed path with building codes added successfully');
        }

        console.log('Green "X" markers added successfully');
    });
}

function initGeolocation() {
    if ('geolocation' in navigator) {
        console.log('Geolocation available, starting location tracking...');
        
        // First, get initial position
        navigator.geolocation.getCurrentPosition(
            position => {
                const loc = [position.coords.longitude, position.coords.latitude];
                console.log('Initial location received:', loc);
                console.log('Accuracy:', position.coords.accuracy, 'meters');
                
                // Update map center to user location
                map.flyTo({ 
                    center: loc, 
                    zoom: 18,
                    duration: 2000
                });
                
                navigationManager.setUserLocation(loc);
            },
            error => {
                console.error('Error getting initial location:', error);
                alert('Unable to get your location. Please allow location access to use navigation features.');
            },
            { 
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 10000
            }
        );
        
        // Then start watching for position updates
        navigator.geolocation.watchPosition(
            position => {
                const loc = [position.coords.longitude, position.coords.latitude];
                console.log('Location update received:', loc);
                console.log('Accuracy:', position.coords.accuracy, 'meters');
                
                navigationManager.setUserLocation(loc);
                navigationManager.updateRouteProgress(loc);
                
                // Only zoom to location when navigation is active
                if (navigationManager.navigationActive) {
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
                console.error('Error getting location update:', error);
                // Don't set fallback location - just log the error
            },
            { 
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 1000
            }
        );
    } else {
        console.log('Geolocation not available');
        alert('Geolocation is not available in your browser. Navigation features will not work.');
    }
}

// Start rendering
renderApp(); 