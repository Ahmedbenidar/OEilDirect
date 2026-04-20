package org.example.backend.controller;

import lombok.RequiredArgsConstructor;
import org.example.backend.model.DemandeRDV;
import org.example.backend.model.Ordonnance;
import org.example.backend.model.TestVisuel;
import org.example.backend.repository.DemandeRDVRepository;
import org.example.backend.repository.OrdonnanceRepository;
import org.example.backend.repository.TestVisuelRepository;
import org.example.backend.repository.UtilisateurRepository;
import org.example.backend.service.PatientService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;
    private final DemandeRDVRepository demandeRDVRepository;
    private final UtilisateurRepository utilisateurRepository;
    private final OrdonnanceRepository ordonnanceRepository;
    private final TestVisuelRepository testVisuelRepository;

    @GetMapping("/{patientId}/demandes")
    public ResponseEntity<List<DemandeRDV>> listerDemandesPatient(@PathVariable Long patientId) {
        return utilisateurRepository.findById(patientId)
                .map(patient -> {
                    List<DemandeRDV> demandes = demandeRDVRepository.findByPatient(patient);
                    demandes.sort(Comparator.comparing(DemandeRDV::getDateCreation, Comparator.nullsLast(Comparator.naturalOrder())).reversed());
                    return ResponseEntity.ok(demandes);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{patientId}/resultats-tests")
    public ResponseEntity<List<TestVisuel>> listerResultatsTests(@PathVariable Long patientId) {
        return utilisateurRepository.findById(patientId)
                .map(patient -> {
                    List<DemandeRDV> demandes = demandeRDVRepository.findByPatient(patient);
                    List<TestVisuel> tests = demandes.stream()
                            .map(d -> testVisuelRepository.findByDemande(d).orElse(null))
                            .filter(t -> t != null && t.getScore() != null)
                            .sorted(Comparator.comparing(TestVisuel::getDateRealisation, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(tests);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{patientId}/ordonnances")
    public ResponseEntity<List<Ordonnance>> listerOrdonnancesPatient(@PathVariable Long patientId) {
        return utilisateurRepository.findById(patientId)
                .map(patient -> {
                    List<DemandeRDV> demandes = demandeRDVRepository.findByPatient(patient);
                    List<Ordonnance> ordonnances = demandes.stream()
                            .map(d -> ordonnanceRepository.findByDemande(d).orElse(null))
                            .filter(o -> o != null)
                            .sorted(Comparator.comparing(Ordonnance::getDateCreation, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                            .collect(Collectors.toList());
                    return ResponseEntity.ok(ordonnances);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/{patientId}/demandes")
    public ResponseEntity<DemandeRDV> creerDemande(
            @PathVariable Long patientId,
            @RequestParam Long praticienId,
            @RequestParam String motif) {
        DemandeRDV demande = patientService.creerDemande(patientId, praticienId, motif);
        return new ResponseEntity<>(demande, HttpStatus.CREATED);
    }

    @PostMapping("/tests/{testId}/valider-conditions")
    public ResponseEntity<TestVisuel> validerConditionsTest(
            @PathVariable Long testId,
            @RequestParam boolean visage,
            @RequestParam boolean lunettes,
            @RequestParam float distance) {
        TestVisuel test = patientService.validerConditionsTest(testId, visage, lunettes, distance);
        return ResponseEntity.ok(test);
    }

    @PostMapping("/tests/{testId}/soumettre")
    public ResponseEntity<TestVisuel> soumettreResultatsTest(
            @PathVariable Long testId,
            @RequestParam int score) {
        TestVisuel test = patientService.soumettreResultatsTest(testId, score);
        return ResponseEntity.ok(test);
    }

    @PostMapping("/demandes/{demandeId}/tests/soumettre")
    public ResponseEntity<TestVisuel> soumettreResultatsTestParDemande(
            @PathVariable Long demandeId,
            @RequestParam int score) {
        TestVisuel test = patientService.soumettreResultatsTestParDemande(demandeId, score);
        return ResponseEntity.ok(test);
    }
}