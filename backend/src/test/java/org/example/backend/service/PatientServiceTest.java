package org.example.backend.service;

import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.model.DemandeRDV;
import org.example.backend.model.StatutDemande;
import org.example.backend.model.TestVisuel;
import org.example.backend.repository.DemandeRDVRepository;
import org.example.backend.repository.OrdonnanceRepository;
import org.example.backend.repository.TestVisuelRepository;
import org.example.backend.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PatientServiceTest {

    @Mock
    private UtilisateurRepository utilisateurRepository;

    @Mock
    private DemandeRDVRepository demandeRDVRepository;

    @Mock
    private TestVisuelRepository testVisuelRepository;

    @Mock
    private OrdonnanceRepository ordonnanceRepository;

    @InjectMocks
    private PatientService patientService;

    private DemandeRDV demande;
    private TestVisuel testVisuel;

    @BeforeEach
    void setUp() {
        demande = DemandeRDV.builder()
                .id(10L)
                .statut(StatutDemande.TEST_PRESCRIT)
                .build();
        testVisuel = TestVisuel.builder()
                .id(5L)
                .demande(demande)
                .conditionsValidees(false)
                .build();
    }

    @Test
    void validerConditionsTest_conditionsOptimales_activeValidation() {
        when(testVisuelRepository.findById(5L)).thenReturn(Optional.of(testVisuel));
        when(testVisuelRepository.save(any(TestVisuel.class))).thenAnswer(inv -> inv.getArgument(0));

        TestVisuel result = patientService.validerConditionsTest(5L, true, false, 1.0f);

        assertTrue(result.isConditionsValidees());
        assertTrue(result.getRecommandationsIA().contains("optimales"));
        verify(testVisuelRepository).save(testVisuel);
    }

    @Test
    void validerConditionsTest_lunettesPortees_refuseValidation() {
        when(testVisuelRepository.findById(5L)).thenReturn(Optional.of(testVisuel));
        when(testVisuelRepository.save(any(TestVisuel.class))).thenAnswer(inv -> inv.getArgument(0));

        TestVisuel result = patientService.validerConditionsTest(5L, true, true, 1.0f);

        assertFalse(result.isConditionsValidees());
        assertTrue(result.getRecommandationsIA().contains("sans lunettes"));
    }

    @Test
    void validerConditionsTest_distanceHorsPlage_refuseValidation() {
        when(testVisuelRepository.findById(5L)).thenReturn(Optional.of(testVisuel));
        when(testVisuelRepository.save(any(TestVisuel.class))).thenAnswer(inv -> inv.getArgument(0));

        TestVisuel result = patientService.validerConditionsTest(5L, true, false, 1.5f);

        assertFalse(result.isConditionsValidees());
    }

    @Test
    void validerConditionsTest_testInconnu_leveResourceNotFound() {
        when(testVisuelRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> patientService.validerConditionsTest(99L, true, false, 1.0f));
    }

    @Test
    void soumettreResultatsTest_sansValidationPrealable_leveIllegalState() {
        testVisuel.setConditionsValidees(false);
        when(testVisuelRepository.findById(5L)).thenReturn(Optional.of(testVisuel));

        assertThrows(IllegalStateException.class,
                () -> patientService.soumettreResultatsTest(5L, 12));

        verify(testVisuelRepository, never()).save(any());
    }

    @Test
    void soumettreResultatsTest_conditionsValidees_metAJourScoreEtStatutDemande() {
        testVisuel.setConditionsValidees(true);
        when(testVisuelRepository.findById(5L)).thenReturn(Optional.of(testVisuel));
        when(testVisuelRepository.save(any(TestVisuel.class))).thenAnswer(inv -> inv.getArgument(0));
        when(demandeRDVRepository.save(any(DemandeRDV.class))).thenAnswer(inv -> inv.getArgument(0));

        TestVisuel result = patientService.soumettreResultatsTest(5L, 14);

        assertEquals(14, result.getScore());
        assertNotNull(result.getRecommandationsIA());
        assertTrue(result.getRecommandationsIA().contains("14/15"));

        ArgumentCaptor<DemandeRDV> demandeCaptor = ArgumentCaptor.forClass(DemandeRDV.class);
        verify(demandeRDVRepository).save(demandeCaptor.capture());
        assertEquals(StatutDemande.TEST_TERMINE, demandeCaptor.getValue().getStatut());
    }
}