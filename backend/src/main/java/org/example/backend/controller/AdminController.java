package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UtilisateurRepository utilisateurRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        long patients = utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.PATIENT).count();
        long medecins = utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.MEDECIN).count();
        long secretaires = utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.SECRETAIRE).count();
        return ResponseEntity.ok(Map.of(
                "patients", patients,
                "medecins", medecins,
                "secretaires", secretaires
        ));
    }

    @GetMapping("/patients")
    public ResponseEntity<List<Utilisateur>> getPatients() {
        return ResponseEntity.ok(utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.PATIENT).toList());
    }

    @GetMapping("/medecins")
    public ResponseEntity<List<Utilisateur>> getMedecins() {
        return ResponseEntity.ok(utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.MEDECIN).toList());
    }

    @GetMapping("/secretaires")
    public ResponseEntity<List<Utilisateur>> getSecretaires() {
        return ResponseEntity.ok(utilisateurRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.SECRETAIRE).toList());
    }

    @PostMapping("/utilisateurs")
    public ResponseEntity<?> creerUtilisateur(@RequestBody Map<String, String> body) {
        String nom = body.get("nom");
        String email = body.get("email");
        String motDePasse = body.get("motDePasse");
        String roleStr = body.get("role");

        if (nom == null || email == null || motDePasse == null || roleStr == null) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Champs manquants"));
        }
        if (utilisateurRepository.findByEmail(email).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("erreur", "Un compte avec cet email existe deja."));
        }

        Role role;
        try {
            role = Role.valueOf(roleStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("erreur", "Role invalide"));
        }

        Integer age = parseAge(body.get("age"));

        Utilisateur utilisateur = Utilisateur.builder()
                .nom(nom)
                .prenom(body.get("prenom"))
                .email(email)
                .motDePasse(motDePasse)
                .role(role)
                .age(age)
                .specialite(body.get("specialite"))
                .telephone(body.get("telephone"))
                .cin(body.get("cin"))
                .build();

        return new ResponseEntity<>(utilisateurRepository.save(utilisateur), HttpStatus.CREATED);
    }

    @PutMapping("/utilisateurs/{id}")
    public ResponseEntity<?> modifierUtilisateur(@PathVariable Long id, @RequestBody Map<String, String> body) {
        Optional<Utilisateur> opt = utilisateurRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Utilisateur u = opt.get();

        if (body.containsKey("nom") && body.get("nom") != null) u.setNom(body.get("nom"));
        if (body.containsKey("prenom"))    u.setPrenom(body.get("prenom"));
        if (body.containsKey("specialite")) u.setSpecialite(body.get("specialite"));
        if (body.containsKey("telephone")) u.setTelephone(body.get("telephone"));
        if (body.containsKey("cin"))       u.setCin(body.get("cin"));
        if (body.containsKey("age"))       u.setAge(parseAge(body.get("age")));

        if (body.containsKey("email") && body.get("email") != null) {
            String newEmail = body.get("email");
            if (!newEmail.equals(u.getEmail()) && utilisateurRepository.findByEmail(newEmail).isPresent()) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(Map.of("erreur", "Cet email est deja utilise."));
            }
            u.setEmail(newEmail);
        }
        if (body.containsKey("motDePasse") && body.get("motDePasse") != null && !body.get("motDePasse").isBlank()) {
            u.setMotDePasse(body.get("motDePasse"));
        }

        return ResponseEntity.ok(utilisateurRepository.save(u));
    }

    @DeleteMapping("/utilisateurs/{id}")
    public ResponseEntity<?> supprimerUtilisateur(@PathVariable Long id) {
        if (!utilisateurRepository.existsById(id)) return ResponseEntity.notFound().build();
        utilisateurRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private Integer parseAge(String val) {
        if (val == null || val.isBlank()) return null;
        try { return Integer.parseInt(val); } catch (NumberFormatException e) { return null; }
    }
}