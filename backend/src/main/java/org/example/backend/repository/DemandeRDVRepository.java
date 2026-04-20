package org.example.backend.repository;

import org.example.backend.model.DemandeRDV;
import org.example.backend.model.StatutDemande;
import org.example.backend.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DemandeRDVRepository extends JpaRepository<DemandeRDV, Long> {
    List<DemandeRDV> findByStatut(StatutDemande statut);
    List<DemandeRDV> findByPraticienAndStatut(Utilisateur praticien, StatutDemande statut);
    List<DemandeRDV> findByPatient(Utilisateur patient);
    List<DemandeRDV> findByPraticien(Utilisateur praticien);
}
