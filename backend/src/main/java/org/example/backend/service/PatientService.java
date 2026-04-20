package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.model.*;
import org.example.backend.repository.DemandeRDVRepository;
import org.example.backend.repository.OrdonnanceRepository;
import org.example.backend.repository.TestVisuelRepository;
import org.example.backend.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final UtilisateurRepository utilisateurRepository;
    private final DemandeRDVRepository demandeRDVRepository;
    private final TestVisuelRepository testVisuelRepository;
    private final OrdonnanceRepository ordonnanceRepository;

    @Transactional
    public DemandeRDV creerDemande(Long patientId, Long praticienId, String motif) {
        Utilisateur patient = utilisateurRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient introuvable avec l id: " + patientId));
        Utilisateur praticien = utilisateurRepository.findById(praticienId)
                .orElseThrow(() -> new ResourceNotFoundException("Praticien introuvable avec l id: " + praticienId));

        DemandeRDV demande = DemandeRDV.builder()
                .patient(patient)
                .praticien(praticien)
                .motif(motif)
                .statut(StatutDemande.EN_ATTENTE_SECRETAIRE)
                .paiementEffectue(true)
                .dateCreation(LocalDateTime.now())
                .build();

        return demandeRDVRepository.save(demande);
    }

    @Transactional
    public TestVisuel validerConditionsTest(Long testId, boolean visage, boolean lunettes, float distance) {
        TestVisuel test = testVisuelRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test visuel introuvable avec l id: " + testId));

        boolean conditionsOk = visage && !lunettes && (distance >= 0.8 && distance <= 1.2);
        test.setConditionsValidees(conditionsOk);
        if (!conditionsOk) {
            test.setRecommandationsIA("Veuillez vous assurer d etre face a l ecran, sans lunettes, a environ 1 metre de distance.");
        } else {
            test.setRecommandationsIA("Conditions optimales. Vous pouvez commencer le test.");
        }
        return testVisuelRepository.save(test);
    }

    @Transactional
    public TestVisuel soumettreResultatsTest(Long testId, int score) {
        TestVisuel test = testVisuelRepository.findById(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test visuel introuvable avec l id: " + testId));

        if (!test.isConditionsValidees()) {
            throw new IllegalStateException("Impossible de soumettre les resultats : les conditions du test n ont pas ete validees.");
        }

        test.setScore(score);
        test.setDateRealisation(LocalDateTime.now());
        test.setRecommandationsIA(genererRecommandationsIA(score));
        TestVisuel savedTest = testVisuelRepository.save(test);

        DemandeRDV demande = test.getDemande();
        demande.setStatut(StatutDemande.TEST_TERMINE);
        demandeRDVRepository.save(demande);

        return savedTest;
    }

    @Transactional
    public TestVisuel soumettreResultatsTestParDemande(Long demandeId, int score) {
        DemandeRDV demande = demandeRDVRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable avec l id: " + demandeId));

        TestVisuel test = testVisuelRepository.findByDemande(demande)
                .orElseThrow(() -> new ResourceNotFoundException("Aucun test visuel lie a cette demande."));

        test.setConditionsValidees(true);
        test.setScore(score);
        test.setDateRealisation(LocalDateTime.now());
        test.setRecommandationsIA(genererRecommandationsIA(score));

        TestVisuel savedTest = testVisuelRepository.save(test);

        demande.setStatut(StatutDemande.TEST_TERMINE);
        demandeRDVRepository.save(demande);

        return savedTest;
    }

    /**
     * Note /10 pour le texte d'analyse : 10/10 seulement si 14 ou 15 bonnes reponses sur 15.
     */
    private static int noteSur10PourIA(int score15) {
        int s = Math.min(15, Math.max(0, score15));
        if (s >= 14) {
            return 10;
        }
        int note = (int) Math.round((s + 2) * 10.0 / 15.0);
        if (note >= 10) {
            note = 9;
        }
        return Math.max(0, note);
    }

    private String genererRecommandationsIA(int score) {
        int n10 = noteSur10PourIA(score);
        if (score >= 14) {
            return "Vision excellente (" + n10 + "/10). Resultat " + score + "/15 au test. Aucune correction necessaire. Controle recommande dans 2 ans.";
        }
        if (score >= 10) {
            return "Bonne vision (" + n10 + "/10). Resultat " + score + "/15 au test. Consultation ophtalmologique conseillee si symptomes.";
        }
        if (score >= 7) {
            return "Vision moyenne (" + n10 + "/10). Resultat " + score + "/15 au test. Fatigue visuelle possible. Consultation conseillee.";
        }
        return "Vision faible (" + n10 + "/10). Resultat " + score + "/15 au test. Correction optique recommandee. Consultation urgente.";
    }
}