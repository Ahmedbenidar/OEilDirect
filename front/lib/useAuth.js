import { useEffect } from 'react';
import { useRouter } from 'next/router';

// Retourne la page de connexion correspondant au rôle
function getLoginPage(role) {
    if (role === 'SECRETAIRE') return '/secretaire/connexion';
    if (role === 'MEDECIN') return '/medecin/connexion';
    if (role === 'ADMIN') return '/connexion';
    return '/connexion'; // PATIENT ou inconnu
}

export function useAuth(roleRequis = null) {
    const router = useRouter();

    useEffect(() => {
        const userStr = localStorage.getItem('oeildirect_user');
        if (!userStr) {
            // Rediriger vers la page de connexion du rôle requis
            router.push(getLoginPage(roleRequis));
            return;
        }
        if (roleRequis) {
            const user = JSON.parse(userStr);
            if (user.role !== roleRequis) {
                router.push(getLoginPage(roleRequis));
            }
        }
    }, []);
}

export function getUser() {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('oeildirect_user');
    return userStr ? JSON.parse(userStr) : null;
}

export function logout(router) {
    localStorage.removeItem('oeildirect_user');
    router.push('/connexion');
}
