package org.example.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.model.DemandeRDV;
import org.example.backend.model.Ordonnance;
import org.example.backend.model.Role;
import org.example.backend.model.TestVisuel;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.example.backend.service.MedecinService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/medecins")
@RequiredArgsConstructor
public class MedecinController {

    private final MedecinService medecinService;
    private final UtilisateurRepository utilisateurRepository;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listerMedecins() {
        List<Map<String, Object>> medecins = utilisateurRepository.findAll()
                .stream()
                .filter(u -> u.getRole() == Role.MEDECIN)
                .map(this::toPublicMedecin)
                .toList();
        return ResponseEntity.ok(medecins);
    }

    private Map<String, Object> toPublicMedecin(Utilisateur u) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("nom", u.getNom() != null ? u.getNom() : "");
        m.put("prenom", u.getPrenom() != null ? u.getPrenom() : "");
        m.put("email", u.getEmail() != null ? u.getEmail() : "");
        m.put("role", u.getRole() != null ? u.getRole().name() : "");
        m.put("specialite", u.getSpecialite() != null ? u.getSpecialite() : "");
        m.put("telephone", u.getTelephone() != null ? u.getTelephone() : "");
        m.put("cin", u.getCin() != null ? u.getCin() : "");
        m.put("photoProfil", u.getPhotoProfil() != null ? u.getPhotoProfil() : "");
        m.put("joursConsultationHebdo", parseJoursHebdo(u.getJoursConsultationHebdo()));
        m.put("datesJoursOff", parseDatesOff(u.getDatesJoursOff()));
        m.put("datesDisponibles", parseDatesOff(u.getDatesDisponibles()));
        return m;
    }

    private List<Integer> parseJoursHebdo(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            List<Integer> list = objectMapper.readValue(json, new TypeReference<List<Integer>>() {
            });
            return list.stream().filter(i -> i != null && i >= 0 && i <= 6).distinct().toList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private List<String> parseDatesOff(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    @GetMapping("/{medecinId}/demandes/a-valider")
    public ResponseEntity<List<DemandeRDV>> listerDemandesAValider(@PathVariable Long medecinId) {
        return ResponseEntity.ok(medecinService.listerDemandesAValider(medecinId));
    }

    @GetMapping("/demandes/en-attente-medecin")
    public ResponseEntity<List<DemandeRDV>> toutesDemandesEnAttenteMedecin() {
        return ResponseEntity.ok(medecinService.toutesDemandesEnAttenteMedecin());
    }

    @GetMapping("/{medecinId}/tests/termines")
    public ResponseEntity<List<DemandeRDV>> listerTestsTermines(@PathVariable Long medecinId) {
        return ResponseEntity.ok(medecinService.listerTestsTermines(medecinId));
    }

    @GetMapping("/demandes/{demandeId}/resultat-test")
    public ResponseEntity<TestVisuel> getResultatTest(@PathVariable Long demandeId) {
        return ResponseEntity.ok(medecinService.getResultatTest(demandeId));
    }

    @PostMapping("/demandes/{demandeId}/prescrire-test")
    public ResponseEntity<TestVisuel> prescrireTest(@PathVariable Long demandeId) {
        return ResponseEntity.ok(medecinService.prescrireTest(demandeId));
    }

    @GetMapping("/{medecinId}/patients")
    public ResponseEntity<List<Map<String, Object>>> listerPatients(@PathVariable Long medecinId) {
        Utilisateur medecin = utilisateurRepository.findById(medecinId)
                .orElseThrow(() -> new org.example.backend.exception.ResourceNotFoundException("Medecin introuvable: " + medecinId));
        List<DemandeRDV> demandes = medecinService.listerToutesDemandes(medecinId);
        Map<Long, Map<String, Object>> patientsMap = new LinkedHashMap<>();
        for (DemandeRDV d : demandes) {
            Utilisateur p = d.getPatient();
            if (p == null) continue;
            patientsMap.computeIfAbsent(p.getId(), id -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id", p.getId());
                m.put("nom", p.getNom() != null ? p.getNom() : "");
                m.put("prenom", p.getPrenom() != null ? p.getPrenom() : "");
                m.put("email", p.getEmail() != null ? p.getEmail() : "");
                m.put("telephone", p.getTelephone() != null ? p.getTelephone() : "");
                m.put("nombreRdv", 0);
                return m;
            });
            Map<String, Object> pm = patientsMap.get(p.getId());
            pm.put("nombreRdv", (int) pm.get("nombreRdv") + 1);
        }
        return ResponseEntity.ok(new ArrayList<>(patientsMap.values()));
    }

    @GetMapping("/{medecinId}/ordonnances")
    public ResponseEntity<List<Map<String, Object>>> listerOrdonnances(@PathVariable Long medecinId) {
        Utilisateur medecin = utilisateurRepository.findById(medecinId)
                .orElseThrow(() -> new org.example.backend.exception.ResourceNotFoundException("Medecin introuvable: " + medecinId));
        List<Ordonnance> ordonnances = medecinService.listerOrdonnancesMedecin(medecinId);
        List<Map<String, Object>> result = ordonnances.stream().map(o -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", o.getId());
            m.put("dateCreation", o.getDateCreation());
            m.put("score", o.getScore());
            m.put("contenuMedical", o.getContenuMedical());
            m.put("medicaments", o.getMedicaments());
            m.put("cheminFichierPdf", o.getCheminFichierPdf());
            if (o.getDemande() != null) {
                m.put("demandeId", o.getDemande().getId());
                Utilisateur patient = o.getDemande().getPatient();
                if (patient != null) {
                    m.put("patientNom", patient.getNom() != null ? patient.getNom() : "");
                    m.put("patientPrenom", patient.getPrenom() != null ? patient.getPrenom() : "");
                }
            }
            return m;
        }).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/demandes/{demandeId}/ordonnance")
    public ResponseEntity<Ordonnance> genererOrdonnance(
            @PathVariable Long demandeId,
            @RequestParam String diagnostic,
            @RequestParam(required = false, defaultValue = "") String medicaments) {
        Ordonnance ordonnance = medecinService.genererOrdonnance(demandeId, diagnostic, medicaments);
        return ResponseEntity.ok(ordonnance);
    }
}