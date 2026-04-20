package org.example.backend;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.model.*;
import org.example.backend.repository.DemandeRDVRepository;
import org.example.backend.repository.UtilisateurRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class BackendApplicationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UtilisateurRepository utilisateurRepository;

    @Autowired
    private DemandeRDVRepository demandeRDVRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private Utilisateur patient;
    private Utilisateur praticien;
    private Utilisateur secretaire;

    @BeforeEach
    void setup() {
        demandeRDVRepository.deleteAll();
        utilisateurRepository.deleteAll();

        patient = Utilisateur.builder().nom("Jean Dupont").email("jean@test.com").role(Role.PATIENT).build();
        praticien = Utilisateur.builder().nom("Dr House").email("doc@test.com").role(Role.MEDECIN).build();
        secretaire = Utilisateur.builder().nom("Sophie").email("sophie@test.com").role(Role.SECRETAIRE).build();

        utilisateurRepository.save(patient);
        utilisateurRepository.save(praticien);
        utilisateurRepository.save(secretaire);
    }

    @Test
    void parcoursUtilisateurComplet() throws Exception {
        // 1. Phase d'Inscription et de Demande (Patient)
        MvcResult resultDemande = mockMvc.perform(post("/api/patients/" + patient.getId() + "/demandes")
                .param("praticienId", praticien.getId().toString())
                .param("motif", "Baisse de vision oeil gauche"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.statut").value("EN_ATTENTE_SECRETAIRE"))
                .andReturn();

        DemandeRDV demandeCreation = objectMapper.readValue(resultDemande.getResponse().getContentAsString(), DemandeRDV.class);
        Long demandeId = demandeCreation.getId();

        // 2. Validation Administrative (Secrétaire)
        mockMvc.perform(post("/api/secretaire/demandes/" + demandeId + "/valider"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statut").value("EN_ATTENTE_MEDECIN"));

        // 3. Validation Médicale et Prescription de Test (Médecin)
        MvcResult resultTest = mockMvc.perform(post("/api/medecins/demandes/" + demandeId + "/prescrire-test"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conditionsValidees").value(false))
                .andReturn();

        TestVisuel testCree = objectMapper.readValue(resultTest.getResponse().getContentAsString(), TestVisuel.class);
        Long testId = testCree.getId();

        // Vérification statut demande
        DemandeRDV demandeApresTest = demandeRDVRepository.findById(demandeId).get();
        assertEquals(StatutDemande.TEST_PRESCRIT, demandeApresTest.getStatut());

        // 4. Réalisation du Test Assisté par IA (Patient)
        // a. Mauvaises conditions (trop loin)
        mockMvc.perform(post("/api/patients/tests/" + testId + "/valider-conditions")
                        .param("visage", "true")
                        .param("lunettes", "false")
                        .param("distance", "1.5"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conditionsValidees").value(false));

        // b. Bonnes conditions
        mockMvc.perform(post("/api/patients/tests/" + testId + "/valider-conditions")
                        .param("visage", "true")
                        .param("lunettes", "false")
                        .param("distance", "1.0"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.conditionsValidees").value(true));

        // c. Soumission test
        mockMvc.perform(post("/api/patients/tests/" + testId + "/soumettre")
                        .param("score", "8"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(8));

        // 5. Finalisation et Ordonnance (Médecin)
        mockMvc.perform(post("/api/medecins/demandes/" + demandeId + "/ordonnance")
                        .param("diagnostic", "Myopie légère"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.contenuMedical").value("Myopie légère\nScore obtenu : 8/15\n"))
                .andExpect(jsonPath("$.cheminFichierPdf").value("pdf/ordonnance_" + demandeId + ".pdf"));

        // Vérification finale statut demande
        DemandeRDV demandeFinale = demandeRDVRepository.findById(demandeId).get();
        assertEquals(StatutDemande.ORDONNANCE_DELIVREE, demandeFinale.getStatut());
    }
}
