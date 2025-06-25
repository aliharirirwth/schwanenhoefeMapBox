# Schwanenhöfe MapBox 3D Buildings Application

A modern, interactive 3D map application showcasing the Schwanenhöfe buildings using MapBox GL JS. This application provides an immersive experience to explore the buildings with detailed information about tenants and companies.

## 🌟 Features

- **3D Building Visualization**: Interactive 3D buildings with realistic rendering
- **Building Information**: Detailed information about each building including:
  - Building names and addresses
  - Tenant information
  - Company details and logos
  - Contact information
- **Search Functionality**: Search buildings by name or company
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, professional interface with smooth animations
- **Company Showcase**: Display of tenant companies with their logos

## 🏗️ Project Structure

```
mapbox-3d-buildings-filtered-main/
├── client/
│   ├── public/
│   │   ├── components/          # HTML components
│   │   ├── image_logos/         # Company logos
│   │   ├── styles/              # CSS stylesheets
│   │   ├── index.html           # Main application
│   │   ├── main.js              # Main JavaScript file
│   │   └── companies.js         # Company data
│   └── src/                     # Source files
├── server/
│   ├── index.js                 # Express server
│   ├── package.json             # Server dependencies
│   └── package-lock.json
├── image_logos/                 # Additional logos
└── README.md                    # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MapBox API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/aliharirirwth/schwanenhoefeMapBox.git
   cd schwanenhoefeMapBox
   ```

2. **Install server dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the server directory:
   ```env
   MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
   PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open the application**
   Navigate to `http://localhost:3000` in your browser

## 🎯 Usage

### For Users
1. **Explore Buildings**: Navigate around the 3D map to explore different buildings
2. **View Information**: Click on buildings to see detailed information
3. **Search**: Use the search bar to find specific buildings or companies
4. **Company Details**: View company information and logos in the sidebar

### For Developers
1. **Add New Buildings**: Update the building data in the appropriate files
2. **Modify Styling**: Edit CSS files in `client/public/styles/`
3. **Update Company Data**: Modify `client/public/companies.js`
4. **Add New Features**: Extend the JavaScript functionality in `client/public/main.js`

## 🛠️ Technologies Used

- **Frontend**:
  - HTML5
  - CSS3
  - JavaScript (ES6+)
  - MapBox GL JS
  - Bootstrap (for responsive design)

- **Backend**:
  - Node.js
  - Express.js
  - CORS middleware

- **Data**:
  - Excel file processing (XLSX)
  - JSON data structures

## 📱 Features in Detail

### 3D Building Visualization
- Realistic 3D building models
- Interactive camera controls
- Smooth zoom and pan functionality
- Building highlighting on hover

### Building Information System
- Comprehensive building details
- Tenant information
- Company profiles
- Contact information
- Interactive popups

### Search and Filter
- Real-time search functionality
- Filter by building name
- Filter by company name
- Dynamic results updating

### Responsive Design
- Mobile-friendly interface
- Adaptive layout
- Touch-friendly controls
- Cross-browser compatibility

## 🔧 Configuration

### MapBox Configuration
The application uses MapBox GL JS for 3D visualization. Configure your MapBox access token in the environment variables.

### Building Data
Building information is stored in structured data files. Update these files to add or modify building information.

### Styling
The application uses custom CSS for styling. Modify the stylesheets in `client/public/styles/` to customize the appearance.

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 👥 Contributing

This is a private project for Schwanenhöfe. For any modifications or improvements, please contact the development team.

## 📞 Support

For technical support or questions about the application, please contact:
- Email: [Contact Email]
- Phone: [Contact Phone]

## 🔄 Updates

### Version 1.0.0
- Initial release
- 3D building visualization
- Building information system
- Search functionality
- Responsive design

---

**Note**: This application is specifically designed for the Schwanenhöfe project and contains proprietary information about the buildings and tenants. 