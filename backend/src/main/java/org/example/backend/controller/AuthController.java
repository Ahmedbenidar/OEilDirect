package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.example.backend.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UtilisateurRepository utilisateurRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

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
                .motDePasse(passwordEncoder.encode(motDePasse))
                .role(Role.PATIENT)
                .build();

        Utilisateur saved = utilisateurRepository.save(utilisateur);
        String token = jwtService.generateToken(saved);
        return new ResponseEntity<>(Map.of(
                "token", token,
                "utilisateur", toUtilisateurMap(saved)
        ), HttpStatus.CREATED);
    }

    @PostMapping("/connexion")
    public ResponseEntity<?> connexion(@RequestBody Map<String, String> body) {
        String email = normalizeEmail(body.get("email"));
        String motDePasse = normalizePassword(body.get("motDePasse"));

        if (email == null || email.isEmpty() || motDePasse == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erreur", "Email ou mot de passe incorrect."));
        }

        Optional<Utilisateur> optional = utilisateurRepository.findByEmailIgnoreCase(email);
        if (optional.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erreur", "Email ou mot de passe incorrect."));
        }

        Utilisateur u = optional.get();
        String stored = u.getMotDePasse();
        boolean valid = false;
        if (stored != null && stored.startsWith("$2")) {
            valid = passwordEncoder.matches(motDePasse, stored);
        } else if (Objects.equals(stored, motDePasse)) {
            valid = true;
            u.setMotDePasse(passwordEncoder.encode(motDePasse));
            utilisateurRepository.save(u);
        }

        if (!valid) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("erreur", "Email ou mot de passe incorrect."));
        }

        String token = jwtService.generateToken(u);
        return ResponseEntity.ok(Map.of(
                "token", token,
                "utilisateur", toUtilisateurMap(u)
        ));
    }

    private static Map<String, Object> toUtilisateurMap(Utilisateur u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("nom", u.getNom());
        if (u.getPrenom() != null) {
            m.put("prenom", u.getPrenom());
        }
        m.put("email", u.getEmail());
        m.put("role", u.getRole().name());
        if (u.getAge() != null) {
            m.put("age", u.getAge());
        }
        if (u.getSpecialite() != null) {
            m.put("specialite", u.getSpecialite());
        }
        if (u.getTelephone() != null) {
            m.put("telephone", u.getTelephone());
        }
        if (u.getCin() != null) {
            m.put("cin", u.getCin());
        }
        if (u.getPhotoProfil() != null) {
            m.put("photoProfil", u.getPhotoProfil());
        }
        if (u.getJoursConsultationHebdo() != null) {
            m.put("joursConsultationHebdo", u.getJoursConsultationHebdo());
        }
        if (u.getDatesJoursOff() != null) {
            m.put("datesJoursOff", u.getDatesJoursOff());
        }
        if (u.getDatesDisponibles() != null) {
            m.put("datesDisponibles", u.getDatesDisponibles());
        }
        return m;
    }

    private static String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private static String normalizePassword(String password) {
        return password == null ? null : password.trim();
    }
}
