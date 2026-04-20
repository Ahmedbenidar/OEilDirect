package org.example.backend.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.example.backend.model.Utilisateur;
import org.example.backend.repository.UtilisateurRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@RestController
@RequestMapping("/api/utilisateurs")
@RequiredArgsConstructor
public class UtilisateurController {

    private final UtilisateurRepository utilisateurRepository;
    private static final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping("/{id}")
    public ResponseEntity<?> getProfil(@PathVariable Long id) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur introuvable"));

        return ResponseEntity.ok(buildProfileMap(u));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProfil(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Utilisateur u = utilisateurRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Utilisateur introuvable"));

        if (body.containsKey("nom")) u.setNom(asString(body.get("nom")));
        if (body.containsKey("prenom")) u.setPrenom(asString(body.get("prenom")));
        if (body.containsKey("email")) u.setEmail(asString(body.get("email")));
        if (body.containsKey("age")) u.setAge(asInteger(body.get("age")));
        if (body.containsKey("telephone")) u.setTelephone(asString(body.get("telephone")));
        if (body.containsKey("cin")) u.setCin(asString(body.get("cin")));
        if (body.containsKey("specialite")) u.setSpecialite(asString(body.get("specialite")));
        if (body.containsKey("photoProfil")) {
            String p = asString(body.get("photoProfil"));
            if (p != null && p.length() > 2_000_000) {
                return ResponseEntity.badRequest().body(Map.of("erreur", "Photo trop volumineuse (max ~2MB)"));
            }
            u.setPhotoProfil(p);
        }
        if (body.containsKey("joursConsultationHebdo")) {
            u.setJoursConsultationHebdo(serializeJsonOrNull(body.get("joursConsultationHebdo")));
        }
        if (body.containsKey("datesJoursOff")) {
            u.setDatesJoursOff(serializeJsonOrNull(body.get("datesJoursOff")));
        }
        if (body.containsKey("datesDisponibles")) {
            u.setDatesDisponibles(serializeJsonOrNull(body.get("datesDisponibles")));
        }

        Utilisateur saved = utilisateurRepository.save(u);
        return ResponseEntity.ok(buildProfileMap(saved));
    }

    private Map<String, Object> buildProfileMap(Utilisateur u) {
        Map<String, Object> m = new HashMap<>();
        m.put("id",          u.getId());
        m.put("nom",         u.getNom()         != null ? u.getNom()         : "");
        m.put("prenom",      u.getPrenom()      != null ? u.getPrenom()      : "");
        m.put("email",       u.getEmail()       != null ? u.getEmail()       : "");
        m.put("role",        u.getRole()        != null ? u.getRole().name() : "");
        m.put("age",         u.getAge());
        m.put("specialite",  u.getSpecialite()  != null ? u.getSpecialite()  : "");
        m.put("telephone",   u.getTelephone()   != null ? u.getTelephone()   : "");
        m.put("cin",         u.getCin()         != null ? u.getCin()         : "");
        m.put("photoProfil", u.getPhotoProfil() != null ? u.getPhotoProfil() : "");
        m.put("joursConsultationHebdo", parseJsonIntList(u.getJoursConsultationHebdo()));
        m.put("datesJoursOff", parseJsonStringList(u.getDatesJoursOff()));
        m.put("datesDisponibles", parseJsonStringList(u.getDatesDisponibles()));
        return m;
    }

    private String serializeJsonOrNull(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return null;
        }
    }

    private List<Integer> parseJsonIntList(String json) {
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

    private List<String> parseJsonStringList(String json) {
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

    private String asString(Object o) {
        if (o == null) return null;
        String s = String.valueOf(o).trim();
        return s.isEmpty() ? null : s;
    }

    private Integer asInteger(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try {
            String s = String.valueOf(o).trim();
            if (s.isEmpty()) return null;
            return Integer.parseInt(s);
        } catch (Exception e) {
            return null;
        }
    }
}

