package org.example.backend.repository;

import org.example.backend.model.DemandeRDV;
import org.example.backend.model.Ordonnance;
import org.example.backend.model.Utilisateur;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrdonnanceRepository extends JpaRepository<Ordonnance, Long> {
    Optional<Ordonnance> findByDemande(DemandeRDV demande);
    List<Ordonnance> findByDemandePraticien(Utilisateur praticien);
}
