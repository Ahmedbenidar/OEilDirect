/**
 * generateOrdonnancePdf.js
 * Génère une ordonnance médicale professionnelle en PDF côté navigateur.
 * Intègre le logo officiel ŒilDirect depuis le dossier public.
 */

async function getLogoBase64() {
    try {
        const response = await fetch('/logos/logo_cabinet.png');
        const blob = await response.blob();
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn('Logo non chargé:', e);
        return null;
    }
}

export async function generateOrdonnancePdf(ordonnance, patient) {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

    const W = 210;
    const H = 297;
    const margin = 18;
    const contentWidth = W - margin * 2;

    // ── Charger le logo
    const logoDataUrl = await getLogoBase64();

    // ── Couleurs
    const bleu = [0, 100, 200];
    const bleuFonce = [0, 55, 120];
    const gris = [100, 100, 110];
    const grisLight = [240, 242, 248];
    const blanc = [255, 255, 255];
    const vert = [16, 185, 129];
    const orange = [245, 158, 11];
    const rouge = [239, 68, 68];

    function niveauColor(label) {
        if (!label) return bleu;
        const l = label.toLowerCase();
        if (l.includes('excellent')) return vert;
        if (l.includes('bon')) return bleu;
        if (l.includes('moyen')) return orange;
        return rouge;
    }

    const scoreColor = niveauColor(ordonnance.label);

    /* ══════════════════════════════════════════════
        EN-TÊTE CABINET
    ══════════════════════════════════════════════ */
    // Bande bleue supérieure
    doc.setFillColor(...bleuFonce);
    doc.rect(0, 0, W, 28, 'F');

    // Logo image (si disponible)
    if (logoDataUrl) {
        try {
            // Logo centré verticalement dans la bande
            doc.addImage(logoDataUrl, 'PNG', margin, 4, 32, 20);
        } catch (e) {
            // Fallback texte si l'image échoue
            doc.setTextColor(...blanc);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.text('ŒilDirect', margin, 17);
        }
    } else {
        doc.setTextColor(...blanc);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('ŒilDirect', margin, 17);
    }

    // Infos cabinet (droite du logo)
    doc.setTextColor(...blanc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Centre d\'Ophtalmologie ŒilDirect', margin + 55, 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Plateforme de télémédecine certifiée — RPPS 10101234567', margin + 55, 15);
    doc.text('12 Avenue de la Santé, 75008 Paris', margin + 55, 19.5);
    doc.text('Tél : 01 23 45 67 89  |  contact@oildirect.fr', margin + 55, 24);

    // Numéro de doc (coin supérieur droit)
    const dateStr = ordonnance.date || new Date().toLocaleDateString('fr-FR');
    doc.setFontSize(7);
    doc.setTextColor(200, 225, 255);
    doc.text(`N° ORD-${Date.now().toString().slice(-7)}`, W - margin, 11, { align: 'right' });
    doc.text(`Émis le : ${dateStr}`, W - margin, 16, { align: 'right' });

    /* ══════════════════════════════════════════════
        TITRE DOCUMENT
    ══════════════════════════════════════════════ */
    let y = 40;
    doc.setTextColor(...bleuFonce);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('COMPTE-RENDU DE TEST VISUEL', W / 2, y, { align: 'center' });
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...gris);
    doc.text('Test d\'acuité visuelle IA — Résultat automatique', W / 2, y + 6, { align: 'center' });

    y += 13;
    doc.setDrawColor(...bleu);
    doc.setLineWidth(0.5);
    doc.line(margin, y, W - margin, y);

    /* ══════════════════════════════════════════════
        INFO PATIENT + MÉDECIN (2 colonnes)
    ══════════════════════════════════════════════ */
    y += 7;
    const col1x = margin;
    const col2x = W / 2 + 5;
    const boxH = 28;

    // Boîte patient
    doc.setFillColor(...grisLight);
    doc.roundedRect(col1x, y, contentWidth / 2 - 4, boxH, 3, 3, 'F');
    doc.setTextColor(...bleuFonce);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PATIENT', col1x + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 60);
    doc.setFontSize(10);
    doc.text(patient?.nom || 'Patient', col1x + 4, y + 13);
    doc.setFontSize(8);
    doc.setTextColor(...gris);
    doc.text(`Email : ${patient?.email || '—'}`, col1x + 4, y + 19);
    doc.text(`ID patient : P-${patient?.id || '0000'}`, col1x + 4, y + 25);

    // Boîte médecin
    doc.setFillColor(...grisLight);
    doc.roundedRect(col2x, y, contentWidth / 2 - 4, boxH, 3, 3, 'F');
    doc.setTextColor(...bleuFonce);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('PRESCRIPTEUR', col2x + 4, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(40, 40, 60);
    doc.setFontSize(10);
    const prescripteurNom = ordonnance.prescripteurNom || 'Dr. —';
    doc.text(prescripteurNom, col2x + 4, y + 13);
    doc.setFontSize(8);
    doc.setTextColor(...gris);
    doc.text('Ordonnance médicale signée', col2x + 4, y + 19);
    doc.text(`Date : ${dateStr}`, col2x + 4, y + 25);

    /* ══════════════════════════════════════════════
        SCORE ACUITÉ VISUELLE
    ══════════════════════════════════════════════ */
    y += boxH + 10;
    doc.setFillColor(...grisLight);
    doc.roundedRect(margin, y, contentWidth, 28, 4, 4, 'F');
    doc.setFillColor(...scoreColor);
    doc.roundedRect(margin, y, 45, 28, 4, 4, 'F');

    doc.setTextColor(...blanc);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(`${ordonnance.score ?? '—'}`, margin + 22, y + 14, { align: 'center' });
    doc.setFontSize(9);
    doc.text('/15', margin + 22, y + 21, { align: 'center' });

    doc.setTextColor(...bleuFonce);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(ordonnance.title || 'Résultat', margin + 52, y + 11);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...gris);
    doc.text(`Niveau : ${ordonnance.label || '—'}`, margin + 52, y + 18);
    doc.text('Test Snellen IA adaptatif — 15 niveaux progressifs', margin + 52, y + 24);

    /* ══════════════════════════════════════════════
        DIAGNOSTIC
    ══════════════════════════════════════════════ */
    y += 38;
    doc.setFillColor(...bleu);
    doc.rect(margin, y, 4, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...bleuFonce);
    doc.text('DIAGNOSTIC', margin + 8, y + 8);

    y += 16;
    doc.setFillColor(...grisLight);
    doc.roundedRect(margin, y, contentWidth, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 60);
    const diagLines = doc.splitTextToSize(ordonnance.diag || '—', contentWidth - 8);
    doc.text(diagLines, margin + 4, y + 6);

    /* ══════════════════════════════════════════════
        CORRECTION OPTIQUE (si nécessaire)
    ══════════════════════════════════════════════ */
    if (ordonnance.corr) {
        y += 22;
        doc.setFillColor(...bleu);
        doc.rect(margin, y, 4, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...bleuFonce);
        doc.text('CORRECTION OPTIQUE ESTIMÉE', margin + 8, y + 8);

        y += 16;
        doc.setFillColor(220, 235, 255);
        doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'F');
        doc.setDrawColor(...bleu);
        doc.setLineWidth(0.5);
        doc.roundedRect(margin, y, contentWidth, 18, 2, 2, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(...bleuFonce);
        doc.text(ordonnance.corr, margin + 5, y + 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...gris);
        doc.text('OD & OG — Valeurs indicatives. Confirmation en cabinet obligatoire.', margin + 5, y + 13);
    }

    /* ══════════════════════════════════════════════
        RECOMMANDATIONS
    ══════════════════════════════════════════════ */
    y += ordonnance.corr ? 26 : 22;
    doc.setFillColor(...bleu);
    doc.rect(margin, y, 4, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...bleuFonce);
    doc.text('RECOMMANDATIONS MÉDICALES', margin + 8, y + 8);

    y += 16;
    doc.setFillColor(...grisLight);
    doc.roundedRect(margin, y, contentWidth, 20, 2, 2, 'F');
    const recoLines = doc.splitTextToSize(ordonnance.reco || '—', contentWidth - 8);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(40, 40, 60);
    doc.text(recoLines, margin + 4, y + 7);

    /* ══════════════════════════════════════════════
        TRAITEMENT / MÉDICAMENTS (si fourni)
    ══════════════════════════════════════════════ */
    if (ordonnance.medicaments && String(ordonnance.medicaments).trim().length > 0) {
        // Estimate needed height based on wrapped lines
        const medsLines = doc.splitTextToSize(String(ordonnance.medicaments), contentWidth - 8);
        const medsBoxH = Math.min(38, Math.max(18, 8 + medsLines.length * 4.5));

        y += 28;
        doc.setFillColor(...bleu);
        doc.rect(margin, y, 4, 12, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...bleuFonce);
        doc.text('TRAITEMENT / MÉDICAMENTS', margin + 8, y + 8);

        y += 16;
        doc.setFillColor(230, 245, 238); // soft green
        doc.roundedRect(margin, y, contentWidth, medsBoxH, 2, 2, 'F');
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(40, 40, 60);
        doc.text(medsLines, margin + 4, y + 7);

        y += medsBoxH - 20;
    }

    /* ══════════════════════════════════════════════
        SIGNATURE / CACHET
    ══════════════════════════════════════════════ */
    y += 20;

    // Cachet du Cabinet (Left)
    doc.setDrawColor(20, 90, 180); // Bleu officiel
    doc.setLineWidth(0.8);
    doc.roundedRect(margin, y, 65, 30, 4, 4, 'S');
    doc.setLineWidth(0.2);
    doc.roundedRect(margin + 1.5, y + 1.5, 62, 27, 2, 2, 'S'); // Double bordure

    if (logoDataUrl) {
        try { doc.addImage(logoDataUrl, 'PNG', margin + 18, y + 3, 28, 12); } catch (e) { }
    }
    doc.setTextColor(20, 90, 180);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('CABINET D\'OPHTALMOLOGIE', margin + 32.5, y + 19, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Plateforme ŒilDirect Certifiée', margin + 32.5, y + 23.5, { align: 'center' });
    doc.text('Télémédecine – Valable 3 mois', margin + 32.5, y + 27.5, { align: 'center' });

    // Signature électronique (Right)
    const sigX = W - margin - 75;

    doc.setFillColor(245, 248, 255);
    doc.setDrawColor(...bleuFonce);
    doc.setLineWidth(0.5);
    doc.roundedRect(sigX, y, 75, 30, 3, 3, 'FD'); // Fond clair + bordure

    doc.setFont('courier', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...bleuFonce);
    doc.text('SIGNATURE ÉLECTRONIQUE', sigX + 37.5, y + 6, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...gris);
    const hash = 'X-AUTH-' + Date.now().toString(16).toUpperCase() + '-' + Math.random().toString(16).slice(2, 8).toUpperCase();
    doc.text(hash, sigX + 37.5, y + 10, { align: 'center' });

    // "Fausse" signature stylisée
    doc.setFont('times', 'italic');
    doc.setFontSize(16);
    doc.setTextColor(0, 100, 200);
    doc.text(prescripteurNom, sigX + 37.5, y + 20, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...gris);
    doc.text('Document généré et certifié par algorithme', sigX + 37.5, y + 26.5, { align: 'center' });


    /* ══════════════════════════════════════════════
        FILIGRANE
    ══════════════════════════════════════════════ */
    if (logoDataUrl) {
        try {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.15 }));
            doc.addImage(logoDataUrl, 'PNG', W / 2 - 25, H / 2 - 15, 50, 31);
            doc.restoreGraphicsState();
        } catch (e) { }
    }

    // Téléchargement
    const patientName = (patient?.nom || 'Patient').replace(/\s+/g, '_');
    const dateSafe = dateStr.replace(/\//g, '-');
    doc.save(`Ordonnance_OeilDirect_${patientName}_${dateSafe}.pdf`);
}
