import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
    const { user } = useAuth();
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);

    useEffect(() => {
        if (!user?.id) {
            if (socket) {
                socket.disconnect();
                setSocket(null);
                setConnected(false);
            }
            return;
        }

        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const socketInstance = io(backendUrl, {
            autoConnect: true,
            reconnection: true
        });

        socketInstance.on('connect', () => {
            console.log('Socket.IO connected:', socketInstance.id);
            setConnected(true);
            
            // Register user identity with backend to join room channels
            socketInstance.emit('register', {
                userId: user.id,
                role: user.role,
                department: user.department
            });
        });

        socketInstance.on('disconnect', () => {
            console.log('Socket.IO disconnected');
            setConnected(false);
        });

        setSocket(socketInstance);

        return () => {
            socketInstance.disconnect();
        };
    }, [user?.id, user?.role, user?.department]);

    return (
        <SocketContext.Provider value={{ socket, connected }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
