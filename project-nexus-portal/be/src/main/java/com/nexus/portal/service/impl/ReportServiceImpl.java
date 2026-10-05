package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.ReportUploadRequest;
import com.nexus.portal.dto.response.*;
import com.nexus.portal.enums.*;
import com.nexus.portal.exception.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.ReportService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Isolation;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.charset.*;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ReportServiceImpl implements ReportService {
    private final ReportDocumentRepository documents;
    private final TopicRegistrationRepository registrations;
    private final DefenseAssignmentRepository assignments;
    private final AssessmentRepository assessments;
    private final DefenseAccessPolicy access;
    private final long maxFileBytes;

    public ReportServiceImpl(ReportDocumentRepository documents, TopicRegistrationRepository registrations,
                             DefenseAssignmentRepository assignments, AssessmentRepository assessments,
                             DefenseAccessPolicy access, @Value("${app.reports.max-file-bytes}") long maxFileBytes) {
        this.documents = documents;
        this.registrations = registrations;
        this.assignments = assignments;
        this.assessments = assessments;
        this.access = access;
        this.maxFileBytes = maxFileBytes;
    }

    @Override
    public List<DefenseRegistrationResponse> getRegistrations(String identifier) {
        User user = access.getUser(identifier);
        return registrations.findByStatus(RegistrationStatus.APPROVED).stream()
                .filter(r -> access.canRead(user, r)).map(r -> access.toResponse(r, user)).toList();
    }

    @Override
    public List<ReportDocumentResponse> getDocuments(Long registrationId, String identifier) {
        User user = access.getUser(identifier);
        access.requireRead(user, access.getRegistration(registrationId, false));
        return documents.findMetadataByRegistrationId(registrationId);
    }

    @Override
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public ReportDocumentResponse uploadDocument(Long registrationId, ReportUploadRequest request, String identifier) {
        User user = access.getUser(identifier);
        TopicRegistration registration = access.getRegistration(registrationId, true);
        access.requireRead(user, registration);
        if (!access.hasRole(user, RoleName.ROLE_USER) || !access.isTeamMember(user, registration)
                || !Objects.equals(registration.getTeam().getLeader().getId(), user.getId())) {
            throw new AccessDeniedException("Only the team leader can submit documents");
        }
        assignments.findByRegistrationId(registrationId).ifPresent(a -> {
            if (a.getCouncil().getStatus() == CouncilStatus.COMPLETED
                    || assessments.findByAssignmentIdOrderByStudentIdAscEvaluatorIdAsc(a.getId()).stream()
                    .anyMatch(s -> s.getStatus() == AssessmentStatus.SUBMITTED)) {
                throw new BadRequestException("Document submissions are locked because an assessment has already been submitted");
            }
        });
        if (!access.canSubmit(user, registration)) throw new BadRequestException("The report submission deadline has passed");
        if (request.file().isEmpty() || request.file().getSize() > maxFileBytes) {
            throw new BadRequestException("The file must not be empty and must not exceed " + maxFileBytes / 1024 / 1024 + " MB");
        }
        String name = Optional.ofNullable(request.file().getOriginalFilename()).orElse("")
                .replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1);
        if (name.isBlank() || name.length() > 255 || name.chars().anyMatch(Character::isISOControl)) {
            throw new BadRequestException("Invalid file name");
        }
        byte[] content;
        try { content = request.file().getBytes(); }
        catch (IOException ex) { throw new BadRequestException("Unable to read the uploaded file"); }
        String mime = validateContent(name, content);
        ReportDocument document = new ReportDocument();
        document.setRegistration(registration);
        document.setSubmittedBy(user);
        document.setType(request.type());
        document.setTitle(request.title().trim());
        document.setNote(request.note());
        document.setFileName(name);
        document.setContentType(mime);
        document.setContent(content);
        document.setFileSize((long) content.length);
        document.setVersion(documents.findLastVersion(registrationId, request.type()) + 1);
        return toResponse(documents.saveAndFlush(document));
    }

    private String validateContent(String name, byte[] bytes) {
        String extension = name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
        boolean zip = bytes.length >= 4 && bytes[0] == 'P' && bytes[1] == 'K' && bytes[2] == 3 && bytes[3] == 4;
        if (extension.equals("pdf") && bytes.length >= 5 && new String(bytes, 0, 5, StandardCharsets.US_ASCII).equals("%PDF-")) {
            return "application/pdf";
        }
        if (zip && Set.of("zip", "docx", "pptx").contains(extension)) {
            return switch (extension) {
                case "docx" -> "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
                case "pptx" -> "application/vnd.openxmlformats-officedocument.presentationml.presentation";
                default -> "application/zip";
            };
        }
        if (extension.equals("txt")) {
            try {
                StandardCharsets.UTF_8.newDecoder().onMalformedInput(CodingErrorAction.REPORT).decode(ByteBuffer.wrap(bytes));
                for (byte value : bytes) if (value == 0) throw new BadRequestException("The text file contains binary data");
                return "text/plain";
            } catch (CharacterCodingException ex) { throw new BadRequestException("TXT files must use UTF-8 encoding"); }
        }
        throw new BadRequestException("Only valid PDF, DOCX, PPTX, ZIP or TXT files are accepted");
    }

    @Override
    public DocumentContentResponse downloadDocument(Long documentId, String identifier) {
        ReportDocument document = documents.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("Document not found"));
        access.requireRead(access.getUser(identifier), document.getRegistration());
        return new DocumentContentResponse(document.getFileName(), document.getContentType(),
                Base64.getEncoder().encodeToString(document.getContent()));
    }

    private ReportDocumentResponse toResponse(ReportDocument d) {
        return new ReportDocumentResponse(d.getId(), d.getRegistration().getId(), d.getType(), d.getTitle(), d.getNote(),
                d.getFileName(), d.getContentType(), d.getFileSize(), d.getVersion(), d.getSubmittedBy().getFullName(), d.getCreatedAt());
    }
}
