import { createContext, useContext, useState, useEffect } from 'react';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('gs_user');
        try {
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            console.error("Failed to parse stored user", e);
            return null;
        }
    });
    const [loading] = useState(false);

    useEffect(() => {
        if (user?.id) {
            fetch(`http://localhost:5000/api/users/${user.id}`)
                .then(res => {
                    if (!res.ok) throw new Error();
                    return res.json();
                })
                .then(updatedData => {
                    const hasChanged = 
                        updatedData.subsidiary_id !== user.subsidiary_id ||
                        updatedData.subsidiary_name !== user.subsidiary_name ||
                        updatedData.role !== user.role ||
                        updatedData.department !== user.department ||
                        updatedData.full_name !== user.full_name;
                        
                    if (hasChanged) {
                        const newUser = {
                            ...user,
                            subsidiary_id: updatedData.subsidiary_id,
                            subsidiary_name: updatedData.subsidiary_name,
                            role: updatedData.role,
                            department: updatedData.department,
                            full_name: updatedData.full_name,
                            profile_pic: updatedData.profile_pic
                        };
                        setUser(newUser);
                        localStorage.setItem('gs_user', JSON.stringify(newUser));
                        console.log('Session self-healed successfully!');
                    }
                })
                .catch(err => console.error('Failed to sync session', err));
        }
    }, [user?.id]);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem('gs_user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('gs_user');
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
