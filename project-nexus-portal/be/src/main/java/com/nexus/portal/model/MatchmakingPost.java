package com.nexus.portal.model;

import com.nexus.portal.enums.PostStatus;
import com.nexus.portal.enums.PostType;
import jakarta.persistence.*;

import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "matchmaking_posts")
public class MatchmakingPost extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", length = 30, nullable = false)
    private PostType postType = PostType.STUDENT_LOOKING_FOR_TEAM;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(name = "title", length = 200, nullable = false)
    private String title;

    @Column(name = "goals", columnDefinition = "TEXT")
    private String goals;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id")
    private Department department;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cohort_id", nullable = false)
    private Cohort cohort;

    @Column(name = "slots_needed", nullable = false)
    private Integer slotsNeeded = 1;

    @Column(name = "contact_info", length = 255, nullable = false)
    private String contactInfo;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 30, nullable = false)
    private PostStatus status = PostStatus.OPEN;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "matchmaking_post_skills", joinColumns = @JoinColumn(name = "post_id"))
    @Column(name = "skill", length = 100, nullable = false)
    private Set<String> skills = new HashSet<>();

    public MatchmakingPost() {
    }

    public MatchmakingPost(Long id, PostType postType, User author, Team team, String title, String goals,
                           Department department, Faculty faculty, Cohort cohort, Integer slotsNeeded,
                           String contactInfo, PostStatus status, Set<String> skills) {
        this.id = id;
        this.postType = postType != null ? postType : PostType.STUDENT_LOOKING_FOR_TEAM;
        this.author = author;
        this.team = team;
        this.title = title;
        this.goals = goals;
        this.department = department;
        this.faculty = faculty;
        this.cohort = cohort;
        this.slotsNeeded = slotsNeeded != null ? slotsNeeded : 1;
        this.contactInfo = contactInfo;
        this.status = status != null ? status : PostStatus.OPEN;
        this.skills = skills != null ? skills : new HashSet<>();
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private PostType postType = PostType.STUDENT_LOOKING_FOR_TEAM;
        private User author;
        private Team team;
        private String title;
        private String goals;
        private Department department;
        private Faculty faculty;
        private Cohort cohort;
        private Integer slotsNeeded = 1;
        private String contactInfo;
        private PostStatus status = PostStatus.OPEN;
        private Set<String> skills = new HashSet<>();

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder postType(PostType postType) {
            this.postType = postType;
            return this;
        }

        public Builder author(User author) {
            this.author = author;
            return this;
        }

        public Builder team(Team team) {
            this.team = team;
            return this;
        }

        public Builder title(String title) {
            this.title = title;
            return this;
        }

        public Builder goals(String goals) {
            this.goals = goals;
            return this;
        }

        public Builder department(Department department) {
            this.department = department;
            return this;
        }

        public Builder faculty(Faculty faculty) {
            this.faculty = faculty;
            return this;
        }

        public Builder cohort(Cohort cohort) {
            this.cohort = cohort;
            return this;
        }

        public Builder slotsNeeded(Integer slotsNeeded) {
            this.slotsNeeded = slotsNeeded;
            return this;
        }

        public Builder contactInfo(String contactInfo) {
            this.contactInfo = contactInfo;
            return this;
        }

        public Builder status(PostStatus status) {
            this.status = status;
            return this;
        }

        public Builder skills(Set<String> skills) {
            this.skills = skills;
            return this;
        }

        public MatchmakingPost build() {
            return new MatchmakingPost(id, postType, author, team, title, goals, department, faculty, cohort, slotsNeeded, contactInfo, status, skills);
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public PostType getPostType() {
        return postType;
    }

    public void setPostType(PostType postType) {
        this.postType = postType;
    }

    public User getAuthor() {
        return author;
    }

    public void setAuthor(User author) {
        this.author = author;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getGoals() {
        return goals;
    }

    public void setGoals(String goals) {
        this.goals = goals;
    }

    public Department getDepartment() {
        return department;
    }

    public void setDepartment(Department department) {
        this.department = department;
    }

    public Faculty getFaculty() {
        return faculty;
    }

    public void setFaculty(Faculty faculty) {
        this.faculty = faculty;
    }

    public Cohort getCohort() {
        return cohort;
    }

    public void setCohort(Cohort cohort) {
        this.cohort = cohort;
    }

    public Integer getSlotsNeeded() {
        return slotsNeeded;
    }

    public void setSlotsNeeded(Integer slotsNeeded) {
        this.slotsNeeded = slotsNeeded;
    }

    public String getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(String contactInfo) {
        this.contactInfo = contactInfo;
    }

    public PostStatus getStatus() {
        return status;
    }

    public void setStatus(PostStatus status) {
        this.status = status;
    }

    public Set<String> getSkills() {
        return skills;
    }

    public void setSkills(Set<String> skills) {
        this.skills = skills;
    }
}
