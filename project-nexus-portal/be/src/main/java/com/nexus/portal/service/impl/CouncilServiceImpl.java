package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.*;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.CouncilService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class CouncilServiceImpl implements CouncilService {
    private final DefenseCouncilRepository councils;
    private final DefenseAssignmentRepository assignments;
    private final AssessmentRepository assessments;
    private final DepartmentRepository departments;
    private final RegistrationPeriodRepository periods;
    private final UserRepository users;
    private final DefenseAccessPolicy access;
    private final Clock clock;

    public CouncilServiceImpl(DefenseCouncilRepository councils, DefenseAssignmentRepository assignments,
                              AssessmentRepository assessments, DepartmentRepository departments,
                              RegistrationPeriodRepository periods, UserRepository users,
                              DefenseAccessPolicy access, Clock clock) {
        this.councils = councils;
        this.assignments = assignments;
        this.assessments = assessments;
        this.departments = departments;
        this.periods = periods;
        this.users = users;
        this.access = access;
        this.clock = clock;
    }

    @Override
    public List<CouncilResponse> getCouncils(String identifier) {
        User user = access.getUser(identifier);
        return councils.findAllByOrderByStartsAtDesc().stream().filter(c -> canReadCouncil(c, user))
                .map(c -> toResponse(c, user)).toList();
    }

    private boolean canReadCouncil(DefenseCouncil c, User user) {
        return access.canManage(user, c.getDepartment()) || access.isCouncilMember(user, c)
                || assignments.findByCouncilId(c.getId()).stream().anyMatch(a -> access.canRead(user, a.getRegistration()));
    }

    @Override
    public CouncilOptionsResponse getOptions(String identifier) {
        User user = access.getUser(identifier);
        List<Department> scope = departments.findAll().stream().filter(d -> access.canManage(user, d)).toList();
        if (scope.isEmpty() && !access.hasRole(user, RoleName.ROLE_ADMIN)) {
            throw new AccessDeniedException("You are not authorized to manage any department");
        }
        return new CouncilOptionsResponse(
                scope.stream().map(d -> new CouncilOptionsResponse.Option(d.getId(), d.getName())).toList(),
                periods.findAll().stream().map(p -> new CouncilOptionsResponse.Option(p.getId(), p.getName())).toList(),
                users.findAll().stream().filter(this::isEligibleLecturer)
                        .filter(u -> access.hasRole(user, RoleName.ROLE_ADMIN) || u.getDepartments().stream()
                                .anyMatch(d -> scope.stream().anyMatch(s -> s.getId().equals(d.getId()))))
                        .map(u -> new CouncilOptionsResponse.Lecturer(u.getId(), u.getFullName(),
                                u.getDepartments().stream().map(Department::getId).toList())).toList());
    }

    private boolean isEligibleLecturer(User u) {
        return u.isActive() && (access.hasRole(u, RoleName.ROLE_TEACHER) || access.hasRole(u, RoleName.ROLE_COUNCIL)
                || access.hasRole(u, RoleName.ROLE_PRINCIPAL));
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CouncilResponse createCouncil(CouncilRequest request, String identifier) {
        departments.lockScheduleDepartments();
        User user = access.getUser(identifier);
        DefenseCouncil council = new DefenseCouncil();
        applyRequest(council, request, user);
        return toResponse(councils.saveAndFlush(council), user);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CouncilResponse updateCouncil(Long id, CouncilRequest request, String identifier) {
        departments.lockScheduleDepartments();
        User user = access.getUser(identifier);
        DefenseCouncil council = getLockedCouncil(id);
        access.requireManager(user, council.getDepartment());
        requireScheduled(council);
        if (assessments.existsByAssignmentCouncilId(id)) {
            throw new BadRequestException("Schedules and members cannot be changed while assessments exist; delete draft assessments first");
        }
        // Validate first, then replace members. Flushing removal avoids unique-key collisions.
        validateRequest(council, request, user);
        council.getMembers().clear();
        councils.flush();
        applyFields(council, request);
        return toResponse(councils.saveAndFlush(council), user);
    }

    private void applyRequest(DefenseCouncil council, CouncilRequest request, User user) {
        validateRequest(council, request, user);
        applyFields(council, request);
    }

    private void validateRequest(DefenseCouncil council, CouncilRequest request, User user) {
        Department department = departments.findById(request.departmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Department not found"));
        access.requireManager(user, department);
        RegistrationPeriod period = periods.findById(request.periodId())
                .orElseThrow(() -> new ResourceNotFoundException("Registration period not found"));
        if (period.getStatus() == PeriodStatus.DRAFT || period.getStatus() == PeriodStatus.COMPLETED) {
            throw new BadRequestException("The registration period has not opened or has already been completed");
        }
        if (!period.getTargetFaculties().isEmpty() && period.getTargetFaculties().stream()
                .noneMatch(f -> f.getId().equals(department.getFaculty().getId()))) {
            throw new BadRequestException("The department does not belong to a faculty targeted by this registration period");
        }
        if (!request.endsAt().isAfter(request.startsAt()) || !request.startsAt().isAfter(LocalDateTime.now(clock))) {
            throw new BadRequestException("The defense must start in the future and end after its start time");
        }
        Set<Long> ids = new HashSet<>();
        for (CouncilRequest.Member member : request.members()) {
            if (!ids.add(member.lecturerId())) throw new BadRequestException("Each lecturer can hold only one role in a council");
            User lecturer = users.findById(member.lecturerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Lecturer not found"));
            if (!isEligibleLecturer(lecturer) || lecturer.getDepartments().stream()
                    .noneMatch(d -> d.getId().equals(request.departmentId()))) {
                throw new BadRequestException("Council members must be active lecturers in the selected department");
            }
        }
        for (CouncilMemberRole required : List.of(CouncilMemberRole.CHAIR, CouncilMemberRole.SECRETARY, CouncilMemberRole.REVIEWER)) {
            if (request.members().stream().filter(m -> m.role() == required).count() != 1) {
                throw new BadRequestException("A council must have exactly one chair, one secretary and one reviewer");
            }
        }
        for (DefenseCouncil other : councils.findAllByOrderByStartsAtDesc()) {
            if (Objects.equals(other.getId(), council.getId()) || other.getStatus() == CouncilStatus.CANCELLED) continue;
            if (request.startsAt().isBefore(other.getEndsAt()) && request.endsAt().isAfter(other.getStartsAt())) {
                boolean sharedMember = other.getMembers().stream().anyMatch(m -> ids.contains(m.getLecturer().getId()));
                if (sharedMember || other.getRoom().trim().equalsIgnoreCase(request.room().trim())) {
                    throw new BadRequestException("Lecturer or room schedule conflicts with council: " + other.getName());
                }
            }
        }
        if (council.getId() != null) {
            for (DefenseAssignment assignment : assignments.findByCouncilId(council.getId())) {
                validateRegistration(assignment.getRegistration(), request.departmentId(), request.periodId(), request.members());
            }
        }
    }

    private void applyFields(DefenseCouncil council, CouncilRequest request) {
        council.setName(request.name().trim());
        council.setRoom(request.room().trim());
        council.setDepartment(departments.findById(request.departmentId()).orElseThrow());
        council.setPeriod(periods.findById(request.periodId()).orElseThrow());
        council.setStartsAt(request.startsAt());
        council.setEndsAt(request.endsAt());
        for (CouncilRequest.Member item : request.members()) {
            DefenseCouncilMember member = new DefenseCouncilMember();
            member.setCouncil(council);
            member.setLecturer(users.findById(item.lecturerId()).orElseThrow());
            member.setRole(item.role());
            council.getMembers().add(member);
        }
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CouncilResponse assignRegistration(Long id, DefenseAssignmentRequest request, String identifier) {
        User user = access.getUser(identifier);
        DefenseCouncil council = getLockedCouncil(id);
        access.requireManager(user, council.getDepartment());
        requireScheduled(council);
        if (!council.getStartsAt().isAfter(LocalDateTime.now(clock))) throw new BadRequestException("The council has already started; teams can no longer be added");
        TopicRegistration registration = access.getRegistration(request.registrationId(), true);
        validateRegistration(registration, council.getDepartment().getId(), council.getPeriod().getId(),
                council.getMembers().stream().map(m -> new CouncilRequest.Member(m.getLecturer().getId(), m.getRole())).toList());
        if (assignments.findByRegistrationId(registration.getId()).isPresent()) {
            throw new BadRequestException("The team is already assigned; remove the existing assignment before changing councils");
        }
        DefenseAssignment assignment = new DefenseAssignment();
        assignment.setCouncil(council);
        assignment.setRegistration(registration);
        assignments.saveAndFlush(assignment);
        return toResponse(council, user);
    }

    private void validateRegistration(TopicRegistration registration, Long departmentId, Long periodId,
                                      List<CouncilRequest.Member> members) {
        if (registration.getStatus() != RegistrationStatus.APPROVED
                || !registration.getTopic().getDepartment().getId().equals(departmentId)
                || !registration.getTopic().getPeriod().getId().equals(periodId)) {
            throw new BadRequestException("The team must have an approved project registration in the council's department and registration period");
        }
        Long reviewer = members.stream().filter(m -> m.role() == CouncilMemberRole.REVIEWER).findFirst().orElseThrow().lecturerId();
        if (registration.getTopic().getTopicLecturers().stream().anyMatch(l -> l.getLecturer().getId().equals(reviewer))) {
            throw new BadRequestException("An advisor cannot review a project they advise");
        }
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public void removeAssignment(Long councilId, Long assignmentId, String identifier) {
        User user = access.getUser(identifier);
        DefenseCouncil council = getLockedCouncil(councilId);
        access.requireManager(user, council.getDepartment());
        if (council.getStatus() == CouncilStatus.COMPLETED) throw new BadRequestException("The council has been completed");
        DefenseAssignment assignment = assignments.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment not found"));
        if (!assignment.getCouncil().getId().equals(councilId)) throw new BadRequestException("The assignment does not belong to this council");
        access.getRegistration(assignment.getRegistration().getId(), true);
        if (assessments.existsByAssignmentId(assignmentId)) throw new BadRequestException("Assignments with assessments cannot be removed");
        assignments.delete(assignment);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public CouncilResponse changeStatus(Long id, CouncilStatusRequest request, String identifier) {
        User user = access.getUser(identifier);
        DefenseCouncil council = getLockedCouncil(id);
        access.requireManager(user, council.getDepartment());
        requireScheduled(council);
        if (request.status() == CouncilStatus.SCHEDULED) throw new BadRequestException("The council is already scheduled");
        if (request.status() == CouncilStatus.CANCELLED) {
            if (assessments.existsByAssignmentCouncilIdAndStatus(id, AssessmentStatus.SUBMITTED)) {
                throw new BadRequestException("A council with submitted assessments cannot be cancelled");
            }
        } else {
            if (LocalDateTime.now(clock).isBefore(council.getEndsAt())) throw new BadRequestException("The scheduled defense has not ended yet");
            List<DefenseAssignment> allocated = assignments.findByCouncilId(id);
            if (allocated.isEmpty()) throw new BadRequestException("No teams have been assigned to the council");
            for (DefenseAssignment a : allocated) {
                List<Assessment> scores = assessments.findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(a.getId());
                for (DefenseRegistrationResponse.Student student : access.toResponse(a.getRegistration(), user).students()) {
                    for (DefenseCouncilMember member : council.getMembers()) {
                        if (!hasSubmitted(scores, student.id(), member.getLecturer().getId(), AssessmentType.DEFENSE)
                                || (member.getRole() == CouncilMemberRole.REVIEWER
                                && !hasSubmitted(scores, student.id(), member.getLecturer().getId(), AssessmentType.REVIEW))) {
                            throw new BadRequestException("Required review and defense assessments are missing for one or more students");
                        }
                    }
                }
            }
        }
        council.setStatus(request.status());
        return toResponse(councils.save(council), user);
    }

    private boolean hasSubmitted(List<Assessment> scores, Long studentId, Long evaluatorId, AssessmentType type) {
        return scores.stream().anyMatch(s -> s.getStudent().getId().equals(studentId)
                && s.getEvaluator().getId().equals(evaluatorId) && s.getType() == type && s.getStatus() == AssessmentStatus.SUBMITTED);
    }

    private DefenseCouncil getLockedCouncil(Long id) {
        return councils.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("Council not found"));
    }

    private void requireScheduled(DefenseCouncil council) {
        if (council.getStatus() != CouncilStatus.SCHEDULED) throw new BadRequestException("The council has been completed or cancelled");
    }

    private CouncilResponse toResponse(DefenseCouncil c, User user) {
        boolean manager = access.canManage(user, c.getDepartment());
        Optional<DefenseCouncilMember> ownMember = c.getMembers().stream()
                .filter(m -> m.getLecturer().getId().equals(user.getId())).findFirst();
        return new CouncilResponse(c.getId(), c.getName(), c.getDepartment().getId(), c.getDepartment().getName(),
                c.getPeriod().getId(), c.getPeriod().getName(), c.getRoom(), c.getStartsAt(), c.getEndsAt(), c.getStatus(), manager,
                c.getMembers().stream().map(m -> new CouncilResponse.Member(m.getLecturer().getId(), m.getLecturer().getFullName(), m.getRole())).toList(),
                assignments.findByCouncilId(c.getId()).stream()
                        .filter(a -> manager || ownMember.isPresent() || access.canRead(user, a.getRegistration()))
                        .map(a -> new CouncilResponse.Assignment(a.getId(), access.toResponse(a.getRegistration(), user),
                                c.getStatus() == CouncilStatus.SCHEDULED && ownMember.filter(m -> m.getRole() == CouncilMemberRole.REVIEWER).isPresent(),
                                c.getStatus() == CouncilStatus.SCHEDULED && ownMember.isPresent())).toList());
    }
}
