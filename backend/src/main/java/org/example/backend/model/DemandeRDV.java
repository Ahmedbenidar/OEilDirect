package org.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "demande_rdv")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DemandeRDV {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "patient_id", nullable = false)
    @JsonIgnoreProperties({"motDePasse"})
    private Utilisateur patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "praticien_id", nullable = false)
    @JsonIgnoreProperties({"motDePasse"})
    private Utilisateur praticien;

    @Column(nullable = false)
    private String motif;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutDemande statut;

    @Builder.Default
    private boolean paiementEffectue = false;

    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
        if (statut == null) {
            statut = StatutDemande.EN_ATTENTE_SECRETAIRE;
        }
    }
}
