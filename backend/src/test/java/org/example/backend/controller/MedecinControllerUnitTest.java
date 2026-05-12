package org.example.backend.controller;

import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.model.DemandeRDV;
import org.example.backend.model.Ordonnance;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MedecinControllerUnitTest {

    @Mock
    MedecinService medecinService;

    @Mock
    UtilisateurRepository utilisateurRepository;

    @InjectMocks
    MedecinController medecinController;

    @Test
    void listerPatients_medecinIntrouvable_leveNotFound() {
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> medecinController.listerPatients(1L));
    }

    @Test
    void listerPatients_agregeNombreRdv_parPatient() {
        Utilisateur med = Utilisateur.builder().id(1L).build();
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(med));

        Utilisateur p1 = Utilisateur.builder().id(10L).nom("A").prenom("P").email("a@x").telephone("111").build();
        Utilisateur p2 = Utilisateur.builder().id(11L).nom("B").prenom("Q").email("b@x").telephone("222").build();

        DemandeRDV d1 = DemandeRDV.builder().id(100L).patient(p1).build();
        DemandeRDV d2 = DemandeRDV.builder().id(101L).patient(p1).build();
        DemandeRDV d3 = DemandeRDV.builder().id(102L).patient(p2).build();
        DemandeRDV d4 = DemandeRDV.builder().id(103L).patient(null).build(); // skip

        when(medecinService.listerToutesDemandes(1L)).thenReturn(List.of(d1, d2, d3, d4));

        ResponseEntity<List<Map<String, Object>>> res = medecinController.listerPatients(1L);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(2, res.getBody().size());

        Map<String, Object> m1 = res.getBody().stream()
                .filter(m -> ((Number) m.get("id")).longValue() == 10L)
                .findFirst().orElseThrow();
        assertEquals(2, m1.get("nombreRdv"));

        Map<String, Object> m2 = res.getBody().stream()
                .filter(m -> ((Number) m.get("id")).longValue() == 11L)
                .findFirst().orElseThrow();
        assertEquals(1, m2.get("nombreRdv"));
    }

    @Test
    void listerOrdonnances_mappeInfosDemandeEtPatient() {
        Utilisateur med = Utilisateur.builder().id(1L).build();
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(med));

        Utilisateur patient = Utilisateur.builder().id(10L).nom("Doe").prenom("Jane").build();
        DemandeRDV d = DemandeRDV.builder().id(77L).patient(patient).build();
        Ordonnance o = Ordonnance.builder()
                .id(5L)
                .demande(d)
                .score(12)
                .contenuMedical("c")
                .medicaments("m")
                .cheminFichierPdf("pdf/x.pdf")
                .dateCreation(LocalDateTime.now())
                .build();
        when(medecinService.listerOrdonnancesMedecin(1L)).thenReturn(List.of(o));

        ResponseEntity<List<Map<String, Object>>> res = medecinController.listerOrdonnances(1L);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(1, res.getBody().size());
        Map<String, Object> out = res.getBody().get(0);
        assertEquals(5L, ((Number) out.get("id")).longValue());
        assertEquals(77L, ((Number) out.get("demandeId")).longValue());
        assertEquals("Doe", out.get("patientNom"));
        assertEquals("Jane", out.get("patientPrenom"));
    }

    @Test
    void genererOrdonnance_retourne200() {
        Ordonnance o = Ordonnance.builder().id(9L).build();
        when(medecinService.genererOrdonnance(7L, "d", "")).thenReturn(o);
        ResponseEntity<Ordonnance> res = medecinController.genererOrdonnance(7L, "d", "");
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(9L, res.getBody().getId());
    }
}

