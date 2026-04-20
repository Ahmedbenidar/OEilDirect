package org.example.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "utilisateur")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nom;

    @Column
    private String prenom;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String motDePasse;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column
    private Integer age;

    @Column
    private String specialite;

    @Column
    private String telephone;

    @Column
    private String cin;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String photoProfil; // data URL (base64) or plain URL

    /** JSON: jours de consultation (0=Dimanche .. 6=Samedi, convention JavaScript getDay). */
    @Column(columnDefinition = "TEXT")
    private String joursConsultationHebdo;

    /** JSON: dates ISO yyyy-MM-dd ou le medecin est indisponible (conges, off). */
    @Column(columnDefinition = "TEXT")
    private String datesJoursOff;

    /** JSON: dates ISO yyyy-MM-dd ou le medecin est disponible (planning par calendrier uniquement). */
    @Column(columnDefinition = "TEXT")
    private String datesDisponibles;
}