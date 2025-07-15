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

        // Add entrance markers
        addEntranceMarkers();
    });
}

function addEntranceMarkers() {
    // Import entrances data
    import('./companies.js').then(module => {
        const { entrances } = module;
        
        console.log('Adding entrance markers from scratch');
        
        // Create simple red arrow markers for each entrance
        entrances
            .filter(e => e.showTriangle)
            .forEach(entrance => {
                // Create a simple red arrow marker
                const marker = new mapboxgl.Marker({ color: '#ff0000' })
                    .setLngLat([entrance.longitude, entrance.latitude])
                    .addTo(map);
                
                console.log(`Added entrance marker for ${entrance.entrance_code} at [${entrance.longitude}, ${entrance.latitude}]`);
            });
        
        console.log('Entrance markers added successfully');
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