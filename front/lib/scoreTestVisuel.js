/**
 * Score brut = bonnes reponses sur 15.
 * Note /10 pour l'analyse : 10/10 seulement si 14 ou 15 sur 15.
 */

export function noteSur10PourIA(score15) {
    const s = Math.max(0, Math.min(15, Number(score15) || 0));
    if (s >= 14) return 10;
    const note = Math.round(((s + 2) * 10) / 15);
    return Math.min(9, Math.max(0, note));
}

export function getMessageAnalyseIA(score15) {
    const s = Math.max(0, Math.min(15, Number(score15) || 0));
    const n10 = noteSur10PourIA(s);
    if (s >= 14) {
        return `Vision excellente (${n10}/10). Resultat ${s}/15 au test. Aucune correction necessaire. Controle recommande dans 2 ans.`;
    }
    if (s >= 10) {
        return `Bonne vision (${n10}/10). Resultat ${s}/15 au test. Consultation ophtalmologique conseillee si symptomes.`;
    }
    if (s >= 7) {
        return `Vision moyenne (${n10}/10). Resultat ${s}/15 au test. Fatigue visuelle possible. Consultation conseillee.`;
    }
    return `Vision faible (${n10}/10). Resultat ${s}/15 au test. Correction optique recommandee. Consultation urgente.`;
}

export function getDiagnosticPropose(score15) {
    const s = Math.max(0, Math.min(15, Number(score15) || 0));
    if (s >= 14) {
        return `Test visuel IA : acuite fonctionnelle excellente (${s}/15). Pas d'anomalie majeure sur cet examen de depistage ; suivi de routine possible.`;
    }
    if (s >= 10) {
        return `Test visuel IA : bonne acuite fonctionnelle (${s}/15). Resultat satisfaisant ; avis ophtalmologique si symptomes ou fatigue visuelle.`;
    }
    if (s >= 7) {
        return `Test visuel IA : acuite fonctionnelle moyenne (${s}/15). Correction a discuter ; consultation ophtalmologique recommandee.`;
    }
    return `Test visuel IA : acuite fonctionnelle faible (${s}/15). Consultation ophtalmologique a programmer en priorite.`;
}