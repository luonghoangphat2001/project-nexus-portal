package com.nexus.portal;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexus.portal.dto.request.*;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.model.*;
import com.nexus.portal.service.*;
import com.nexus.portal.security.JwtTokenProvider;
import com.nexus.portal.security.UserPrincipal;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.*;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.*;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.test.context.*;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.test.context.transaction.TestTransaction;

import java.math.BigDecimal;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;

import static org.assertj.core.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {"debug=false", "logging.level.org.hibernate.SQL=OFF", "logging.level.org.springframework=WARN"})
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(DefenseWorkflowIntegrationTest.TimeConfig.class)
@Transactional
@TestConstructor(autowireMode = TestConstructor.AutowireMode.ALL)
class DefenseWorkflowIntegrationTest {
    private final EntityManager em;
    private final ReportService reports;
    private final CouncilService councils;
    private final AssessmentService assessments;
    private final MockMvc mvc;
    private final ObjectMapper json;
    private final MutableClock clock;
    private final JwtTokenProvider tokens;
    private Department department, otherDepartment;
    private RegistrationPeriod period;
    private Topic topic;
    private TopicRegistration registration;
    private User leader, member, outsider, chair, secretary, reviewer, admin, principal;

    DefenseWorkflowIntegrationTest(EntityManager em, ReportService reports, CouncilService councils,
                                   AssessmentService assessments, MockMvc mvc, ObjectMapper json, MutableClock clock, JwtTokenProvider tokens) {
        this.em = em; this.reports = reports; this.councils = councils; this.assessments = assessments;
        this.mvc = mvc; this.json = json; this.clock = clock;
        this.tokens = tokens;
    }

    @BeforeEach
    void setUp() {
        clock.set(LocalDateTime.of(2026, 10, 5, 10, 0));
        Faculty faculty = persist(new Faculty(null, "FIT", "Information Technology"));
        department = persist(new Department(null, faculty, "SE", "Software Engineering"));
        otherDepartment = persist(new Department(null, faculty, "IS", "Information Systems"));
        Major major = persist(new Major(null, department, "SE", "Software Engineering"));
        Cohort cohort = persist(new Cohort(null, "K22", "K22", 2022, 2026));
        period = persist(RegistrationPeriod.builder().name("Term 1").academicYear("2026-2027").semester(1)
                .startDate(now().minusDays(30)).endDate(now().plusDays(30)).submissionDeadline(now().plusDays(60))
                .status(PeriodStatus.OPEN).build());
        leader = createUser("leader", RoleName.ROLE_USER, department);
        member = createUser("member", RoleName.ROLE_USER, department);
        outsider = createUser("outsider", RoleName.ROLE_USER, otherDepartment);
        chair = createUser("chair", RoleName.ROLE_TEACHER, department);
        secretary = createUser("secretary", RoleName.ROLE_COUNCIL, department);
        reviewer = createUser("reviewer", RoleName.ROLE_TEACHER, department);
        admin = createUser("admin", RoleName.ROLE_ADMIN, department);
        principal = createUser("principal", RoleName.ROLE_PRINCIPAL, otherDepartment);
        Team team = persist(Team.builder().name("Alpha").leader(leader).period(period).faculty(faculty)
                .cohort(cohort).major(major).status(TeamStatus.LOCKED).build());
        persist(TeamMember.builder().team(team).user(leader).roleInTeam(TeamRole.LEADER).build());
        persist(TeamMember.builder().team(team).user(member).roleInTeam(TeamRole.MEMBER).build());
        topic = persist(Topic.builder().title("Nexus Portal").department(department).period(period).build());
        registration = persist(TopicRegistration.builder().topic(topic).team(team).status(RegistrationStatus.APPROVED).build());
        em.flush();
    }

    @Test
    void topicCreationPersistsBothAdvisorsWithoutDuplicateManagedIdentifiers() throws Exception {
        TopicCreateRequest request = new TopicCreateRequest();
        request.setTitle("QA topic creation regression");
        request.setDepartmentId(department.getId());
        request.setPeriodId(period.getId());
        request.setCoAdvisorId(reviewer.getId());
        String response = mvc.perform(post("/api/topics").header("Authorization", token(chair))
                .contentType("application/json").content(json.writeValueAsBytes(request)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.advisors.length()").value(2))
                .andReturn().getResponse().getContentAsString();
        Long topicId = json.readTree(response).path("data").path("id").asLong();
        em.flush();
        em.clear();
        assertThat(em.find(Topic.class, topicId).getTopicLecturers()).hasSize(2);
    }

    @Test
    void fullHttpWorkflowUsesRealJwtAndPersistsSubmittedReview() throws Exception {
        String adminToken = token(admin), reviewerToken = token(reviewer), leaderToken = token(leader);
        String created = mvc.perform(post("/api/councils").header("Authorization", adminToken).contentType("application/json")
                .content(json.writeValueAsBytes(councilRequest("HTTP Council", "A101", now().plusDays(1), defaultMembers()))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        Long councilId = json.readTree(created).path("data").path("id").asLong();
        String allocated = mvc.perform(post("/api/councils/{id}/assignments", councilId).header("Authorization", adminToken)
                .contentType("application/json").content(json.writeValueAsBytes(new DefenseAssignmentRequest(registration.getId()))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Long assignmentId = json.readTree(allocated).path("data").path("assignments").get(0).path("id").asLong();
        mvc.perform(multipart("/api/reports/registrations/{id}/documents", registration.getId()).file(file("report.pdf", "%PDF-1.7 test"))
                .param("type", "REPORT").param("title", "Final report").header("Authorization", leaderToken))
                .andExpect(status().isCreated());
        String draft = mvc.perform(post("/api/assessments").header("Authorization", reviewerToken).contentType("application/json")
                .content(json.writeValueAsBytes(scoreRequest(assignmentId, leader.getId(), AssessmentType.REVIEW))))
                .andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        Long scoreId = json.readTree(draft).path("data").path("id").asLong();
        mvc.perform(post("/api/assessments/{id}/submit", scoreId).header("Authorization", reviewerToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.status").value("SUBMITTED"))
                .andExpect(jsonPath("$.data.canEdit").value(false));
        mvc.perform(get("/api/reports/registrations").header("Authorization", leaderToken))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].canSubmit").value(false));
        mvc.perform(get("/api/assessments").param("assignmentId", assignmentId.toString()).header("Authorization", leaderToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DirtiesContext(methodMode = DirtiesContext.MethodMode.AFTER_METHOD)
    void concurrentUploadsAllocateDifferentVersionsAndSubmittedReviewCannotBeOverwritten() throws Exception {
        Long assignmentId = allocateCouncil().assignments().get(0).id();
        reports.uploadDocument(registration.getId(), upload(), "leader");
        AssessmentRequest request = scoreRequest(assignmentId, leader.getId(), AssessmentType.REVIEW);
        Long scoreId = assessments.saveDraft(request, "reviewer").id();
        Long registrationId = registration.getId();
        TestTransaction.flagForCommit();
        TestTransaction.end();
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            CountDownLatch uploadGate = new CountDownLatch(1);
            Future<Integer> first = executor.submit(() -> { uploadGate.await(); return reports.uploadDocument(registrationId, upload(), "leader").version(); });
            Future<Integer> second = executor.submit(() -> { uploadGate.await(); return reports.uploadDocument(registrationId, upload(), "leader").version(); });
            uploadGate.countDown();
            assertThat(List.of(first.get(20, TimeUnit.SECONDS), second.get(20, TimeUnit.SECONDS))).containsExactlyInAnyOrder(2, 3);
            CountDownLatch scoreGate = new CountDownLatch(1);
            Future<?> submission = executor.submit(() -> { scoreGate.await(); assessments.submitAssessment(scoreId, "reviewer"); return null; });
            Future<?> edit = executor.submit(() -> {
                scoreGate.await();
                try { assessments.saveDraft(request, "reviewer"); }
                catch (BadRequestException alreadySubmitted) { /* Submission won the workflow lock. */ }
                return null;
            });
            scoreGate.countDown();
            submission.get(20, TimeUnit.SECONDS); edit.get(20, TimeUnit.SECONDS);
            assertThat(assessments.getAssessments(assignmentId, "reviewer").get(0).status()).isEqualTo(AssessmentStatus.SUBMITTED);
            assertThatThrownBy(() -> reports.uploadDocument(registrationId, upload(), "leader")).isInstanceOf(BadRequestException.class);
        } finally { executor.shutdownNow(); }
    }

    @Test
    void multipartApiStoresVersionsAndAllowsAuthorizedDownload() throws Exception {
        for (int version = 1; version <= 2; version++) {
            mvc.perform(multipart("/api/reports/registrations/{id}/documents", registration.getId())
                    .file(file("report.pdf", "%PDF-1.7 test"))
                    .param("type", "REPORT").param("title", "Report " + version).param("note", "Version")
                    .with(user("leader").roles("USER")))
                    .andExpect(status().isCreated()).andExpect(jsonPath("$.data.version").value(version));
        }
        ReportDocumentResponse document = reports.getDocuments(registration.getId(), "member").get(0);
        mvc.perform(get("/api/reports/documents/{id}/content", document.id()).with(user("member").roles("USER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.base64").value(Base64.getEncoder().encodeToString("%PDF-1.7 test".getBytes())));
        mvc.perform(get("/api/reports/documents/{id}/content", document.id()).with(user("outsider").roles("USER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/reports/registrations/{id}/documents", registration.getId()).with(user("member").roles("USER")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data[0].content").doesNotExist());
    }

    @Test
    void onlyLeaderCanUploadAndApprovedRegistrationIsRequired() {
        assertThatThrownBy(() -> reports.uploadDocument(registration.getId(), upload(), "member")).isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> reports.uploadDocument(registration.getId(), upload(), "outsider")).isInstanceOf(AccessDeniedException.class);
        registration.setStatus(RegistrationStatus.PENDING);
        assertThatThrownBy(() -> reports.uploadDocument(registration.getId(), upload(), "leader")).isInstanceOf(BadRequestException.class);
    }

    @Test
    void deadlineIsInclusiveAndCannotBeBypassedByLeader() {
        period.setSubmissionDeadline(now());
        assertThat(reports.uploadDocument(registration.getId(), upload(), "leader").version()).isEqualTo(1);
        clock.set(now().plusSeconds(1));
        assertThatThrownBy(() -> reports.uploadDocument(registration.getId(), upload(), "leader")).isInstanceOf(BadRequestException.class);
    }

    @Test
    void unsafeFakeAndEmptyFilesAreRejected() {
        for (MockMultipartFile invalid : List.of(file("fake.pdf", "executable"), file("source.exe", "MZ"), file("empty.txt", ""))) {
            assertThatThrownBy(() -> reports.uploadDocument(registration.getId(), new ReportUploadRequest(DocumentType.REPORT, "Report", "", invalid), "leader"))
                    .isInstanceOf(BadRequestException.class);
        }
    }

    @Test
    void oversizedFilesAreRejected() {
        MockMultipartFile oversized = new MockMultipartFile("file", "report.txt", "text/plain", new byte[10485761]);
        assertThatThrownBy(() -> reports.uploadDocument(registration.getId(), new ReportUploadRequest(DocumentType.REPORT, "Report", "", oversized), "leader"))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void visibleRegistrationsAreScopedToTeamAdvisorCouncilOrManagingDepartment() {
        assertThat(reports.getRegistrations("outsider")).isEmpty();
        assertThat(reports.getRegistrations("principal")).isEmpty();
        assertThat(reports.getRegistrations("leader")).hasSize(1);
        assertThat(reports.getRegistrations("admin")).hasSize(1);
        assertThat(reports.getRegistrations("reviewer")).isEmpty();
        allocateCouncil();
        assertThat(reports.getRegistrations("reviewer")).hasSize(1);
    }

    @Test
    void createsUpdatesAndAllocatesCouncilWithoutDuplicateMemberRows() {
        CouncilResponse council = councils.createCouncil(councilRequest("A", "A101", now().plusDays(1), defaultMembers()), "admin");
        CouncilResponse edited = councils.updateCouncil(council.id(), councilRequest("B", "A102", now().plusDays(2), defaultMembers()), "admin");
        assertThat(edited.name()).isEqualTo("B");
        assertThat(edited.members()).hasSize(3);
        CouncilResponse allocated = councils.assignRegistration(council.id(), new DefenseAssignmentRequest(registration.getId()), "admin");
        assertThat(allocated.assignments()).hasSize(1);
        assertThat(councils.getCouncils("leader")).hasSize(1);
        assertThat(councils.getCouncils("outsider")).isEmpty();
    }

    @Test
    void overlappingMemberSchedulesAreRejectedEvenInDifferentRooms() {
        councils.createCouncil(councilRequest("A", "A101", now().plusDays(1), defaultMembers()), "admin");
        assertThatThrownBy(() -> councils.createCouncil(councilRequest("B", "A102", now().plusDays(1).plusMinutes(30), defaultMembers()), "admin"))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("schedule conflicts");
    }

    @Test
    void overlappingRoomsAreRejectedEvenWithDifferentMembers() {
        councils.createCouncil(councilRequest("A", "A101", now().plusDays(1), defaultMembers()), "admin");
        List<CouncilRequest.Member> others = List.of(
                new CouncilRequest.Member(createUser("chair2", RoleName.ROLE_TEACHER, department).getId(), CouncilMemberRole.CHAIR),
                new CouncilRequest.Member(createUser("secretary2", RoleName.ROLE_TEACHER, department).getId(), CouncilMemberRole.SECRETARY),
                new CouncilRequest.Member(createUser("reviewer2", RoleName.ROLE_TEACHER, department).getId(), CouncilMemberRole.REVIEWER));
        assertThatThrownBy(() -> councils.createCouncil(councilRequest("B", "a101", now().plusDays(1), others), "admin"))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("schedule conflicts");
    }

    @Test
    void adjacentSchedulesAreAllowed() {
        councils.createCouncil(councilRequest("A", "A101", now().plusDays(1), defaultMembers()), "admin");
        assertThat(councils.createCouncil(councilRequest("B", "A101", now().plusDays(1).plusHours(2), defaultMembers()), "admin").id()).isNotNull();
    }

    @Test
    void principalCannotManageOutsideDepartmentAndStudentCannotCreateCouncil() throws Exception {
        assertThatThrownBy(() -> councils.createCouncil(councilRequest("A", "A101", now().plusDays(1), defaultMembers()), "principal"))
                .isInstanceOf(AccessDeniedException.class);
        mvc.perform(post("/api/councils").with(user("leader").roles("USER")).contentType("application/json")
                .content(json.writeValueAsBytes(councilRequest("A", "A101", now().plusDays(1), defaultMembers()))))
                .andExpect(status().isForbidden());
    }

    @Test
    void advisorCannotBeReviewerForTheirTopic() {
        TopicLecturer advisor = new TopicLecturer(topic, reviewer, AdvisorRole.PRIMARY);
        persist(advisor); topic.getTopicLecturers().add(advisor);
        CouncilResponse council = councils.createCouncil(councilRequest("A", "A101", now().plusDays(1), defaultMembers()), "admin");
        assertThatThrownBy(() -> councils.assignRegistration(council.id(), new DefenseAssignmentRequest(registration.getId()), "admin"))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("advise");
    }

    @Test
    void aRegistrationCannotBeAssignedTwiceAndCancelledCouncilCanReleaseGroup() {
        CouncilResponse first = allocateCouncil();
        CouncilResponse second = councils.createCouncil(councilRequest("B", "B101", now().plusDays(2), defaultMembers()), "admin");
        assertThatThrownBy(() -> councils.assignRegistration(second.id(), new DefenseAssignmentRequest(registration.getId()), "admin"))
                .isInstanceOf(BadRequestException.class);
        councils.changeStatus(first.id(), new CouncilStatusRequest(CouncilStatus.CANCELLED), "admin");
        councils.removeAssignment(first.id(), first.assignments().get(0).id(), "admin");
        assertThat(councils.assignRegistration(second.id(), new DefenseAssignmentRequest(registration.getId()), "admin").assignments()).hasSize(1);
    }

    @Test
    void onlyAssignedReviewerCanReviewAndStudentMustBelongToTeam() {
        Long assignmentId = allocateCouncil().assignments().get(0).id();
        assertThatThrownBy(() -> assessments.saveDraft(scoreRequest(assignmentId, leader.getId(), AssessmentType.REVIEW), "chair"))
                .isInstanceOf(AccessDeniedException.class);
        assertThatThrownBy(() -> assessments.saveDraft(scoreRequest(assignmentId, outsider.getId(), AssessmentType.REVIEW), "reviewer"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> assessments.saveDraft(scoreRequest(assignmentId, leader.getId(), AssessmentType.DEFENSE), "admin"))
                .isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void draftsArePrivateAndUpsertedPerStudentEvaluatorAndType() {
        Long assignmentId = allocateCouncil().assignments().get(0).id();
        AssessmentRequest request = scoreRequest(assignmentId, leader.getId(), AssessmentType.REVIEW);
        AssessmentResponse first = assessments.saveDraft(request, "reviewer");
        AssessmentResponse second = assessments.saveDraft(request, "reviewer");
        assertThat(second.id()).isEqualTo(first.id());
        assertThat(assessments.getAssessments(assignmentId, "chair")).isEmpty();
        assertThat(assessments.getAssessments(assignmentId, "admin")).isEmpty();
        assertThat(assessments.getAssessments(assignmentId, "reviewer")).hasSize(1);
        assertThatThrownBy(() -> assessments.deleteDraft(first.id(), "chair")).isInstanceOf(AccessDeniedException.class);
    }

    @Test
    void submittingReviewLocksScoresDocumentsAndCouncilStructure() {
        CouncilResponse council = allocateCouncil();
        Long assignmentId = council.assignments().get(0).id();
        reports.uploadDocument(registration.getId(), upload(), "leader");
        AssessmentRequest request = scoreRequest(assignmentId, leader.getId(), AssessmentType.REVIEW);
        AssessmentResponse draft = assessments.saveDraft(request, "reviewer");
        assertThat(assessments.submitAssessment(draft.id(), "reviewer").status()).isEqualTo(AssessmentStatus.SUBMITTED);
        assertThat(assessments.getAssessments(assignmentId, "chair")).hasSize(1);
        assertThatThrownBy(() -> assessments.saveDraft(request, "reviewer")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> assessments.deleteDraft(draft.id(), "reviewer")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> reports.uploadDocument(registration.getId(), upload(), "leader")).isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> councils.changeStatus(council.id(), new CouncilStatusRequest(CouncilStatus.CANCELLED), "admin"))
                .isInstanceOf(BadRequestException.class);
        assertThatThrownBy(() -> councils.removeAssignment(council.id(), assignmentId, "admin")).isInstanceOf(BadRequestException.class);
    }

    @Test
    void defenseCannotBeSubmittedBeforeScheduledStart() {
        Long assignmentId = allocateCouncil().assignments().get(0).id();
        reports.uploadDocument(registration.getId(), upload(), "leader");
        AssessmentResponse draft = assessments.saveDraft(scoreRequest(assignmentId, leader.getId(), AssessmentType.DEFENSE), "chair");
        assertThatThrownBy(() -> assessments.submitAssessment(draft.id(), "chair")).isInstanceOf(BadRequestException.class).hasMessageContaining("has not started yet");
    }

    @Test
    void reviewRequiresSubmittedReportAndNonBlankComment() {
        Long assignmentId = allocateCouncil().assignments().get(0).id();
        AssessmentResponse draft = assessments.saveDraft(scoreRequest(assignmentId, leader.getId(), AssessmentType.REVIEW), "reviewer");
        assertThatThrownBy(() -> assessments.submitAssessment(draft.id(), "reviewer")).isInstanceOf(BadRequestException.class).hasMessageContaining("has not submitted a report");
        reports.uploadDocument(registration.getId(), upload(), "leader");
        AssessmentRequest empty = new AssessmentRequest(assignmentId, leader.getId(), AssessmentType.REVIEW,
                BigDecimal.ONE, BigDecimal.ONE, BigDecimal.ONE, "", "", "", " ");
        assessments.saveDraft(empty, "reviewer");
        assertThatThrownBy(() -> assessments.submitAssessment(draft.id(), "reviewer")).isInstanceOf(BadRequestException.class).hasMessageContaining("Comments are required");
    }

    @Test
    void completingCouncilRequiresEveryStudentAndEvaluatorToSubmitAllRequiredSheets() {
        CouncilResponse council = allocateCouncil();
        Long assignmentId = council.assignments().get(0).id();
        reports.uploadDocument(registration.getId(), upload(), "leader");
        clock.set(council.endsAt().plusMinutes(1));
        assertThatThrownBy(() -> councils.changeStatus(council.id(), new CouncilStatusRequest(CouncilStatus.COMPLETED), "admin"))
                .isInstanceOf(BadRequestException.class).hasMessageContaining("assessments are missing");
        for (User student : List.of(leader, member)) {
            for (User evaluator : List.of(chair, secretary, reviewer)) {
                AssessmentResponse draft = assessments.saveDraft(scoreRequest(assignmentId, student.getId(), AssessmentType.DEFENSE), evaluator.getUsername());
                assessments.submitAssessment(draft.id(), evaluator.getUsername());
            }
            AssessmentResponse review = assessments.saveDraft(scoreRequest(assignmentId, student.getId(), AssessmentType.REVIEW), "reviewer");
            assessments.submitAssessment(review.id(), "reviewer");
        }
        assertThat(councils.changeStatus(council.id(), new CouncilStatusRequest(CouncilStatus.COMPLETED), "admin").status()).isEqualTo(CouncilStatus.COMPLETED);
        assertThat(assessments.getAssessments(assignmentId, "admin")).hasSize(8);
    }

    @Test
    void httpValidationRejectsInvalidScoresMissingMultipartFieldsAndMalformedEnums() throws Exception {
        Long assignmentId = allocateCouncil().assignments().get(0).id();
        AssessmentRequest invalid = new AssessmentRequest(assignmentId, leader.getId(), AssessmentType.REVIEW,
                new BigDecimal("10.01"), BigDecimal.ONE, BigDecimal.ONE, "", "", "", "Good");
        mvc.perform(post("/api/assessments").with(user("reviewer").roles("TEACHER"))
                .contentType("application/json").content(json.writeValueAsBytes(invalid)))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(multipart("/api/reports/registrations/{id}/documents", registration.getId())
                .param("type", "REPORT").param("title", "").with(user("leader").roles("USER")))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(patch("/api/councils/{id}/status", 1).with(user("admin").roles("ADMIN"))
                .contentType("application/json").content("{\"status\":\"BAD\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void apiRequiresAuthenticationAndStudentsCannotSeeUnpublishedScores() throws Exception {
        Long assignmentId = allocateCouncil().assignments().get(0).id();
        mvc.perform(get("/api/reports/registrations")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/assessments").param("assignmentId", assignmentId.toString()).with(user("leader").roles("USER")))
                .andExpect(status().isForbidden());
        assertThatThrownBy(() -> assessments.getAssessments(assignmentId, "leader")).isInstanceOf(AccessDeniedException.class);
    }

    private CouncilResponse allocateCouncil() {
        CouncilResponse council = councils.createCouncil(councilRequest("A", "A101", now().plusDays(1), defaultMembers()), "admin");
        return councils.assignRegistration(council.id(), new DefenseAssignmentRequest(registration.getId()), "admin");
    }

    private CouncilRequest councilRequest(String name, String room, LocalDateTime startsAt, List<CouncilRequest.Member> members) {
        return new CouncilRequest(name, department.getId(), period.getId(), room, startsAt, startsAt.plusHours(2), members);
    }

    private List<CouncilRequest.Member> defaultMembers() {
        return List.of(new CouncilRequest.Member(chair.getId(), CouncilMemberRole.CHAIR),
                new CouncilRequest.Member(secretary.getId(), CouncilMemberRole.SECRETARY),
                new CouncilRequest.Member(reviewer.getId(), CouncilMemberRole.REVIEWER));
    }

    private AssessmentRequest scoreRequest(Long assignmentId, Long studentId, AssessmentType type) {
        return new AssessmentRequest(assignmentId, studentId, type, new BigDecimal("8.50"), new BigDecimal("9.00"),
                new BigDecimal("8.00"), "Clear", "More tests", "Explain design", "Good work");
    }

    private ReportUploadRequest upload() {
        return new ReportUploadRequest(DocumentType.REPORT, "Report", "", file("report.pdf", "%PDF-1.7 test"));
    }

    private MockMultipartFile file(String name, String content) {
        return new MockMultipartFile("file", name, "application/octet-stream", content.getBytes(java.nio.charset.StandardCharsets.UTF_8));
    }

    private User createUser(String name, RoleName role, Department department) {
        Role entityRole = em.createQuery("select r from Role r where r.name = :name", Role.class).setParameter("name", role)
                .getResultStream().findFirst().orElseGet(() -> persist(new Role(null, role, role.name())));
        return persist(User.builder().username(name).email(name + "@test.local").fullName(name).password("test")
                .roles(new HashSet<>(Set.of(entityRole))).departments(new HashSet<>(Set.of(department))).build());
    }

    private <T> T persist(T entity) { em.persist(entity); return entity; }
    private String token(User user) {
        UserPrincipal principal = UserPrincipal.create(user);
        return "Bearer " + tokens.generateToken(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
    }
    private LocalDateTime now() { return LocalDateTime.now(clock); }

    @TestConfiguration
    static class TimeConfig {
        @Bean @Primary MutableClock testClock() { return new MutableClock(); }
    }

    static class MutableClock extends Clock {
        private final ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");
        private Instant current;
        void set(LocalDateTime date) { current = date.atZone(zone).toInstant(); }
        @Override public ZoneId getZone() { return zone; }
        @Override public Clock withZone(ZoneId requested) { return Clock.fixed(current, requested); }
        @Override public Instant instant() { return current; }
    }
}
