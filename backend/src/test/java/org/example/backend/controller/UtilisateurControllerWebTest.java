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
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class UtilisateurControllerWebTest {

    @Mock
    UtilisateurRepository utilisateurRepository;

    @InjectMocks
    UtilisateurController utilisateurController;

    @Test
    void getProfil_notFound_retourne404() throws Exception {
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResponseStatusException.class, () -> utilisateurController.getProfil(1L));
    }

    @Test
    void getProfil_ok_parseJsonLists() throws Exception {
        Utilisateur u = Utilisateur.builder()
                .id(5L)
                .nom("Doc")
                .role(Role.MEDECIN)
                .joursConsultationHebdo("[1,2,2,99]")
                .datesJoursOff("[\"2026-05-01\",\"2026-05-02\"]")
                .datesDisponibles("not-json")
                .build();
        when(utilisateurRepository.findById(5L)).thenReturn(Optional.of(u));

        ResponseEntity<?> res = utilisateurController.getProfil(5L);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertTrue(res.getBody() instanceof Map);
        Map<?, ?> body = (Map<?, ?>) res.getBody();
        assertEquals(5L, ((Number) body.get("id")).longValue());
        assertEquals(List.of(1, 2), body.get("joursConsultationHebdo"));
        assertEquals(List.of("2026-05-01", "2026-05-02"), body.get("datesJoursOff"));
        assertEquals(List.of(), body.get("datesDisponibles"));
    }

    @Test
    void updateProfil_photoTropVolumineuse_retourne400() throws Exception {
        Utilisateur u = Utilisateur.builder().id(9L).nom("A").role(Role.PATIENT).build();
        when(utilisateurRepository.findById(9L)).thenReturn(Optional.of(u));

        String huge = "x".repeat(2_000_001);
        ResponseEntity<?> res = utilisateurController.updateProfil(9L, Map.of("photoProfil", huge));
        assertEquals(HttpStatus.BAD_REQUEST, res.getStatusCode());
    }

    @Test
    void updateProfil_ok_serializeJsonFields() throws Exception {
        Utilisateur u = Utilisateur.builder().id(11L).nom("Old").role(Role.MEDECIN).build();
        when(utilisateurRepository.findById(11L)).thenReturn(Optional.of(u));
        when(utilisateurRepository.save(ArgumentMatchers.any(Utilisateur.class))).thenAnswer(inv -> inv.getArgument(0));

        ResponseEntity<?> res = utilisateurController.updateProfil(11L, Map.of(
                "nom", "New",
                "joursConsultationHebdo", List.of(1, 3, 5),
                "datesJoursOff", List.of("2026-05-10")
        ));
        assertEquals(HttpStatus.OK, res.getStatusCode());
        Map<?, ?> body = (Map<?, ?>) res.getBody();
        assertEquals("New", body.get("nom"));
        assertEquals(List.of(1, 3, 5), body.get("joursConsultationHebdo"));
        assertEquals(List.of("2026-05-10"), body.get("datesJoursOff"));
    }
}

