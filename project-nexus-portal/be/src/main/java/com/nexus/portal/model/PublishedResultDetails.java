package com.nexus.portal.model;

import com.nexus.portal.service.CalculatedScore;
import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
@Table(name = "published_result_details")
public class PublishedResultDetails {
    @Id
    @Column(name = "result_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "result_id", nullable = false)
    private Result result;

    @Column(name = "advisor_name", nullable = false)
    private String advisorName;

    @Column(name = "advisor_content_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal advisorContentScore;
    @Column(name = "advisor_implementation_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal advisorImplementationScore;
    @Column(name = "advisor_presentation_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal advisorPresentationScore;

    @Column(name = "review_content_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal reviewContentScore;
    @Column(name = "review_implementation_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal reviewImplementationScore;
    @Column(name = "review_presentation_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal reviewPresentationScore;

    @Column(name = "defense_content_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal defenseContentScore;
    @Column(name = "defense_implementation_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal defenseImplementationScore;
    @Column(name = "defense_presentation_score", nullable = false, precision = 4, scale = 2)
    private BigDecimal defensePresentationScore;

    @Column(name = "advisor_comment", columnDefinition = "TEXT")
    private String advisorComment;

    @Column(name = "review_comment", columnDefinition = "TEXT")
    private String reviewComment;

    @Column(name = "defense_comments", columnDefinition = "TEXT")
    private String defenseComments;

    public static PublishedResultDetails from(Result result, CalculatedScore score) {
        PublishedResultDetails details = new PublishedResultDetails();
        details.id = result.getId();
        details.result = result;
        details.advisorName = score.advisor().evaluatorName();
        details.advisorContentScore = score.advisor().contentScore();
        details.advisorImplementationScore = score.advisor().implementationScore();
        details.advisorPresentationScore = score.advisor().presentationScore();
        details.reviewContentScore = score.reviewer().contentScore();
        details.reviewImplementationScore = score.reviewer().implementationScore();
        details.reviewPresentationScore = score.reviewer().presentationScore();
        details.defenseContentScore = score.defense().contentScore();
        details.defenseImplementationScore = score.defense().implementationScore();
        details.defensePresentationScore = score.defense().presentationScore();
        details.advisorComment = score.advisor().comment();
        details.reviewComment = score.reviewer().comment();
        details.defenseComments = score.defense().comment();
        return details;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getAdvisorName() { return advisorName; }
    public BigDecimal getAdvisorContentScore() { return advisorContentScore; }
    public BigDecimal getAdvisorImplementationScore() { return advisorImplementationScore; }
    public BigDecimal getAdvisorPresentationScore() { return advisorPresentationScore; }
    public BigDecimal getReviewContentScore() { return reviewContentScore; }
    public BigDecimal getReviewImplementationScore() { return reviewImplementationScore; }
    public BigDecimal getReviewPresentationScore() { return reviewPresentationScore; }
    public BigDecimal getDefenseContentScore() { return defenseContentScore; }
    public BigDecimal getDefenseImplementationScore() { return defenseImplementationScore; }
    public BigDecimal getDefensePresentationScore() { return defensePresentationScore; }
    public String getAdvisorComment() { return advisorComment; }
    public String getReviewComment() { return reviewComment; }
    public String getDefenseComments() { return defenseComments; }

    public void setAdvisorContentScore(BigDecimal advisorContentScore) { this.advisorContentScore = advisorContentScore; }
    public void setAdvisorImplementationScore(BigDecimal advisorImplementationScore) { this.advisorImplementationScore = advisorImplementationScore; }
    public void setAdvisorPresentationScore(BigDecimal advisorPresentationScore) { this.advisorPresentationScore = advisorPresentationScore; }
}
