package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.model.DemandeRDV;
import org.example.backend.service.SecretaireService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/secretaire")
@RequiredArgsConstructor
public class SecretaireController {

    private final SecretaireService secretaireService;

    @GetMapping("/demandes")
    public ResponseEntity<List<DemandeRDV>> listerToutesDemandes() {
        return ResponseEntity.ok(secretaireService.listerToutesDemandes());
    }

    @GetMapping("/demandes/en-attente")
    public ResponseEntity<List<DemandeRDV>> listerDemandesEnAttente() {
        return ResponseEntity.ok(secretaireService.listerDemandesEnAttente());
    }

    @PostMapping("/demandes/{demandeId}/valider")
    public ResponseEntity<DemandeRDV> validerDemandeAdministrative(@PathVariable Long demandeId) {
        DemandeRDV demande = secretaireService.validerDemandeAdministrative(demandeId);
        return ResponseEntity.ok(demande);
    }

    @PostMapping("/demandes/{demandeId}/rejeter")
    public ResponseEntity<DemandeRDV> rejeterDemande(@PathVariable Long demandeId) {
        DemandeRDV demande = secretaireService.rejeterDemande(demandeId);
        return ResponseEntity.ok(demande);
    }

    @DeleteMapping("/demandes/{demandeId}")
    public ResponseEntity<Void> supprimerDemande(@PathVariable Long demandeId) {
        secretaireService.supprimerDemande(demandeId);
        return ResponseEntity.noContent().build();
    }
}
