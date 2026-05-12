package org.example.backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
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

import java.util.Map;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class AuthControllerWebTest {

    @Mock
    UtilisateurRepository utilisateurRepository;

    @InjectMocks
    AuthController authController;

    private final ObjectMapper om = new ObjectMapper();

    @Test
    void inscription_creeCompte_patient() throws Exception {
        when(utilisateurRepository.findByEmailIgnoreCase("user@test.com")).thenReturn(Optional.empty());
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
        assertTrue(res.getBody() instanceof Utilisateur);
        Utilisateur saved = (Utilisateur) res.getBody();
        assertEquals(10L, saved.getId());
        assertEquals(Role.PATIENT, saved.getRole());
        assertEquals("user@test.com", saved.getEmail());
    }

    @Test
    void inscription_champsManquants_retourne400() throws Exception {
        ResponseEntity<?> res = authController.inscription(Map.of("email", "a@test.com"));
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
        assertTrue(res.getBody() instanceof Map);
        assertTrue(((Map<?, ?>) res.getBody()).get("erreur").toString().contains("Champs"));
    }

    @Test
    void inscription_emailExistant_retourne409() throws Exception {
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
    void connexion_invalide_retourne401() throws Exception {
        ResponseEntity<?> res = authController.connexion(Map.of(
                "email", "  ",
                "motDePasse", "x"
        ));
        assertEquals(HttpStatus.UNAUTHORIZED, res.getStatusCode());
        assertTrue(res.getBody().toString().contains("incorrect"));
    }

    @Test
    void connexion_ok_retourneUtilisateur_sansMotDePasse() throws Exception {
        Utilisateur u = Utilisateur.builder()
                .id(7L)
                .nom("Jean")
                .email("jean@test.com")
                .motDePasse("password")
                .role(Role.PATIENT)
                .build();
        when(utilisateurRepository.findByEmailIgnoreCase("jean@test.com")).thenReturn(Optional.of(u));

        ResponseEntity<?> res = authController.connexion(Map.of(
                "email", "jean@test.com",
                "motDePasse", "password"
        ));
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertTrue(res.getBody() instanceof Utilisateur);
        Utilisateur out = (Utilisateur) res.getBody();
        assertEquals(7L, out.getId());
        assertEquals("jean@test.com", out.getEmail());
    }
}

