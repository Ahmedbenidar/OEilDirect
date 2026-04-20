package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.model.DemandeRDV;
import org.example.backend.model.Ordonnance;
import org.example.backend.model.StatutDemande;
import org.example.backend.model.TestVisuel;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.DemandeRDVRepository;
import org.example.backend.repository.OrdonnanceRepository;
import org.example.backend.repository.TestVisuelRepository;
import org.example.backend.repository.UtilisateurRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MedecinService {

    private final UtilisateurRepository utilisateurRepository;
    private final DemandeRDVRepository demandeRDVRepository;
    private final TestVisuelRepository testVisuelRepository;
    private final OrdonnanceRepository ordonnanceRepository;

    public List<DemandeRDV> listerDemandesAValider(Long medecinId) {
        Utilisateur medecin = utilisateurRepository.findById(medecinId)
                .orElseThrow(() -> new ResourceNotFoundException("Medecin introuvable: " + medecinId));
        List<DemandeRDV> demandes = demandeRDVRepository.findByPraticienAndStatut(medecin, StatutDemande.EN_ATTENTE_MEDECIN);
        demandes.sort(Comparator.comparing(DemandeRDV::getDateCreation, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return demandes;
    }

    public List<DemandeRDV> toutesDemandesEnAttenteMedecin() {
        List<DemandeRDV> demandes = demandeRDVRepository.findByStatut(StatutDemande.EN_ATTENTE_MEDECIN);
        demandes.sort(Comparator.comparing(DemandeRDV::getDateCreation, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return demandes;
    }

    public List<DemandeRDV> listerTestsTermines(Long medecinId) {
        Utilisateur medecin = utilisateurRepository.findById(medecinId)
                .orElseThrow(() -> new ResourceNotFoundException("Medecin introuvable: " + medecinId));
        List<DemandeRDV> demandes = demandeRDVRepository.findByPraticienAndStatut(medecin, StatutDemande.TEST_TERMINE);
        demandes.sort(Comparator.comparing(DemandeRDV::getDateCreation, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return demandes;
    }

    public TestVisuel getResultatTest(Long demandeId) {
        DemandeRDV demande = demandeRDVRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable: " + demandeId));
        return testVisuelRepository.findByDemande(demande)
                .orElseThrow(() -> new ResourceNotFoundException("Aucun resultat de test pour cette demande."));
    }

    public List<DemandeRDV> listerToutesDemandes(Long medecinId) {
        Utilisateur medecin = utilisateurRepository.findById(medecinId)
                .orElseThrow(() -> new ResourceNotFoundException("Medecin introuvable: " + medecinId));
        return demandeRDVRepository.findByPraticien(medecin);
    }

    public List<Ordonnance> listerOrdonnancesMedecin(Long medecinId) {
        Utilisateur medecin = utilisateurRepository.findById(medecinId)
                .orElseThrow(() -> new ResourceNotFoundException("Medecin introuvable: " + medecinId));
        return ordonnanceRepository.findByDemandePraticien(medecin);
    }

    @Transactional
    public TestVisuel prescrireTest(Long demandeId) {
        DemandeRDV demande = demandeRDVRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable: " + demandeId));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE_MEDECIN) {
            throw new IllegalStateException("La demande n est pas en attente du medecin.");
        }

        TestVisuel test = TestVisuel.builder()
                .demande(demande)
                .conditionsValidees(false)
                .score(null)
                .recommandationsIA(null)
                .build();

        demande.setStatut(StatutDemande.TEST_PRESCRIT);
        demandeRDVRepository.save(demande);

        return testVisuelRepository.save(test);
    }

    @Transactional
    public Ordonnance genererOrdonnance(Long demandeId, String diagnostic, String medicaments) {
        DemandeRDV demande = demandeRDVRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable: " + demandeId));

        TestVisuel test = testVisuelRepository.findByDemande(demande)
                .orElseThrow(() -> new ResourceNotFoundException("Aucun resultat de test pour cette demande."));

        if (demande.getStatut() != StatutDemande.TEST_TERMINE) {
            throw new IllegalStateException("Le test visuel n est pas encore termine.");
        }

        String analyseIA = test.getRecommandationsIA() != null ? test.getRecommandationsIA() : "";
        String contenu = diagnostic + "\nScore obtenu : " + test.getScore() + "/15\n" + analyseIA;

        Ordonnance ordonnance = Ordonnance.builder()
                .demande(demande)
                .contenuMedical(contenu)
                .medicaments(medicaments)
                .score(test.getScore())
                .cheminFichierPdf("pdf/ordonnance_" + demandeId + ".pdf")
                .dateCreation(LocalDateTime.now())
                .build();

        demande.setStatut(StatutDemande.ORDONNANCE_DELIVREE);
        demandeRDVRepository.save(demande);

        return ordonnanceRepository.save(ordonnance);
    }
}