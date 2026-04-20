package org.example.backend.service;

import lombok.RequiredArgsConstructor;
import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.model.DemandeRDV;
import org.example.backend.model.StatutDemande;
import org.example.backend.repository.DemandeRDVRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SecretaireService {

    private final DemandeRDVRepository demandeRDVRepository;

    public List<DemandeRDV> listerToutesDemandes() {
        List<DemandeRDV> demandes = demandeRDVRepository.findAll();
        demandes.sort(Comparator.comparing(DemandeRDV::getDateCreation, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return demandes;
    }

    public List<DemandeRDV> listerDemandesEnAttente() {
        List<DemandeRDV> demandes = demandeRDVRepository.findByStatut(StatutDemande.EN_ATTENTE_SECRETAIRE);
        demandes.sort(Comparator.comparing(DemandeRDV::getDateCreation, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
        return demandes;
    }

    @Transactional
    public DemandeRDV validerDemandeAdministrative(Long demandeId) {
        DemandeRDV demande = demandeRDVRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable avec l'id: " + demandeId));

        if (demande.getStatut() != StatutDemande.EN_ATTENTE_SECRETAIRE) {
            throw new IllegalStateException("La demande n'est pas en attente de validation secrétaire.");
        }

        demande.setStatut(StatutDemande.EN_ATTENTE_MEDECIN);
        return demandeRDVRepository.save(demande);
    }

    @Transactional
    public DemandeRDV rejeterDemande(Long demandeId) {
        DemandeRDV demande = demandeRDVRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable avec l'id: " + demandeId));
        demande.setStatut(StatutDemande.REJETEE);
        return demandeRDVRepository.save(demande);
    }

    @Transactional
    public void supprimerDemande(Long demandeId) {
        DemandeRDV demande = demandeRDVRepository.findById(demandeId)
                .orElseThrow(() -> new ResourceNotFoundException("Demande introuvable avec l'id: " + demandeId));
        demandeRDVRepository.delete(demande);
    }
}
