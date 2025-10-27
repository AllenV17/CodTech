# Real-time Document Editor

A collaborative document editor built with the MERN stack, featuring real-time editing capabilities using WebSockets.

## Features

- **Real-time Collaboration**: Multiple users can edit documents simultaneously
- **User Authentication**: Secure signup/signin with JWT tokens
- **Document Management**: Create, edit, delete, and share documents
- **Rich Text Editor**: Powered by ReactQuill with formatting options
- **Collaborator Management**: Add users with read/write permissions
- **Public/Private Documents**: Control document visibility
- **Auto-save**: Automatic saving of changes
- **Modern UI**: Clean, responsive design with Tailwind CSS

## Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React** 18
- **React Router** for navigation
- **Socket.io Client** for real-time updates
- **ReactQuill** for rich text editing
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Hot Toast** for notifications

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd realtime-doc-editor
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Set up environment variables**
   - Copy `config.env` and update the values:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/realtime-doc-editor
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

5. **Start MongoDB**
   - Make sure MongoDB is running on your system
   - Or update `MONGODB_URI` in `config.env` to point to your MongoDB Atlas cluster

## Running the Application

### Development Mode

1. **Start the backend server**
   ```bash
   npm run dev
   ```

2. **Start the frontend (in a new terminal)**
   ```bash
   npm run client
   ```

3. **Or run both simultaneously**
   ```bash
   npm run dev:full
   ```

### Production Mode

1. **Build the frontend**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the production server**
   ```bash
   npm start
   ```

## Usage

1. **Sign Up**: Create a new account with username, email, and password
2. **Sign In**: Login with your credentials
3. **Create Document**: Click "New Document" to create a new document
4. **Edit Document**: Click on any document to start editing
5. **Share Document**: Use the "Share" button to add collaborators
6. **Real-time Collaboration**: Multiple users can edit the same document simultaneously

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Documents
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get single document
- `POST /api/documents` - Create new document
- `PUT /api/documents/:id` - Update document
- `DELETE /api/documents/:id` - Delete document
- `POST /api/documents/:id/collaborators` - Add collaborator

## WebSocket Events

### Client to Server
- `join-document` - Join a document room
- `text-change` - Send text changes
- `cursor-position` - Send cursor position
- `typing` - Send typing status

### Server to Client
- `document-state` - Receive document state
- `text-change` - Receive text changes from other users
- `cursor-position` - Receive cursor positions
- `user-typing` - Receive typing indicators

## Project Structure

```
realtime-doc-editor/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── ...
│   └── package.json
├── models/                 # MongoDB models
├── routes/                 # Express routes
├── middleware/             # Express middleware
├── server.js              # Main server file
└── package.json           # Backend dependencies
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

