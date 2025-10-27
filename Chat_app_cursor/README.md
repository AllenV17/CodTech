# MERN Chat App with Socket.IO

A modern, responsive real-time chat application built with the MERN stack (MongoDB, Express.js, React, Node.js) and Socket.IO for real-time communication.

## Features

- 🔐 **User Authentication** - JWT-based login/register system
- 💬 **Real-time Messaging** - Instant message delivery with Socket.IO
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🎨 **Modern UI** - Beautiful gradient design with smooth animations
- 👥 **Online Users** - See who's currently online
- ⌨️ **Typing Indicators** - Know when someone is typing
- 🔒 **Secure** - Password hashing and token-based authentication

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **CSS3** - Modern styling with gradients and animations

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/chat-app
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the React app:**
   ```bash
   npm start
   ```

## Usage

1. **Register/Login:** Create an account or sign in with existing credentials
2. **Start Chatting:** Send messages in real-time
3. **See Online Users:** View who's currently online
4. **Typing Indicators:** See when someone is typing
5. **Responsive Design:** Works on all device sizes

## API Endpoints

### Authentication
- `POST /api/register` - Register new user
- `POST /api/login` - Login user
- `GET /api/profile` - Get user profile (protected)

### Chat
- `GET /api/messages` - Get chat messages (protected)
- `GET /api/users/online` - Get online users (protected)

### Socket.IO Events
- `join` - Join chat room
- `sendMessage` - Send a message
- `typing` - User is typing
- `stopTyping` - User stopped typing
- `newMessage` - New message received
- `userJoined` - User joined notification
- `userTyping` - Someone is typing
- `userStopTyping` - Someone stopped typing

## Project Structure

```
mern-chat-app/
├── server.js              # Express server with Socket.IO
├── package.json           # Backend dependencies
├── config.env             # Environment variables
└── client/                # React frontend
    ├── public/
    │   ├── index.html
    │   └── manifest.json
    └── src/
        ├── components/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── Chat.js
        │   ├── Auth.css
        │   └── Chat.css
        ├── App.js
        ├── App.css
        ├── index.js
        └── index.css
```

## Features in Detail

### Real-time Communication
- Messages are delivered instantly using Socket.IO
- No page refresh needed
- Automatic reconnection on network issues

### User Experience
- Smooth animations and transitions
- Responsive design for all screen sizes
- Modern gradient UI design
- Typing indicators for better UX

### Security
- Passwords are hashed using bcryptjs
- JWT tokens for authentication
- Protected API routes
- Input validation and sanitization

## Deployment

### Heroku Deployment
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Connect your GitHub repository
4. Deploy!

### Environment Variables for Production
```env
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-production-jwt-secret
PORT=5000
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

---

**Happy Chatting! 🚀**
