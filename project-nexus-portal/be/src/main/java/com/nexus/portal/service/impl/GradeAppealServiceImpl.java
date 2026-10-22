package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.GradeAppealRequest;
import com.nexus.portal.dto.request.GradeAppealStatusRequest;
import com.nexus.portal.dto.response.GradeAppealResponse;
import com.nexus.portal.enums.AppealStatus;
import com.nexus.portal.enums.RoleName;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.exception.ResourceNotFoundException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.DefenseAssignmentRepository;
import com.nexus.portal.repository.GradeAppealRepository;
import com.nexus.portal.repository.ResultRepository;
import com.nexus.portal.repository.UserRepository;
import com.nexus.portal.service.AuditLogService;
import com.nexus.portal.service.GradeAppealService;
import com.nexus.portal.service.NotificationService;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Transactional(readOnly = true)
public class GradeAppealServiceImpl implements GradeAppealService {

    private final GradeAppealRepository appeals;
    private final DefenseAssignmentRepository assignments;
    private final ResultRepository results;
    private final UserRepository users;
    private final DefenseAccessPolicy access;
    private final NotificationService notificationService;
    private final AuditLogService audit;

    public GradeAppealServiceImpl(
            GradeAppealRepository appeals,
            DefenseAssignmentRepository assignments,
            ResultRepository results,
            UserRepository users,
            DefenseAccessPolicy access,
            NotificationService notificationService,
            AuditLogService audit) {
        this.appeals = appeals;
        this.assignments = assignments;
        this.results = results;
        this.users = users;
        this.access = access;
        this.notificationService = notificationService;
        this.audit = audit;
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public GradeAppealResponse submitAppeal(Long assignmentId, GradeAppealRequest request, String identifier) {
        User student = access.getUser(identifier);
        if (!access.hasRole(student, RoleName.ROLE_USER)) {
            throw new AccessDeniedException("Chỉ có sinh viên mới có quyền gửi đơn phúc khảo");
        }

        DefenseAssignment assignment = assignments.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề tài bảo vệ"));

        // Kiểm tra sinh viên có thuộc nhóm của đề tài này không
        if (!access.isTeamMember(student, assignment.getRegistration())) {
            throw new BadRequestException("Bạn không thuộc nhóm sinh viên thực hiện đề tài này");
        }

        // Kiểm tra kết quả đã được công bố chưa
        boolean published = results.findByAssignmentIdOrderByStudentIdAsc(assignmentId).stream()
                .anyMatch(r -> r.getStudent().getId().equals(student.getId()));
        if (!published) {
            throw new BadRequestException("Đề tài này chưa được công bố điểm chính thức, không thể phúc khảo");
        }

        // Kiểm tra xem đã có đơn phúc khảo đang chờ xử lý hay không
        if (appeals.existsByAssignmentIdAndStudentIdAndStatus(assignmentId, student.getId(), AppealStatus.PENDING)) {
            throw new BadRequestException("Bạn đang có đơn phúc khảo đang chờ xử lý cho đề tài này. Vui lòng chờ phản hồi");
        }

        GradeAppeal appeal = new GradeAppeal();
        appeal.setAssignment(assignment);
        appeal.setStudent(student);
        appeal.setReason(request.reason().trim());
        appeal.setStatus(AppealStatus.PENDING);
        GradeAppeal saved = appeals.saveAndFlush(appeal);

        // Gửi thông báo đến 3 nhóm: Hội đồng, Trưởng khoa / Trưởng bộ môn, GVHD
        sendAppealNotifications(assignment, student, request.reason().trim());

        audit.log(student.getId(), student.getUsername(), "SUBMIT_GRADE_APPEAL",
                "appeals/" + saved.getId(), "Sinh viên nộp đơn phúc khảo cho đề tài " + assignment.getId(), null, null, "SUCCESS");

        return toResponse(saved);
    }

    @Override
    public List<GradeAppealResponse> getMyAppeals(String identifier) {
        User student = access.getUser(identifier);
        return appeals.findByStudentIdOrderByCreatedAtDesc(student.getId()).stream()
                .map(this::toResponse).toList();
    }

    @Override
    public List<GradeAppealResponse> getAppeals(Long assignmentId, String identifier) {
        User user = access.getUser(identifier);
        boolean isAdmin = access.hasRole(user, RoleName.ROLE_ADMIN);
        boolean isPrincipal = access.hasRole(user, RoleName.ROLE_PRINCIPAL);

        if (assignmentId != null) {
            DefenseAssignment assignment = assignments.findById(assignmentId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đề tài bảo vệ"));
            boolean canManage = access.canManage(user, assignment.getCouncil().getDepartment());
            boolean isCouncilMember = access.isCouncilMember(user, assignment.getCouncil());
            boolean isAdvisor = access.isAdvisor(user, assignment.getRegistration());
            boolean isStudent = access.isTeamMember(user, assignment.getRegistration());

            if (!canManage && !isCouncilMember && !isAdvisor && !isStudent) {
                throw new AccessDeniedException("Bạn không có quyền xem đơn phúc khảo của đề tài này");
            }
            return appeals.findByAssignmentIdOrderByCreatedAtDesc(assignmentId).stream()
                    .map(this::toResponse).toList();
        }

        if (isAdmin) {
            return appeals.findAll().stream()
                    .sorted(Comparator.comparing(GradeAppeal::getCreatedAt).reversed())
                    .map(this::toResponse).toList();
        }

        if (isPrincipal) {
            // Find appeals in departments user manages
            Set<Long> deptIds = new HashSet<>();
            user.getDepartments().forEach(d -> deptIds.add(d.getId()));
            return appeals.findAll().stream()
                    .filter(a -> a.getAssignment() != null
                            && a.getAssignment().getCouncil() != null
                            && a.getAssignment().getCouncil().getDepartment() != null
                            && (deptIds.contains(a.getAssignment().getCouncil().getDepartment().getId())
                                || access.canManage(user, a.getAssignment().getCouncil().getDepartment())))
                    .sorted(Comparator.comparing(GradeAppeal::getCreatedAt).reversed())
                    .map(this::toResponse).toList();
        }

        // Council member or teacher
        return appeals.findByCouncilMemberId(user.getId()).stream()
                .map(this::toResponse).toList();
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public GradeAppealResponse updateAppealStatus(Long id, GradeAppealStatusRequest request, String identifier) {
        User reviewer = access.getUser(identifier);
        GradeAppeal appeal = appeals.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn phúc khảo"));

        Department dept = appeal.getAssignment().getCouncil().getDepartment();
        if (!access.canManage(reviewer, dept)) {
            throw new AccessDeniedException("Chỉ Quản trị viên hoặc Trưởng khoa / Trưởng bộ môn mới có quyền duyệt đơn phúc khảo");
        }

        appeal.setStatus(request.status());
        if (request.responseNote() != null) {
            appeal.setResponseNote(request.responseNote().trim());
        }
        appeal.setReviewedBy(reviewer);
        GradeAppeal saved = appeals.saveAndFlush(appeal);

        // Gửi thông báo kết quả phúc khảo lại cho sinh viên
        String topicTitle = appeal.getAssignment().getRegistration().getTopic().getTitle();
        String statusVi = switch (request.status()) {
            case APPROVED -> "Đã chấp nhận phúc khảo (Hội đồng sẽ tiến hành xem xét và chấm lại)";
            case REJECTED -> "Từ chối phúc khảo";
            case RESOLVED -> "Đã hoàn tất chấm lại điểm";
            case PENDING -> "Đang chờ xử lý";
        };

        String note = appeal.getResponseNote() != null && !appeal.getResponseNote().isBlank()
                ? appeal.getResponseNote() : "Không có";

        notificationService.sendNotification(
                appeal.getStudent(),
                reviewer,
                "[VI] Cập nhật kết quả phúc khảo: " + topicTitle + " | [EN] Appeal status update: " + topicTitle,
                "[VI] Đơn xin phúc khảo điểm của bạn cho đề tài \"" + topicTitle + "\" đã được cập nhật trạng thái: "
                        + statusVi + ".\nGhi chú / Phản hồi: " + note + "\n"
                        + "[EN] Your grade appeal for topic \"" + topicTitle + "\" has been updated: "
                        + request.status() + ".\nNote: " + note
        );

        audit.log(reviewer.getId(), reviewer.getUsername(), "UPDATE_GRADE_APPEAL",
                "appeals/" + id, "Cập nhật trạng thái đơn phúc khảo " + id + " thành " + request.status(), null, null, "SUCCESS");

        return toResponse(saved);
    }

    private void sendAppealNotifications(DefenseAssignment assignment, User student, String reason) {
        String topicTitle = assignment.getRegistration().getTopic().getTitle();
        String studentInfo = student.getFullName() + (student.getStudentCode() != null ? " (" + student.getStudentCode() + ")" : "");
        String teamName = assignment.getRegistration().getTeam() != null ? assignment.getRegistration().getTeam().getName() : "";

        String title = "[VI] Đơn phúc khảo điểm: " + topicTitle + " | [EN] Grade appeal: " + topicTitle;
        String content = "[VI] Sinh viên " + studentInfo + " thuộc nhóm \"" + teamName + "\" đã gửi đơn xin phúc khảo điểm cho đề tài \"" + topicTitle + "\".\n"
                + "Lý do: " + reason + "\n"
                + "Đề nghị Hội đồng chấm thi, Trưởng bộ môn và GVHD xem xét bài bảo vệ và phiếu chấm điểm.\n"
                + "[EN] Student " + studentInfo + " (Team \"" + teamName + "\") has submitted a grade appeal for topic \"" + topicTitle + "\".\n"
                + "Reason: " + reason + "\n"
                + "Please review the defense presentation and evaluation scoresheets.";

        Set<Long> notifiedUserIds = new HashSet<>();
        notifiedUserIds.add(student.getId()); // Không gửi lại cho chính sinh viên

        // 1. Thành viên Hội đồng chấm
        if (assignment.getCouncil() != null && assignment.getCouncil().getMembers() != null) {
            for (DefenseCouncilMember member : assignment.getCouncil().getMembers()) {
                if (member.getLecturer() != null && notifiedUserIds.add(member.getLecturer().getId())) {
                    notificationService.sendNotification(member.getLecturer(), student, title, content);
                }
            }
        }

        // 2. Trưởng khoa / Trưởng bộ môn
        Department dept = assignment.getRegistration().getTopic().getDepartment();
        Long deptId = dept != null ? dept.getId() : null;
        Long facultyId = (dept != null && dept.getFaculty() != null) ? dept.getFaculty().getId() : null;
        List<User> principals = users.findPrincipalsByDepartmentOrFaculty(deptId, facultyId);
        for (User principal : principals) {
            if (notifiedUserIds.add(principal.getId())) {
                notificationService.sendNotification(principal, student, title, content);
            }
        }

        // 3. Giáo viên hướng dẫn (GVHD)
        Topic topic = assignment.getRegistration().getTopic();
        if (topic.getTopicLecturers() != null) {
            for (TopicLecturer tl : topic.getTopicLecturers()) {
                if (tl.getLecturer() != null && notifiedUserIds.add(tl.getLecturer().getId())) {
                    notificationService.sendNotification(tl.getLecturer(), student, title, content);
                }
            }
        }
    }

    private GradeAppealResponse toResponse(GradeAppeal a) {
        DefenseAssignment assignment = a.getAssignment();
        TopicRegistration registration = assignment != null ? assignment.getRegistration() : null;
        Topic topic = registration != null ? registration.getTopic() : null;
        Team team = registration != null ? registration.getTeam() : null;

        return new GradeAppealResponse(
                a.getId(),
                assignment != null ? assignment.getId() : null,
                registration != null ? registration.getId() : null,
                topic != null ? topic.getId() : null,
                topic != null ? topic.getTitle() : null,
                team != null ? team.getName() : null,
                a.getStudent().getId(),
                a.getStudent().getFullName(),
                a.getStudent().getStudentCode(),
                a.getReason(),
                a.getStatus(),
                a.getResponseNote(),
                a.getReviewedBy() != null ? a.getReviewedBy().getId() : null,
                a.getReviewedBy() != null ? a.getReviewedBy().getFullName() : null,
                a.getCreatedAt(),
                a.getUpdatedAt()
        );
    }
}

