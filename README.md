# Mapbox 3D Buildings Navigation System

A modern navigation application built with Mapbox GL JS that provides 3D building visualization and turn-by-turn navigation for the Schwanenhöfe campus.

## Features

### 🗺️ Navigation System
- **Real-time GPS tracking** - Uses actual user location (no fallback)
- **Turn-by-turn navigation** - Google/Apple Maps-like experience
- **Path visualization** - Shows traveled path (dark blue) and remaining route (light blue)
- **Distance display** - Real-time distance updates in a floating overlay
- **Smart zooming** - Automatically adjusts view to show the entire route
- **Arrival detection** - Automatically stops navigation when within 10 meters of destination

### 🏢 Building Selection
- **Company-based navigation** - Select destinations by company name
- **Building number navigation** - Select destinations by building number
- **Search functionality** - Filter companies and buildings by name
- **Visual markers** - Triangle icons and building labels on the map

### 🎨 Modern UI
- **Responsive design** - Works on desktop and mobile devices
- **Smooth animations** - Google/Apple Maps-style transitions
- **Enhanced markers** - Custom user and destination markers with direction indicators
- **Modal dialogs** - Clean confirmation and information dialogs

## Technical Improvements

### Navigation Enhancements
1. **Removed fallback location** - Only uses actual GPS location
2. **Improved path drawing** - Separate layers for traveled and remaining path
3. **Real-time distance updates** - Calculates and displays remaining distance
4. **Better error handling** - Comprehensive validation and user feedback
5. **Enhanced debugging** - Detailed console logging for troubleshooting

### UI/UX Improvements
1. **Google/Apple Maps-style navigation** - Familiar interface patterns
2. **Distance display overlay** - Prominent distance indicator
3. **Enhanced markers** - Custom styled user and destination markers
4. **Smooth animations** - Fly-to animations and transitions
5. **Responsive design** - Optimized for all screen sizes

## Testing the Navigation System

### Browser Console Commands
Open the browser console (F12) and use these commands to test the navigation:

```javascript
// Test location and navigation state
testLocation()

// Test navigation system initialization
testNavigation()

// Test manual navigation (requires location permission)
testManualNavigation()
```

### Manual Testing Steps
1. **Allow location access** when prompted by the browser
2. **Select a destination** by clicking on a company or building number
3. **Confirm navigation** in the modal dialog
4. **Observe the route** being drawn on the map
5. **Check distance display** at the top of the screen
6. **Move around** to see real-time updates

### Debugging
- Check the browser console for detailed logs
- Verify location permissions are granted
- Ensure Mapbox access token is valid
- Check network connectivity for API calls

## File Structure

```
client/public/
├── main.js              # Main application logic
├── js/
│   ├── navigation.js    # Navigation manager
│   ├── ui.js           # UI manager
│   └── utils.js        # Utility functions
├── styles/
│   └── styles.css      # Application styles
├── companies.js        # Building and company data
└── components/         # HTML components
```

## Dependencies

- **Mapbox GL JS** - 3D mapping and navigation
- **Mapbox Directions API** - Route calculation
- **Browser Geolocation API** - GPS tracking

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

Requires HTTPS for geolocation features in production.

## Known Issues

- Navigation requires location permission to be granted
- Some browsers may block geolocation on HTTP (use HTTPS)
- Mapbox API rate limits apply to route requests

## Future Enhancements

- Voice navigation instructions
- Alternative route options
- Offline map support
- Accessibility improvements
- Multi-language support

## 🚀 Live Demo

**[Visit the Application](https://aliharirirwth.github.io/schwanenhoefeMapBox/)**

## 🛠️ Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Mapping**: Mapbox GL JS
- **3D Rendering**: WebGL via Mapbox
- **Styling**: CSS3 with responsive design
- **Deployment**: GitHub Pages

## 📁 Project Structure

```
client/public/
├── js/
│   ├── utils.js          # Utility functions
│   ├── navigation.js     # Navigation logic
│   └── ui.js            # UI components
├── components/           # HTML components
├── styles/              # CSS stylesheets
├── image_logos/         # Company logos
├── main.js              # Main application
├── companies.js         # Company data
└── index.html           # Entry point
```

## 🎯 Key Features Explained

### 3D Buildings
- Realistic building heights and shapes
- Interactive 3D visualization
- Building labels and markers

### Navigation System
- GPS-based location tracking
- Turn-by-turn directions
- Real-time route updates
- Distance calculations

### Company Directory
- Complete tenant database
- Search by company name or building
- Company logos and information
- Building number grid

## 🔧 Development

### Prerequisites
- Modern web browser with ES6+ support
- Mapbox access token

### Local Development
1. Clone the repository
2. Open `client/public/index.html` in a web browser
3. Allow location access for full functionality

### Building
No build process required - pure vanilla JavaScript.

## 📱 Browser Support

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## 🤝 Contributing

This is a private project for the Schwanenhöfe business complex. For questions or support, please contact the development team.

## 📄 License

This project is proprietary software developed for Schwanenhöfe.

## 📞 Contact

**Developer**: Ali Hariri  
**Email**: ali.hariri@mov.dev

---

*Built with ❤️ for the Schwanenhöfe community* 