package org.example.backend.controller;

import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.example.backend.security.JwtService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentMatchers;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AuthControllerWebTest {

    @Mock
    UtilisateurRepository utilisateurRepository;

    @Mock
    PasswordEncoder passwordEncoder;

    @Mock
    JwtService jwtService;

    @InjectMocks
    AuthController authController;

    @Test
    void inscription_creeCompte_patient() {
        when(utilisateurRepository.findByEmailIgnoreCase("user@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode(anyString())).thenReturn("ENC_HASH");
        when(jwtService.generateToken(ArgumentMatchers.any(Utilisateur.class))).thenReturn("jwt-token");
        when(utilisateurRepository.save(ArgumentMatchers.any(Utilisateur.class))).thenAnswer(inv -> {
            Utilisateur u = inv.getArgument(0);
            u.setId(10L);
            return u;
        });

        ResponseEntity<?> res = authController.inscription(Map.of(
                "nom", "Test User",
                "email", "USER@Test.com",
                "motDePasse", " secret "
        ));
        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        assertTrue(res.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) res.getBody();
        assertEquals("jwt-token", body.get("token"));
        assertTrue(body.get("utilisateur") instanceof Map);
        Map<?, ?> user = (Map<?, ?>) body.get("utilisateur");
        assertEquals(10L, ((Number) user.get("id")).longValue());
        assertEquals("PATIENT", user.get("role"));
        assertEquals("user@test.com", user.get("email"));
        verify(passwordEncoder).encode("secret");
    }

    @Test
    void inscription_champsManquants_retourne400() {
        ResponseEntity<?> res = authController.inscription(Map.of("email", "a@test.com"));
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertTrue(res.getBody() instanceof Map);
        assertTrue(((Map<?, ?>) res.getBody()).get("erreur").toString().contains("Champs"));
    }

    @Test
    void inscription_emailExistant_retourne409() {
        when(utilisateurRepository.findByEmailIgnoreCase("a@test.com"))
                .thenReturn(Optional.of(Utilisateur.builder().id(1L).build()));

        ResponseEntity<?> res = authController.inscription(Map.of(
                "nom", "A",
                "email", "a@test.com",
                "motDePasse", "pwd"
        ));
        assertEquals(HttpStatus.CONFLICT, res.getStatusCode());
        assertTrue(res.getBody().toString().contains("existe"));
    }

    @Test
    void connexion_invalide_retourne401() {
        ResponseEntity<?> res = authController.connexion(Map.of(
                "email", "  ",
                "motDePasse", "x"
        ));
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
        assertTrue(res.getBody().toString().contains("incorrect"));
    }

    @Test
    void connexion_ok_retourneTokenEtUtilisateur() {
        Utilisateur u = Utilisateur.builder()
                .id(7L)
                .nom("Jean")
                .email("jean@test.com")
                .motDePasse("$2a$10$hashed")
                .role(Role.PATIENT)
                .build();
        when(utilisateurRepository.findByEmailIgnoreCase("jean@test.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.matches("password", "$2a$10$hashed")).thenReturn(true);
        when(jwtService.generateToken(u)).thenReturn("access-token");

        ResponseEntity<?> res = authController.connexion(Map.of(
                "email", "jean@test.com",
                "motDePasse", "password"
        ));
        assertEquals(HttpStatus.OK, res.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) res.getBody();
        assertEquals("access-token", body.get("token"));
        Map<?, ?> out = (Map<?, ?>) body.get("utilisateur");
        assertEquals(7L, ((Number) out.get("id")).longValue());
        assertEquals("jean@test.com", out.get("email"));
    }

    @Test
    void connexion_motDePasseEnClair_migreVersBCrypt() {
        Utilisateur u = Utilisateur.builder()
                .id(7L)
                .nom("Jean")
                .email("jean@test.com")
                .motDePasse("plain")
                .role(Role.PATIENT)
                .build();
        when(utilisateurRepository.findByEmailIgnoreCase("jean@test.com")).thenReturn(Optional.of(u));
        when(passwordEncoder.encode("plain")).thenReturn("NEW_HASH");
        when(utilisateurRepository.save(any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken(any(Utilisateur.class))).thenReturn("tok");

        ResponseEntity<?> res = authController.connexion(Map.of(
                "email", "jean@test.com",
                "motDePasse", "plain"
        ));
        assertEquals(HttpStatus.OK, res.getStatusCode());
        verify(passwordEncoder).encode("plain");
    }
}
