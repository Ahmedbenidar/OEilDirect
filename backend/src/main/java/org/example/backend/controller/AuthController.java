package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UtilisateurRepository utilisateurRepository;

    @PostMapping("/inscription")
    public ResponseEntity<?> inscription(@RequestBody Map<String, String> body) {
        String nom = body.get("nom");
        String email = body.get("email");
        String motDePasse = body.get("motDePasse");

        if (nom == null || email == null || motDePasse == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Champs manquants"));
        }

        if (utilisateurRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("erreur", "Un compte avec cet email existe déjà."));
        }

        Utilisateur utilisateur = Utilisateur.builder()
                .nom(nom)
                .email(email)
                .motDePasse(motDePasse) // En prod, utiliser BCrypt
                .role(Role.PATIENT)
                .build();

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        return new ResponseEntity<>(saved, HttpStatus.CREATED);
    }

    @PostMapping("/connexion")
    public ResponseEntity<?> connexion(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String motDePasse = body.get("motDePasse");

        Optional<Utilisateur> utilisateur = utilisateurRepository.findByEmail(email);

        if (utilisateur.isEmpty() || !utilisateur.get().getMotDePasse().equals(motDePasse)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erreur", "Email ou mot de passe incorrect."));
        }

        return ResponseEntity.ok(utilisateur.get());
    }
}
