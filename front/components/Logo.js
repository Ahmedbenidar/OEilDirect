/**
 * Logo.js — Composant logo ŒilDirect réutilisable
 * Usage : <Logo height={40} className="..." />
 */
import Image from 'next/image';

export default function Logo({ height = 40, className = '', style = {} }) {
    return (
        <Image
            src="/logos/logo_cabinet.png"
            alt="ŒilDirect Logo"
            width={height * 3.2}
            height={height}
            className={className}
            style={{ objectFit: 'contain', ...style }}
            priority
        />
    );
}
