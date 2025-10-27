# TimeTracker Analytics - Chrome Extension & MERN Stack

A comprehensive time tracking and analytics Chrome extension with a full MERN stack backend and React frontend dashboard.

## Features

### Chrome Extension
- **Real-time Time Tracking**: Automatically tracks time spent on different websites
- **Site Categorization**: Categorizes sites as productive, social, entertainment, news, shopping, or other
- **Page Analysis**: Analyzes page content, scroll behavior, and click patterns
- **Popup Dashboard**: Quick overview of daily stats and current site information
- **Data Export**: Export tracking data for external analysis

### Backend API (Express.js + MongoDB)
- **RESTful API**: Complete API for tracking sessions, analytics, and user management
- **User Management**: User profiles with customizable settings and goals
- **Analytics Engine**: Advanced analytics with aggregation pipelines
- **Data Visualization**: Pre-processed data for charts and insights
- **MongoDB Integration**: Optimized database schema with proper indexing

### Frontend Dashboard (React)
- **Interactive Dashboard**: Real-time analytics with charts and metrics
- **Data Visualization**: Multiple chart types (line, bar, pie charts)
- **Settings Management**: Customize site categories and tracking preferences
- **Responsive Design**: Works on desktop and mobile devices
- **Material-UI Components**: Modern, accessible interface

## Project Structure

```
Chrome_extension_cursor/
├── manifest.json              # Chrome extension manifest
├── background.js              # Background script for time tracking
├── content.js                 # Content script for page analysis
├── popup.html                 # Extension popup UI
├── popup.css                  # Popup styles
├── popup.js                   # Popup functionality
├── icons/                     # Extension icons
│   ├── icon16.svg
│   ├── icon48.svg
│   └── icon128.svg
├── server/                    # Express.js backend
│   ├── index.js              # Server entry point
│   ├── package.json          # Server dependencies
│   ├── models/               # MongoDB models
│   │   ├── TrackingSession.js
│   │   └── User.js
│   ├── routes/               # API routes
│   │   ├── tracking.js
│   │   ├── analytics.js
│   │   └── users.js
│   └── env.example           # Environment variables template
└── client/                   # React frontend
    ├── src/
    │   ├── App.js           # Main app component
    │   ├── components/      # React components
    │   │   ├── Navigation.js
    │   │   ├── Dashboard.js
    │   │   ├── Analytics.js
    │   │   └── Settings.js
    │   ├── services/        # API services
    │   │   └── api.js
    │   └── utils/           # Utility functions
    │       └── helpers.js
    └── package.json         # Client dependencies
```

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- Chrome browser for extension testing

### 1. Backend Setup (Express.js + MongoDB)

```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp env.example .env

# Edit .env file with your MongoDB connection string
# MONGODB_URI=mongodb://localhost:27017/timetracker

# Start the server
npm run dev
```

The server will run on `http://localhost:5000`

### 2. Frontend Setup (React)

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start the development server
npm start
```

The React app will run on `http://localhost:3000`

### 3. Chrome Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the root directory (`Chrome_extension_cursor`)
4. The extension should now appear in your extensions list
5. Click the extension icon in the toolbar to open the popup

## API Endpoints

### Tracking API
- `POST /api/tracking` - Create tracking session
- `GET /api/tracking/:userId` - Get user sessions
- `GET /api/tracking/:userId/summary` - Get user summary
- `DELETE /api/tracking/:userId` - Delete user data

### Analytics API
- `GET /api/analytics/:userId/dashboard` - Get dashboard data
- `GET /api/analytics/:userId/trends` - Get trends data
- `GET /api/analytics/:userId/insights` - Get insights and recommendations

### User API
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId/settings` - Update user settings
- `POST /api/users/:userId/categories` - Add category domains
- `DELETE /api/users/:userId/categories` - Remove category domains
- `GET /api/users/:userId/stats` - Get user statistics

## Usage

### Chrome Extension
1. **Installation**: Load the extension in Chrome developer mode
2. **Automatic Tracking**: The extension automatically starts tracking when installed
3. **View Analytics**: Click the extension icon to see your current stats
4. **Settings**: Use the settings tab to customize site categories
5. **Export Data**: Export your data for external analysis

### Web Dashboard
1. **Access Dashboard**: Open `http://localhost:3000` in your browser
2. **View Analytics**: Navigate through different analytics views
3. **Customize Settings**: Manage your tracking preferences and site categories
4. **Monitor Progress**: Track your productivity goals and trends

## Site Categorization

The extension automatically categorizes websites into:

- **Productive**: GitHub, Stack Overflow, Google Docs, LinkedIn, etc.
- **Social**: Facebook, Twitter, Instagram, Reddit, etc.
- **Entertainment**: YouTube, Netflix, Spotify, Twitch, etc.
- **News**: CNN, BBC, Reuters, etc.
- **Shopping**: Amazon, eBay, etc.
- **Other**: Unclassified sites

You can customize these categories in the settings.

## Data Privacy

- All data is stored locally in Chrome storage
- Data is sent to your local server (not external services)
- You have full control over your data
- Export and delete functionality available

## Development

### Adding New Features
1. **Extension**: Modify `background.js`, `content.js`, or `popup.js`
2. **Backend**: Add new routes in `server/routes/` and models in `server/models/`
3. **Frontend**: Create new components in `client/src/components/`

### Testing
- Test the extension in Chrome developer mode
- Use browser dev tools to debug
- Check server logs for API issues
- Use React dev tools for frontend debugging

## Troubleshooting

### Common Issues

1. **Extension not loading**: Check manifest.json syntax
2. **API connection failed**: Ensure server is running on port 5000
3. **MongoDB connection error**: Check MongoDB is running and connection string is correct
4. **CORS errors**: Verify CORS settings in server configuration

### Debug Steps
1. Check browser console for errors
2. Verify server logs
3. Test API endpoints with Postman/curl
4. Check Chrome extension console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the code comments
3. Open an issue on GitHub
4. Check the API documentation

---

**Note**: This is a development/demo version. For production use, consider adding authentication, data encryption, and additional security measures.
