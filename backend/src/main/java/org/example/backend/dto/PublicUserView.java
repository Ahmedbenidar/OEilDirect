package org.example.backend.dto;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.example.backend.model.Utilisateur;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** Public JSON for a user (no password) for profile and auth responses. */
public final class PublicUserView {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private PublicUserView() {
    }

    public static Map<String, Object> asMap(Utilisateur u) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", u.getId());
        m.put("nom", u.getNom() != null ? u.getNom() : "");
        m.put("prenom", u.getPrenom() != null ? u.getPrenom() : "");
        m.put("email", u.getEmail() != null ? u.getEmail() : "");
        m.put("role", u.getRole() != null ? u.getRole().name() : "");
        m.put("age", u.getAge());
        m.put("specialite", u.getSpecialite() != null ? u.getSpecialite() : "");
        m.put("telephone", u.getTelephone() != null ? u.getTelephone() : "");
        m.put("cin", u.getCin() != null ? u.getCin() : "");
        m.put("photoProfil", u.getPhotoProfil() != null ? u.getPhotoProfil() : "");
        m.put("joursConsultationHebdo", parseJsonIntList(u.getJoursConsultationHebdo()));
        m.put("datesJoursOff", parseJsonStringList(u.getDatesJoursOff()));
        m.put("datesDisponibles", parseJsonStringList(u.getDatesDisponibles()));
        return m;
    }

    private static List<Integer> parseJsonIntList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            List<Integer> list = MAPPER.readValue(json, new TypeReference<List<Integer>>() {
            });
            return list.stream().filter(i -> i != null && i >= 0 && i <= 6).distinct().toList();
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }

    private static List<String> parseJsonStringList(String json) {
        if (json == null || json.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return MAPPER.readValue(json, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            return Collections.emptyList();
        }
    }
}