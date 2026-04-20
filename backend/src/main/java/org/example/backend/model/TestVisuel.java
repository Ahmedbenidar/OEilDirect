package org.example.backend.model;

import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;

@Entity
@Table(name = "test_visuel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestVisuel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "demande_id", nullable = false)
    @JsonIgnoreProperties(value = {"testVisuel", "ordonnance"}, ignoreUnknown = true)
    private DemandeRDV demande;

    @Builder.Default
    private boolean conditionsValidees = false;

    private Integer score;

    @Column(length = 1000)
    private String recommandationsIA;

    private LocalDateTime dateRealisation;

    @PrePersist
    protected void onCreate() {
        if (dateRealisation == null) {
            dateRealisation = LocalDateTime.now();
        }
    }
}
