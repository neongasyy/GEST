import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';

import { getCurrentUser, login as apiLogin, type User } from '../api/auth';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setIsLoading(false);
            return;
        }
        getCurrentUser()
            .then(setUser)
            .catch(() => {
                localStorage.removeItem('access_token')
            })
            .finally(() => setIsLoading(false));
    }, []);

    async function login(email: string, password: string) {
        const token = await apiLogin(email, password)
        localStorage.setItem('access_token', token);
        const currentUser = await getCurrentUser();
        setUser(currentUser);
    }

    function logout() {
        localStorage.removeItem('access_token');
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}