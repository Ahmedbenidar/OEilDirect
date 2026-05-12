package org.example.backend.controller;

import org.example.backend.model.Role;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.example.backend.service.MedecinService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;

import static org.mockito.Mockito.when;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class MedecinControllerWebTest {

    @Mock
    MedecinService medecinService;

    @Mock
    UtilisateurRepository utilisateurRepository;

    @InjectMocks
    MedecinController medecinController;

    @Test
    void listerMedecins_filtreRole_etExposeChampsPublics() throws Exception {
        Utilisateur med = Utilisateur.builder()
                .id(1L)
                .nom("Dr A")
                .prenom("X")
                .email("doc@test.com")
                .role(Role.MEDECIN)
                .joursConsultationHebdo("[1,2,2,7]")
                .datesJoursOff("[\"2026-05-10\"]")
                .datesDisponibles("bad-json")
                .build();
        Utilisateur patient = Utilisateur.builder().id(2L).nom("P").role(Role.PATIENT).build();
        when(utilisateurRepository.findAll()).thenReturn(List.of(med, patient));

        ResponseEntity<List<Map<String, Object>>> res = medecinController.listerMedecins();
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(1, res.getBody().size());
        Map<String, Object> out = res.getBody().get(0);
        assertEquals(1L, ((Number) out.get("id")).longValue());
        assertEquals("MEDECIN", out.get("role"));
        assertEquals(List.of(1, 2), out.get("joursConsultationHebdo"));
        assertEquals(List.of("2026-05-10"), out.get("datesJoursOff"));
        assertEquals(List.of(), out.get("datesDisponibles"));
    }
}

