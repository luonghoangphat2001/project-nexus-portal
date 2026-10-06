package com.nexus.portal.model;

import com.nexus.portal.enums.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "defense_assignments", uniqueConstraints = @UniqueConstraint(columnNames = "registration_id"))
public class DefenseAssignment extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "council_id", nullable = false)
    private DefenseCouncil council;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id", nullable = false)
    private TopicRegistration registration;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DefenseCouncil getCouncil() { return council; }
    public void setCouncil(DefenseCouncil council) { this.council = council; }

    public TopicRegistration getRegistration() { return registration; }
    public void setRegistration(TopicRegistration registration) { this.registration = registration; }

}
