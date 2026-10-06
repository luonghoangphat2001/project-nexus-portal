package com.nexus.portal.model;

import com.nexus.portal.enums.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "defense_council_members", uniqueConstraints = @UniqueConstraint(columnNames = {"council_id", "lecturer_id"}))
public class DefenseCouncilMember extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "council_id", nullable = false)
    private DefenseCouncil council;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id", nullable = false)
    private User lecturer;

    @Enumerated(EnumType.STRING)
    @Column(name = "member_role", nullable = false, length = 30)
    private CouncilMemberRole role;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DefenseCouncil getCouncil() { return council; }
    public void setCouncil(DefenseCouncil council) { this.council = council; }

    public User getLecturer() { return lecturer; }
    public void setLecturer(User lecturer) { this.lecturer = lecturer; }

    public CouncilMemberRole getRole() { return role; }
    public void setRole(CouncilMemberRole role) { this.role = role; }

}
