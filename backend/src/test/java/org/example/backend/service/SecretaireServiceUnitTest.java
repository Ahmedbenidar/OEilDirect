package org.example.backend.service;

import org.example.backend.exception.ResourceNotFoundException;
import org.example.backend.model.DemandeRDV;
import org.example.backend.model.StatutDemande;
import org.example.backend.repository.DemandeRDVRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecretaireServiceUnitTest {

    @Mock
    DemandeRDVRepository demandeRDVRepository;

    @InjectMocks
    SecretaireService secretaireService;

    @Test
    void listerToutesDemandes_trieParDateDesc() {
        DemandeRDV d1 = DemandeRDV.builder().id(1L).dateCreation(LocalDateTime.now().minusDays(1)).build();
        DemandeRDV d2 = DemandeRDV.builder().id(2L).dateCreation(LocalDateTime.now()).build();
        DemandeRDV d3 = DemandeRDV.builder().id(3L).dateCreation(null).build();
        when(demandeRDVRepository.findAll()).thenReturn(new ArrayList<>(List.of(d1, d3, d2)));

        List<DemandeRDV> out = secretaireService.listerToutesDemandes();
        // nullsLast() is reversed => nullsFirst
        assertEquals(List.of(3L, 2L, 1L), out.stream().map(DemandeRDV::getId).toList());
    }

    @Test
    void validerDemandeAdministrative_notFound_leveException() {
        when(demandeRDVRepository.findById(10L)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> secretaireService.validerDemandeAdministrative(10L));
    }

    @Test
    void validerDemandeAdministrative_statutInvalide_leveIllegalState() {
        DemandeRDV d = DemandeRDV.builder().id(10L).statut(StatutDemande.EN_ATTENTE_MEDECIN).build();
        when(demandeRDVRepository.findById(10L)).thenReturn(Optional.of(d));
        assertThrows(IllegalStateException.class, () -> secretaireService.validerDemandeAdministrative(10L));
    }

    @Test
    void validerDemandeAdministrative_ok_changeStatut_etSauve() {
        DemandeRDV d = DemandeRDV.builder().id(10L).statut(StatutDemande.EN_ATTENTE_SECRETAIRE).build();
        when(demandeRDVRepository.findById(10L)).thenReturn(Optional.of(d));
        when(demandeRDVRepository.save(any(DemandeRDV.class))).thenAnswer(inv -> inv.getArgument(0));

        DemandeRDV saved = secretaireService.validerDemandeAdministrative(10L);
        assertEquals(StatutDemande.EN_ATTENTE_MEDECIN, saved.getStatut());
        verify(demandeRDVRepository).save(d);
    }

    @Test
    void supprimerDemande_ok_supprimeEntite() {
        DemandeRDV d = DemandeRDV.builder().id(77L).statut(StatutDemande.REJETEE).build();
        when(demandeRDVRepository.findById(77L)).thenReturn(Optional.of(d));

        secretaireService.supprimerDemande(77L);
        verify(demandeRDVRepository).delete(d);
    }
}

