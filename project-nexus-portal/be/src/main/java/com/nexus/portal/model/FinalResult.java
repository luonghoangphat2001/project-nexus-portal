package com.nexus.portal.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "final_results", uniqueConstraints =
        @UniqueConstraint(columnNames = {"assignment_id", "student_id"}))
public class FinalResult extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private DefenseAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "review_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal reviewScore;

    @Column(name = "defense_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal defenseScore;

    @Column(name = "final_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "passed", nullable = false)
    private boolean passed;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "published_by", nullable = false)
    private User publishedBy;

    @Column(name = "published_at", nullable = false)
    private LocalDateTime publishedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public DefenseAssignment getAssignment() { return assignment; }
    public void setAssignment(DefenseAssignment assignment) { this.assignment = assignment; }
    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }
    public BigDecimal getReviewScore() { return reviewScore; }
    public void setReviewScore(BigDecimal reviewScore) { this.reviewScore = reviewScore; }
    public BigDecimal getDefenseScore() { return defenseScore; }
    public void setDefenseScore(BigDecimal defenseScore) { this.defenseScore = defenseScore; }
    public BigDecimal getFinalScore() { return finalScore; }
    public void setFinalScore(BigDecimal finalScore) { this.finalScore = finalScore; }
    public boolean isPassed() { return passed; }
    public void setPassed(boolean passed) { this.passed = passed; }
    public User getPublishedBy() { return publishedBy; }
    public void setPublishedBy(User publishedBy) { this.publishedBy = publishedBy; }
    public LocalDateTime getPublishedAt() { return publishedAt; }
    public void setPublishedAt(LocalDateTime publishedAt) { this.publishedAt = publishedAt; }
}
