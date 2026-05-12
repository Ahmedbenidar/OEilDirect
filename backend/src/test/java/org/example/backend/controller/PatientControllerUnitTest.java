package org.example.backend.controller;

import org.example.backend.model.DemandeRDV;
import org.example.backend.model.Ordonnance;
import org.example.backend.model.StatutDemande;
import org.example.backend.model.TestVisuel;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.DemandeRDVRepository;
import org.example.backend.repository.OrdonnanceRepository;
import org.example.backend.repository.TestVisuelRepository;
import org.example.backend.repository.UtilisateurRepository;
import org.example.backend.service.PatientService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PatientControllerUnitTest {

    @Mock
    PatientService patientService;

    @Mock
    DemandeRDVRepository demandeRDVRepository;

    @Mock
    UtilisateurRepository utilisateurRepository;

    @Mock
    OrdonnanceRepository ordonnanceRepository;

    @Mock
    TestVisuelRepository testVisuelRepository;

    @InjectMocks
    PatientController patientController;

    @Test
    void listerDemandesPatient_notFound_retourne404() {
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.empty());
        ResponseEntity<List<DemandeRDV>> res = patientController.listerDemandesPatient(1L);
        assertEquals(HttpStatus.NOT_FOUND, res.getStatusCode());
    }

    @Test
    void listerDemandesPatient_trieParDateDesc_nullsLast() {
        Utilisateur patient = Utilisateur.builder().id(1L).build();
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(patient));

        DemandeRDV d1 = DemandeRDV.builder().id(1L).patient(patient).praticien(Utilisateur.builder().id(2L).build())
                .motif("a").statut(StatutDemande.EN_ATTENTE_SECRETAIRE).dateCreation(LocalDateTime.now().minusDays(1)).build();
        DemandeRDV d2 = DemandeRDV.builder().id(2L).patient(patient).praticien(Utilisateur.builder().id(3L).build())
                .motif("b").statut(StatutDemande.EN_ATTENTE_SECRETAIRE).dateCreation(LocalDateTime.now()).build();
        DemandeRDV d3 = DemandeRDV.builder().id(3L).patient(patient).praticien(Utilisateur.builder().id(4L).build())
                .motif("c").statut(StatutDemande.EN_ATTENTE_SECRETAIRE).dateCreation(null).build();

        when(demandeRDVRepository.findByPatient(patient)).thenReturn(new ArrayList<>(List.of(d1, d3, d2)));

        ResponseEntity<List<DemandeRDV>> res = patientController.listerDemandesPatient(1L);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        // nullsLast() is reversed => nullsFirst
        assertEquals(List.of(3L, 2L, 1L), res.getBody().stream().map(DemandeRDV::getId).toList());
    }

    @Test
    void listerResultatsTests_filtreScoreNull_etTrieDateDesc() {
        Utilisateur patient = Utilisateur.builder().id(1L).build();
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(patient));

        DemandeRDV d1 = DemandeRDV.builder().id(10L).patient(patient).praticien(Utilisateur.builder().id(2L).build())
                .motif("a").statut(StatutDemande.TEST_TERMINE).build();
        DemandeRDV d2 = DemandeRDV.builder().id(11L).patient(patient).praticien(Utilisateur.builder().id(3L).build())
                .motif("b").statut(StatutDemande.TEST_TERMINE).build();
        when(demandeRDVRepository.findByPatient(patient)).thenReturn(List.of(d1, d2));

        TestVisuel t1 = TestVisuel.builder().id(1L).demande(d1).score(12).dateRealisation(LocalDateTime.now().minusDays(1)).build();
        TestVisuel t2 = TestVisuel.builder().id(2L).demande(d2).score(null).dateRealisation(LocalDateTime.now()).build();
        when(testVisuelRepository.findByDemande(d1)).thenReturn(Optional.of(t1));
        when(testVisuelRepository.findByDemande(d2)).thenReturn(Optional.of(t2));

        ResponseEntity<List<TestVisuel>> res = patientController.listerResultatsTests(1L);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(1, res.getBody().size());
        assertEquals(1L, res.getBody().get(0).getId());
    }

    @Test
    void listerOrdonnancesPatient_filtreNull_etTrieDateDesc() {
        Utilisateur patient = Utilisateur.builder().id(1L).build();
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(patient));

        DemandeRDV d1 = DemandeRDV.builder().id(10L).patient(patient).praticien(Utilisateur.builder().id(2L).build())
                .motif("a").statut(StatutDemande.ORDONNANCE_DELIVREE).build();
        DemandeRDV d2 = DemandeRDV.builder().id(11L).patient(patient).praticien(Utilisateur.builder().id(3L).build())
                .motif("b").statut(StatutDemande.ORDONNANCE_DELIVREE).build();
        when(demandeRDVRepository.findByPatient(patient)).thenReturn(List.of(d1, d2));

        Ordonnance o1 = Ordonnance.builder().id(1L).demande(d1).dateCreation(LocalDateTime.now().minusDays(1)).build();
        Ordonnance o2 = Ordonnance.builder().id(2L).demande(d2).dateCreation(LocalDateTime.now()).build();
        when(ordonnanceRepository.findByDemande(d1)).thenReturn(Optional.of(o1));
        when(ordonnanceRepository.findByDemande(d2)).thenReturn(Optional.empty());

        ResponseEntity<List<Ordonnance>> res = patientController.listerOrdonnancesPatient(1L);
        assertEquals(HttpStatus.OK, res.getStatusCode());
        assertEquals(1, res.getBody().size());
        assertEquals(1L, res.getBody().get(0).getId());
    }

    @Test
    void creerDemande_retourne201() {
        DemandeRDV d = DemandeRDV.builder().id(55L).build();
        when(patientService.creerDemande(1L, 2L, "motif")).thenReturn(d);
        ResponseEntity<DemandeRDV> res = patientController.creerDemande(1L, 2L, "motif");
        assertEquals(HttpStatus.CREATED, res.getStatusCode());
        assertEquals(55L, res.getBody().getId());
    }
}

