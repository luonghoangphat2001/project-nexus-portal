package com.nexus.portal.model;

import com.nexus.portal.enums.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "assessments", uniqueConstraints = @UniqueConstraint(columnNames = {"assignment_id", "evaluator_id", "student_id", "assessment_type"}))
public class Assessment extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private DefenseAssignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "evaluator_id", nullable = false)
    private User evaluator;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(name = "assessment_type", nullable = false, length = 30)
    private AssessmentType type;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private AssessmentStatus status = AssessmentStatus.DRAFT;

    @Column(name = "content_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal contentScore;

    @Column(name = "implementation_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal implementationScore;

    @Column(name = "presentation_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal presentationScore;

    @Column(name = "strengths", length = 4000)
    private String strengths;

    @Column(name = "weaknesses", length = 4000)
    private String weaknesses;

    @Column(name = "questions", length = 4000)
    private String questions;

    @Column(name = "comment", length = 4000)
    private String comment;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public DefenseAssignment getAssignment() { return assignment; }
    public void setAssignment(DefenseAssignment assignment) { this.assignment = assignment; }

    public User getEvaluator() { return evaluator; }
    public void setEvaluator(User evaluator) { this.evaluator = evaluator; }

    public User getStudent() { return student; }
    public void setStudent(User student) { this.student = student; }

    public AssessmentType getType() { return type; }
    public void setType(AssessmentType type) { this.type = type; }

    public AssessmentStatus getStatus() { return status; }
    public void setStatus(AssessmentStatus status) { this.status = status; }

    public BigDecimal getContentScore() { return contentScore; }
    public void setContentScore(BigDecimal contentScore) { this.contentScore = contentScore; }

    public BigDecimal getImplementationScore() { return implementationScore; }
    public void setImplementationScore(BigDecimal implementationScore) { this.implementationScore = implementationScore; }

    public BigDecimal getPresentationScore() { return presentationScore; }
    public void setPresentationScore(BigDecimal presentationScore) { this.presentationScore = presentationScore; }

    public String getStrengths() { return strengths; }
    public void setStrengths(String strengths) { this.strengths = strengths; }

    public String getWeaknesses() { return weaknesses; }
    public void setWeaknesses(String weaknesses) { this.weaknesses = weaknesses; }

    public String getQuestions() { return questions; }
    public void setQuestions(String questions) { this.questions = questions; }

    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

}
