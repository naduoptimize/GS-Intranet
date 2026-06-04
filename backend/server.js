const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
});

app.set('io', io);
const userSockets = {};
app.set('userSockets', userSockets);

io.on('connection', (socket) => {
    socket.on('register', (data) => {
        if (!data) return;
        // Support both single userId string and object with details
        const { userId, role, department } = typeof data === 'object' ? data : { userId: data };
        if (!userId) return;
        
        socket.userId = userId;
        socket.join(`user:${userId}`);
        if (role) socket.join(`role:${role}`);
        if (department) socket.join(`dept:${department.toLowerCase()}`);
        
        if (!userSockets[userId]) userSockets[userId] = [];
        if (!userSockets[userId].includes(socket.id)) {
            userSockets[userId].push(socket.id);
        }
        console.log(`User ${userId} registered and joined rooms (Role: ${role}, Dept: ${department})`);
    });

    socket.on('disconnect', () => {
        if (socket.userId && userSockets[socket.userId]) {
            userSockets[socket.userId] = userSockets[socket.userId].filter(id => id !== socket.id);
            if (userSockets[socket.userId].length === 0) {
                delete userSockets[socket.userId];
            }
        }
    });
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Basic Route
app.get('/', (req, res) => {
    res.send('GS Intranet API is running...');
});

// Import Routes
const authRoutes = require('./routes/auth');
const postRoutes = require('./routes/posts');
const subsidiaryRoutes = require('./routes/subsidiaries');
const docRoutes = require('./routes/documents');
const userRoutes = require('./routes/users');
const analyticsRoutes = require('./routes/analytics');
const holidayRoutes = require('./routes/holidays');
const newsRoutes = require('./routes/news');
const memoriesRoutes = require('./routes/memories');
const messageRoutes = require('./routes/messages');
const ticketRoutes = require('./routes/tickets');
const factsRoutes = require('./routes/facts');
const joinersRoutes = require('./routes/joiners');
const notificationsRoutes = require('./routes/notifications');
const alertsRoutes = require('./routes/alerts');
const offersRoutes = require('./routes/offers');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/subsidiaries', subsidiaryRoutes);
app.use('/api/documents', docRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/memories', memoriesRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/facts', factsRoutes);
app.use('/api/joiners', joinersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/uploads', require('./routes/uploads'));

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} (with Socket.IO enabled)`);
});

// End of server.js
