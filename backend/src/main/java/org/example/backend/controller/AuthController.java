package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UtilisateurRepository utilisateurRepository;

    @PostMapping("/inscription")
    public ResponseEntity<?> inscription(@RequestBody Map<String, String> body) {
        String nom = body.get("nom");
        String email = normalizeEmail(body.get("email"));
        String motDePasse = normalizePassword(body.get("motDePasse"));

        if (nom == null || email == null || email.isEmpty() || motDePasse == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Champs manquants"));
        }

        if (utilisateurRepository.findByEmailIgnoreCase(email).isPresent()) {
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
        String email = normalizeEmail(body.get("email"));
        String motDePasse = normalizePassword(body.get("motDePasse"));

        if (email == null || email.isEmpty() || motDePasse == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erreur", "Email ou mot de passe incorrect."));
        }

        Optional<Utilisateur> utilisateur = utilisateurRepository.findByEmailIgnoreCase(email);

        String stored = utilisateur.map(Utilisateur::getMotDePasse).orElse(null);
        if (utilisateur.isEmpty() || !Objects.equals(stored, motDePasse)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erreur", "Email ou mot de passe incorrect."));
        }

        return ResponseEntity.ok(utilisateur.get());
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private static String normalizePassword(String password) {
        return password == null ? null : password.trim();
    }
}
