package org.example.backend.repository;

import org.example.backend.model.DemandeRDV;
import org.example.backend.model.TestVisuel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TestVisuelRepository extends JpaRepository<TestVisuel, Long> {
    Optional<TestVisuel> findByDemande(DemandeRDV demande);
}
