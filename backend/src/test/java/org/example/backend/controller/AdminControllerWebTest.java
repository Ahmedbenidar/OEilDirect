package org.example.backend.controller;

import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AdminControllerWebTest {

    @Mock
    UtilisateurRepository utilisateurRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @InjectMocks
    AdminController adminController;

    @Test
    void stats_compteLesRoles() throws Exception {
        when(utilisateurRepository.findAll()).thenReturn(List.of(
                Utilisateur.builder().id(1L).role(Role.PATIENT).build(),
                Utilisateur.builder().id(2L).role(Role.MEDECIN).build(),
                Utilisateur.builder().id(3L).role(Role.MEDECIN).build(),
                Utilisateur.builder().id(4L).role(Role.SECRETAIRE).build()
        ));

        ResponseEntity<Map<String, Long>> res = adminController.getStats();
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(1L, res.getBody().get("patients"));
        assertEquals(2L, res.getBody().get("medecins"));
        assertEquals(1L, res.getBody().get("secretaires"));
    }

    @Test
    void creerUtilisateur_roleInvalide_retourne400() throws Exception {
        ResponseEntity<?> res = adminController.creerUtilisateur(Map.of(
                "nom", "A",
                "email", "a@test.com",
                "motDePasse", "pwd",
                "role", "unknown"
        ));
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
    }

    @Test
    void creerUtilisateur_ok_retourne201() throws Exception {
        when(utilisateurRepository.findByEmailIgnoreCase("m@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("ENC_pwd");
        when(utilisateurRepository.save(ArgumentMatchers.any(Utilisateur.class))).thenAnswer(inv -> {
            Utilisateur u = inv.getArgument(0);
            u.setId(99L);
            return u;
        });

        ResponseEntity<?> res = adminController.creerUtilisateur(Map.of(
                "nom", "Med",
                "prenom", "Doc",
                "email", "m@test.com",
                "motDePasse", "pwd",
                "role", "medecin",
                "age", "42"
        ));
        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        assertTrue(res.getBody() instanceof Utilisateur);
        assertEquals(Role.MEDECIN, ((Utilisateur) res.getBody()).getRole());
        verify(passwordEncoder).encode("pwd");
    }

    @Test
    void modifierUtilisateur_notFound_retourne404() throws Exception {
        when(utilisateurRepository.findById(123L)).thenReturn(Optional.empty());

        ResponseEntity<?> res = adminController.modifierUtilisateur(123L, Map.of("nom", "X"));
        assertEquals(HttpStatus.NOT_FOUND, res.getStatusCode());
    }
}

