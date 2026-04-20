package org.example.backend.config;

import lombok.RequiredArgsConstructor;
import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UtilisateurRepository utilisateurRepository;
    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        // Ensure the role column is VARCHAR to support all enum values including ADMIN
        try {
            jdbcTemplate.execute(
                "ALTER TABLE utilisateur MODIFY COLUMN role VARCHAR(20) NOT NULL"
            );
            System.out.println("=== role column altered to VARCHAR(20) ===");
        } catch (Exception e) {
            System.out.println("=== role column already up to date: " + e.getMessage() + " ===");
        }

        if (utilisateurRepository.count() == 0) {
            Utilisateur patient = Utilisateur.builder()
                    .nom("Jean Dupont")
                    .email("jean@test.com")
                    .motDePasse("password")
                    .role(Role.PATIENT)
                    .build();

            Utilisateur medecin = Utilisateur.builder()
                    .nom("Dr House")
                    .email("doc@test.com")
                    .motDePasse("password")
                    .role(Role.MEDECIN)
                    .build();

            Utilisateur secretaire = Utilisateur.builder()
                    .nom("Sophie Martin")
                    .email("sophie@test.com")
                    .motDePasse("password")
                    .role(Role.SECRETAIRE)
                    .build();

            utilisateurRepository.save(patient);
            utilisateurRepository.save(medecin);
            utilisateurRepository.save(secretaire);

            System.out.println("=== Demo users initialized ===");
        }

        if (utilisateurRepository.findByEmail("admin@test.com").isEmpty()) {
            Utilisateur admin = Utilisateur.builder()
                    .nom("Admin OeilDirect")
                    .email("admin@test.com")
                    .motDePasse("admin123")
                    .role(Role.ADMIN)
                    .build();
            utilisateurRepository.save(admin);
            System.out.println("=== Admin account created: admin@test.com / admin123 ===");
        }
    }
}