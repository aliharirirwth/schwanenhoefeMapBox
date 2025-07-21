import { calculateDistance } from './utils.js';

// Global navigation state
let navigationActive = false;
let currentRoute = null;
let selectedDestination = null;
let userCurrentLocation = null;
let userMarker = null;
let destinationMarker = null;
let traveledPath = [];
let routeDistance = 0;
let distanceDisplay = null;

export class NavigationManager {
    constructor(map, mapboxgl) {
        this.map = map;
        this.mapboxgl = mapboxgl;
        this.accessToken = mapboxgl.accessToken;
        this.createDistanceDisplay();
        this.initDeviceOrientation();
    }

    initDeviceOrientation() {
        // Listen for device orientation changes (for mobile devices)
        if (window.DeviceOrientationEvent) {
            // Request permission for device orientation (iOS 13+)
            if (typeof DeviceOrientationEvent.requestPermission === 'function') {
                // Automatically request permission when navigation starts
                this.requestOrientationPermission();
            } else {
                // For devices that don't require permission
                this.setupDeviceOrientationListener();
            }
        }
    }

    async requestOrientationPermission() {
        try {
            const permission = await DeviceOrientationEvent.requestPermission();
            if (permission === 'granted') {
                this.setupDeviceOrientationListener();
            }
        } catch (error) {
            console.log('Device orientation permission denied or not available');
        }
    }

    setupDeviceOrientationListener() {
        window.addEventListener('deviceorientation', (event) => {
            if (event.alpha !== null) {
                // alpha is the rotation around the z-axis (0-360 degrees)
                // Convert to match mapbox coordinate system
                const heading = 360 - event.alpha;
                this.updateUserDirection(heading);
            }
        });
    }

    // Removed the orientation permission button - now automatically requests permission

    createDistanceDisplay() {
        // Create distance display element
        distanceDisplay = document.createElement('div');
        distanceDisplay.id = 'distance-display';
        distanceDisplay.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: 600;
            z-index: 1000;
            display: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        document.body.appendChild(distanceDisplay);
    }

    setUserLocation(location, heading = null) {
        // Only update if location has actually changed significantly
        if (userCurrentLocation) {
            const distance = Math.sqrt(
                Math.pow(userCurrentLocation[0] - location[0], 2) + 
                Math.pow(userCurrentLocation[1] - location[1], 2)
            );
            
            // Only update if movement is significant (more than 1 meter)
            if (distance < 0.00001) { // Approximately 1 meter
                return;
            }
        }
        
        userCurrentLocation = location;
        this.updateUserMarker();
        
        // Update direction if heading is provided
        if (heading !== null && heading !== undefined) {
            this.updateUserDirection(heading);
        }
    }

    updateUserDirection(heading) {
        if (!userMarker) return;
        
        const directionIndicator = document.getElementById('user-direction-indicator');
        if (directionIndicator) {
            // Rotate the direction indicator based on heading
            // Mapbox uses 0° as North, so we need to adjust accordingly
            const rotation = heading || 0;
            directionIndicator.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
        }
    }

    setDestination(destination) {
        selectedDestination = destination;
        console.log('Destination set:', destination);
    }

    updateUserMarker() {
        if (!userCurrentLocation) return;
        
        // Create user marker only once if it doesn't exist
        if (!userMarker) {
            const el = document.createElement('div');
            el.style.cssText = `
                width: 24px;
                height: 24px;
                background: #4285f4;
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
                position: relative;
                transition: transform 0.3s ease;
            `;
            
            // Add direction indicator (arrow)
            const directionIndicator = document.createElement('div');
            directionIndicator.id = 'user-direction-indicator';
            directionIndicator.style.cssText = `
                position: absolute;
                top: -10px;
                left: 50%;
                transform: translateX(-50%) rotate(0deg);
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-bottom: 16px solid #4285f4;
                transition: transform 0.3s ease;
            `;
            el.appendChild(directionIndicator);
            
            userMarker = new this.mapboxgl.Marker({ 
                element: el,
                anchor: 'center'
            })
            .setLngLat(userCurrentLocation)
            .addTo(this.map);
        } else {
            // Improved position update logic to prevent jumping
            const currentPos = userMarker.getLngLat();
            const newPos = userCurrentLocation;
            
            // Calculate distance between current and new position
            const distance = Math.sqrt(
                Math.pow(currentPos.lng - newPos[0], 2) + 
                Math.pow(currentPos.lat - newPos[1], 2)
            );
            
            // Only update if the change is significant (more than 2 meters)
            // Increased threshold to prevent micro-movements during zoom
            if (distance > 0.00002) { // Approximately 2 meters
                userMarker.setLngLat(userCurrentLocation);
            }
        }
    }

    startNavigation() {
        console.log('=== STARTING NAVIGATION ===');
        console.log('Selected destination:', selectedDestination);
        console.log('User current location:', userCurrentLocation);
        console.log('Navigation active before:', navigationActive);
        
        if (!selectedDestination) {
            console.error('No destination selected!');
            alert('No destination selected. Please select a building or company first.');
            return false;
        }
        
        if (!userCurrentLocation) {
            console.error('No user location available!');
            alert('Unable to get your location. Please allow location access and try again.');
            return false;
        }
        
        // Check if coordinates are valid
        if (!Array.isArray(selectedDestination) || selectedDestination.length !== 2) {
            console.error('Invalid destination coordinates:', selectedDestination);
            alert('Invalid destination coordinates. Please try selecting a different destination.');
            return false;
        }
        
        if (!Array.isArray(userCurrentLocation) || userCurrentLocation.length !== 2) {
            console.error('Invalid user location coordinates:', userCurrentLocation);
            alert('Invalid user location. Please check your location permissions.');
            return false;
        }
        
        // Check if coordinates are within reasonable bounds
        const [destLng, destLat] = selectedDestination;
        const [userLng, userLat] = userCurrentLocation;
        
        if (destLng < -180 || destLng > 180 || destLat < -90 || destLat > 90) {
            console.error('Destination coordinates out of bounds:', selectedDestination);
            alert('Invalid destination coordinates. Please try selecting a different destination.');
            return false;
        }
        
        if (userLng < -180 || userLng > 180 || userLat < -90 || userLat > 90) {
            console.error('User coordinates out of bounds:', userCurrentLocation);
            alert('Invalid user location. Please check your location permissions.');
            return false;
        }
        
        navigationActive = true;
        console.log('Navigation active after:', navigationActive);
        
        // Clear any existing route
        this.clearRoute();
        
        console.log('Calling drawRoute...');
        this.drawRoute();
        
        console.log('Calling attachEndNavigationToMarker...');
        this.attachEndNavigationToMarker();
        
        // Enter fullscreen navigation mode
        this.enterFullscreenMode();
        
        // Request device orientation permission for direction detection
        if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
            this.requestOrientationPermission();
        }
        
        console.log('Navigation started successfully');
        return true;
    }

    stopNavigation() {
        navigationActive = false;
        this.detachEndNavigationFromMarker();
        this.clearRoute();
        this.hideDistanceDisplay();
        this.exitFullscreenMode();
        selectedDestination = null;
        currentRoute = null;
        traveledPath = [];
        routeDistance = 0;
        console.log('Navigation stopped');
    }

    clearUserMarker() {
        if (userMarker) {
            userMarker.remove();
            userMarker = null;
        }
    }

    enterFullscreenMode() {
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            appRoot.classList.add('navigation-fullscreen');
            this.createFullscreenControls();
        }
    }

    exitFullscreenMode() {
        const appRoot = document.getElementById('app-root');
        if (appRoot) {
            appRoot.classList.remove('navigation-fullscreen');
            this.removeFullscreenControls();
        }
    }

    createFullscreenControls() {
        // Create exit fullscreen button
        const exitBtn = document.createElement('button');
        exitBtn.className = 'exit-fullscreen-btn';
        exitBtn.innerHTML = '✕';
        exitBtn.onclick = () => {
            this.stopNavigation();
        };
        document.body.appendChild(exitBtn);

        // Create fullscreen navigation controls
        const controls = document.createElement('div');
        controls.className = 'navigation-controls';
        controls.innerHTML = `
            <button class="control-button stop" onclick="window.navigationManager.stopNavigation()">
                Stop Navigation
            </button>
        `;
        document.body.appendChild(controls);
    }

    removeFullscreenControls() {
        const exitBtn = document.querySelector('.exit-fullscreen-btn');
        const controls = document.querySelector('.navigation-controls');
        
        if (exitBtn) exitBtn.remove();
        if (controls) controls.remove();
    }

    showArrivalNotification() {
        // Trigger device vibration if available
        if (navigator.vibrate) {
            navigator.vibrate([200, 100, 200, 100, 200]);
        }

        const notification = document.createElement('div');
        notification.className = 'arrival-notification';
        notification.innerHTML = `
            <span class="arrival-icon">🎉</span>
            <div class="arrival-text">You have arrived at your destination!</div>
            <button class="arrival-button" onclick="this.parentElement.remove(); window.navigationManager.exitFullscreenMode();">
                OK
            </button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 8000);
    }

    showArrivalModal() {
        // Backward compatibility - redirect to new notification
        this.showArrivalNotification();
    }

    clearRoute() {
        // Remove route layers
        if (this.map.getLayer('route')) {
            this.map.removeLayer('route');
        }
        if (this.map.getLayer('completed-route')) {
            this.map.removeLayer('completed-route');
        }
        if (this.map.getSource('route')) {
            this.map.removeSource('route');
        }
        if (this.map.getSource('completed-route')) {
            this.map.removeSource('completed-route');
        }
        
        // Remove destination marker
        if (destinationMarker) {
            destinationMarker.remove();
            destinationMarker = null;
        }
        
        // Reset progress tracking
        this.fullRouteCoordinates = null;
        this.progressIndex = 0;
    }

    drawRoute() {
        console.log('=== DRAWING ROUTE ===');
        console.log('Selected destination:', selectedDestination);
        console.log('User current location:', userCurrentLocation);
        
        if (!selectedDestination || !userCurrentLocation) {
            console.error('Missing destination or user location for route drawing');
            console.log('selectedDestination:', selectedDestination);
            console.log('userCurrentLocation:', userCurrentLocation);
            return;
        }
        
        // Validate coordinates before making API call
        const [destLng, destLat] = selectedDestination;
        const [userLng, userLat] = userCurrentLocation;
        
        console.log('Building API URL with coordinates:');
        console.log('User:', userLng, userLat);
        console.log('Destination:', destLng, destLat);
        
        const url = `https://api.mapbox.com/directions/v5/mapbox/walking/${userLng},${userLat};${destLng},${destLat}?geometries=geojson&access_token=${this.accessToken}`;
        
        console.log('Drawing route from', userCurrentLocation, 'to', selectedDestination);
        console.log('API URL:', url);
        
        console.log('Making fetch request...');
        fetch(url)
            .then(res => {
                console.log('Response received:', res.status, res.statusText);
                console.log('Response headers:', res.headers);
                
                if (!res.ok) {
                    throw new Error(`Directions API error: ${res.status} ${res.statusText}`);
                }
                return res.json();
            })
            .then(json => {
                console.log('JSON response:', json);
                
                if (!json.routes || json.routes.length === 0) {
                    throw new Error('No route found between the specified locations');
                }
                
                const route = json.routes[0];
                console.log('Selected route:', route);
                console.log('Route distance:', route.distance, 'meters');
                console.log('Route duration:', route.duration, 'seconds');
                
                const data = route.geometry;
                currentRoute = route;
                routeDistance = currentRoute.distance; // Distance in meters
                traveledPath = [userCurrentLocation];

                console.log('Route drawn successfully:', currentRoute);
                console.log('Route geometry:', data);
                console.log('Route distance:', routeDistance, 'meters');

                this.addRouteToMap(data);
                this.addDestinationMarker();
                this.showDistanceDisplay();
                
                // Zoom to show the entire route
                this.fitRouteToMap();
                
                console.log('Route drawing completed successfully');
            })
            .catch(error => {
                console.error('Error drawing route:', error);
                console.error('Error details:', error.message);
                console.error('Error stack:', error.stack);
                
                let errorMessage = 'Error drawing route: ' + error.message;
                
                // Provide more specific error messages
                if (error.message.includes('401')) {
                    errorMessage = 'Mapbox API authentication error. Please check the access token.';
                } else if (error.message.includes('403')) {
                    errorMessage = 'Mapbox API access denied. Please check the access token permissions.';
                } else if (error.message.includes('429')) {
                    errorMessage = 'Too many requests to Mapbox API. Please try again later.';
                } else if (error.message.includes('No route found')) {
                    errorMessage = 'No walking route found between your location and the destination.';
                }
                
                alert(errorMessage);
            });
    }

    addRouteToMap(data) {
        // Store the full route coordinates for progress tracking
        this.fullRouteCoordinates = data.coordinates;
        this.progressIndex = 0; // Track how much of the route has been completed
        
        // Add the full route (starts dark blue)
        if (!this.map.getSource('route')) {
            this.map.addSource('route', { 
                type: 'geojson', 
                data: { type: 'Feature', geometry: data } 
            });
        } else {
            this.map.getSource('route').setData({ type: 'Feature', geometry: data });
        }
        
        if (!this.map.getLayer('route')) {
            this.map.addLayer({
                id: 'route',
                type: 'line',
                source: 'route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-width': 8,
                    'line-color': '#1565c0', // Darker blue for remaining route
                    'line-opacity': 0.95
                }
            });
        }
        
        // Add completed route layer (will be light blue)
        if (!this.map.getSource('completed-route')) {
            this.map.addSource('completed-route', { 
                type: 'geojson', 
                data: { type: 'Feature', geometry: { type: 'LineString', coordinates: [] } } 
            });
        }
        
        if (!this.map.getLayer('completed-route')) {
            this.map.addLayer({
                id: 'completed-route',
                type: 'line',
                source: 'completed-route',
                layout: { 'line-join': 'round', 'line-cap': 'round' },
                paint: {
                    'line-width': 8,
                    'line-color': '#64b5f6', // Brighter light blue for completed portions
                    'line-opacity': 0.9
                }
            });
        }
    }

    addDestinationMarker() {
        if (destinationMarker) {
            destinationMarker.remove();
        }
        
        // Create a more prominent destination marker
        const el = document.createElement('div');
        el.style.cssText = `
            width: 24px;
            height: 24px;
            background: #f44336;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            position: relative;
        `;
        
        // Add destination icon
        const destinationIcon = document.createElement('div');
        destinationIcon.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: white;
            border-radius: 50%;
        `;
        el.appendChild(destinationIcon);
        
        destinationMarker = new this.mapboxgl.Marker({ element: el })
            .setLngLat(selectedDestination)
            .addTo(this.map);
    }

    updateRouteProgress(newLocation) {
        if (!navigationActive || !currentRoute) return;
        
        userCurrentLocation = newLocation;
        this.updateUserMarker();
        
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
        
        // Update progress index (only if significant change to prevent micro-updates)
        if (Math.abs(this.progressIndex - closestIdx) >= 1) {
            this.progressIndex = closestIdx;
        }
        
        // Calculate remaining distance
        const remainingDistance = this.calculateRemainingDistance(closestIdx);
        this.updateDistanceDisplay(remainingDistance);
        
        // Check if user is within 10 meters of destination
        const destDist = calculateDistance(userCurrentLocation, selectedDestination);
        if (destDist < 10) {
            this.stopNavigation();
            this.showArrivalNotification();
            return;
        }
        
        // Update the completed route (light blue)
        if (closestIdx > 0) {
            const completedCoordinates = coordinates.slice(0, closestIdx + 1);
            if (this.map.getSource('completed-route')) {
                this.map.getSource('completed-route').setData({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: completedCoordinates
                    }
                });
            }
        } else {
            // Clear completed route if at start
            if (this.map.getSource('completed-route')) {
                this.map.getSource('completed-route').setData({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: []
                    }
                });
            }
        }
        
        // Update the remaining route (dark blue)
        if (closestIdx < coordinates.length - 1) {
            const remainingCoordinates = coordinates.slice(closestIdx);
            if (this.map.getSource('route')) {
                this.map.getSource('route').setData({
                    type: 'Feature',
                    geometry: {
                        type: 'LineString',
                        coordinates: remainingCoordinates
                    }
                });
            }
        }
    }

    calculateRemainingDistance(closestIdx) {
        if (!currentRoute) return 0;
        
        const coordinates = currentRoute.geometry.coordinates;
        let remainingDistance = 0;
        
        // Calculate distance from current position to closest route point
        if (closestIdx > 0) {
            remainingDistance += calculateDistance(userCurrentLocation, coordinates[closestIdx]);
        }
        
        // Calculate distance along remaining route points
        for (let i = closestIdx; i < coordinates.length - 1; i++) {
            remainingDistance += calculateDistance(coordinates[i], coordinates[i + 1]);
        }
        
        return remainingDistance;
    }

    showDistanceDisplay() {
        if (distanceDisplay) {
            distanceDisplay.classList.add('show');
            this.updateDistanceDisplay(routeDistance);
        }
    }

    hideDistanceDisplay() {
        if (distanceDisplay) {
            distanceDisplay.classList.remove('show');
        }
    }

    updateDistanceDisplay(distance) {
        if (distanceDisplay) {
            const distanceText = distance >= 1000 
                ? `${(distance / 1000).toFixed(1)} km` 
                : `${Math.round(distance)} m`;
            distanceDisplay.textContent = `Distance: ${distanceText}`;
        }
    }

    fitRouteToMap() {
        if (!currentRoute || !userCurrentLocation || !selectedDestination) return;
        
        const coordinates = currentRoute.geometry.coordinates;
        const bounds = new this.mapboxgl.LngLatBounds();
        
        // Add user location and destination to bounds
        bounds.extend(userCurrentLocation);
        bounds.extend(selectedDestination);
        
        // Add route coordinates to bounds
        coordinates.forEach(coord => bounds.extend(coord));
        
        // Fit map to bounds with padding
        this.map.fitBounds(bounds, {
            padding: 50,
            duration: 2000,
            maxZoom: 18
        });
    }

    attachEndNavigationToMarker() {
        if (userMarker && navigationActive) {
            userMarker.getElement().style.cursor = 'pointer';
            userMarker.getElement().onclick = () => {
                this.showEndNavigationModal();
            };
        }
    }

    detachEndNavigationFromMarker() {
        if (userMarker) {
            userMarker.getElement().style.cursor = '';
            userMarker.getElement().onclick = null;
        }
    }

    showEndNavigationModal() {
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
        }
        
        modal.classList.add('show');
        
        document.getElementById('end-modal-yes').onclick = () => {
            modal.classList.remove('show');
            this.stopNavigation();
        };
        document.getElementById('end-modal-cancel').onclick = () => {
            modal.classList.remove('show');
        };
    }

    showArrivalModal() {
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
        }
        
        modal.classList.add('show');
        
        document.getElementById('arrival-modal-ok').onclick = () => {
            modal.classList.remove('show');
        };
    }

    // Test function for debugging
    testLocation() {
        console.log('=== LOCATION TEST ===');
        console.log('Current user location:', userCurrentLocation);
        console.log('Selected destination:', selectedDestination);
        console.log('Navigation active:', navigationActive);
        console.log('Current route:', currentRoute);
        
        if (selectedDestination) {
            const distance = calculateDistance(userCurrentLocation, selectedDestination);
            console.log('Distance to destination:', distance, 'meters (', (distance/1000).toFixed(2), 'km)');
        }
        
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
    }
}

// Export for global access
export { navigationActive, currentRoute, selectedDestination, userCurrentLocation }; 