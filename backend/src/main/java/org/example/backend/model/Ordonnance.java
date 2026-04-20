package org.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "ordonnance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ordonnance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "demande_id", nullable = false)
    @JsonIgnoreProperties(value = {"testVisuel", "ordonnance"}, ignoreUnknown = true)
    private DemandeRDV demande;

    @Column(length = 2000)
    private String contenuMedical;

    @Column(length = 2000)
    private String medicaments;

    private Integer score;

    private String cheminFichierPdf;

    private LocalDateTime dateCreation;

    @PrePersist
    protected void onCreate() {
        if (dateCreation == null) {
            dateCreation = LocalDateTime.now();
        }
    }
}