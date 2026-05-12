package org.example.backend.service;

import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.model.DemandeRDV;
import org.example.backend.model.Ordonnance;
import org.example.backend.model.StatutDemande;
import org.example.backend.model.TestVisuel;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.DemandeRDVRepository;
import org.example.backend.repository.OrdonnanceRepository;
import org.example.backend.repository.TestVisuelRepository;
import org.example.backend.repository.UtilisateurRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MedecinServiceUnitTest {

    @Mock
    UtilisateurRepository utilisateurRepository;

    @Mock
    DemandeRDVRepository demandeRDVRepository;

    @Mock
    TestVisuelRepository testVisuelRepository;

    @Mock
    OrdonnanceRepository ordonnanceRepository;

    @InjectMocks
    MedecinService medecinService;

    @Test
    void listerDemandesAValider_trieParDateDesc() {
        Utilisateur med = Utilisateur.builder().id(1L).build();
        when(utilisateurRepository.findById(1L)).thenReturn(Optional.of(med));

        DemandeRDV d1 = DemandeRDV.builder().id(1L).dateCreation(LocalDateTime.now().minusDays(1)).build();
        DemandeRDV d2 = DemandeRDV.builder().id(2L).dateCreation(LocalDateTime.now()).build();
        DemandeRDV d3 = DemandeRDV.builder().id(3L).dateCreation(null).build();
        when(demandeRDVRepository.findByPraticienAndStatut(med, StatutDemande.EN_ATTENTE_MEDECIN))
                .thenReturn(new ArrayList<>(List.of(d1, d3, d2)));

        List<DemandeRDV> out = medecinService.listerDemandesAValider(1L);
        // nullsLast() is reversed => nullsFirst
        assertEquals(List.of(3L, 2L, 1L), out.stream().map(DemandeRDV::getId).toList());
    }

    @Test
    void getResultatTest_aucuneDemande_leveNotFound() {
        when(demandeRDVRepository.findById(5L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> medecinService.getResultatTest(5L));
    }

    @Test
    void prescrireTest_statutInvalide_leveIllegalState() {
        DemandeRDV d = DemandeRDV.builder().id(10L).statut(StatutDemande.REJETEE).build();
        when(demandeRDVRepository.findById(10L)).thenReturn(Optional.of(d));
        assertThrows(IllegalStateException.class, () -> medecinService.prescrireTest(10L));
    }

    @Test
    void prescrireTest_ok_changeStatut_etCreeTest() {
        DemandeRDV d = DemandeRDV.builder().id(10L).statut(StatutDemande.EN_ATTENTE_MEDECIN).build();
        when(demandeRDVRepository.findById(10L)).thenReturn(Optional.of(d));
        when(testVisuelRepository.save(any(TestVisuel.class))).thenAnswer(inv -> inv.getArgument(0));

        TestVisuel t = medecinService.prescrireTest(10L);
        assertEquals(StatutDemande.TEST_PRESCRIT, d.getStatut());
        assertNotNull(t);
        assertFalse(t.isConditionsValidees());
        verify(demandeRDVRepository).save(d);
        verify(testVisuelRepository).save(any(TestVisuel.class));
    }

    @Test
    void genererOrdonnance_testPasTermine_leveIllegalState() {
        DemandeRDV d = DemandeRDV.builder().id(10L).statut(StatutDemande.EN_ATTENTE_MEDECIN).build();
        when(demandeRDVRepository.findById(10L)).thenReturn(Optional.of(d));
        when(testVisuelRepository.findByDemande(d)).thenReturn(Optional.of(TestVisuel.builder().id(1L).demande(d).score(12).build()));

        assertThrows(IllegalStateException.class, () -> medecinService.genererOrdonnance(10L, "diag", "meds"));
    }

    @Test
    void genererOrdonnance_ok_changeStatut_etRemplitContenu() {
        DemandeRDV d = DemandeRDV.builder().id(10L).statut(StatutDemande.TEST_TERMINE).build();
        TestVisuel t = TestVisuel.builder().id(1L).demande(d).score(15).recommandationsIA("ok").build();
        when(demandeRDVRepository.findById(10L)).thenReturn(Optional.of(d));
        when(testVisuelRepository.findByDemande(d)).thenReturn(Optional.of(t));
        when(ordonnanceRepository.save(any(Ordonnance.class))).thenAnswer(inv -> inv.getArgument(0));

        Ordonnance o = medecinService.genererOrdonnance(10L, "DIAG", "MEDS");
        assertEquals(StatutDemande.ORDONNANCE_DELIVREE, d.getStatut());
        assertNotNull(o.getContenuMedical());
        assertTrue(o.getContenuMedical().contains("DIAG"));
        assertTrue(o.getContenuMedical().contains("15/15"));
        assertEquals(Integer.valueOf(15), o.getScore());
        verify(demandeRDVRepository).save(d);
    }
}

