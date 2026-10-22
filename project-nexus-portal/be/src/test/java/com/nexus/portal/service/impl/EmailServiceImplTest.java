package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.EmailLogResponse;
import com.nexus.portal.model.EmailLog;
import com.nexus.portal.repository.EmailLogRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class EmailServiceImplTest {

    @Test
    void testExtractLocalized_bilingualTitleWithPipe() {
        String title = "[VI] Đề tài đã được duyệt: Hệ thống AI | [EN] Topic registration approved: AI System";
        assertEquals("Đề tài đã được duyệt: Hệ thống AI", EmailServiceImpl.extractLocalized(title, "vi"));
        assertEquals("Topic registration approved: AI System", EmailServiceImpl.extractLocalized(title, "en"));
    }

    @Test
    void testExtractLocalized_bilingualContentWithTags() {
        String content = """
                [VI] Chúc mừng! Đăng ký đề tài "Hệ thống AI" của nhóm bạn đã được phê duyệt bởi TS. Nguyễn Văn A.
                [EN] Congratulations! Your team's registration for topic "AI System" has been approved by TS. Nguyễn Văn A.
                """.trim();

        assertEquals("Chúc mừng! Đăng ký đề tài \"Hệ thống AI\" của nhóm bạn đã được phê duyệt bởi TS. Nguyễn Văn A.",
                EmailServiceImpl.extractLocalized(content, "vi"));
        assertEquals("Congratulations! Your team's registration for topic \"AI System\" has been approved by TS. Nguyễn Văn A.",
                EmailServiceImpl.extractLocalized(content, "en"));
    }

    @Test
    void testExtractLocalized_loneViTag() {
        String title = "[VI] Điểm bảo vệ khóa luận: Machine Learning";
        assertEquals("Điểm bảo vệ khóa luận: Machine Learning", EmailServiceImpl.extractLocalized(title, "vi"));
        // Fallback for EN if only VI exists
        assertEquals("Điểm bảo vệ khóa luận: Machine Learning", EmailServiceImpl.extractLocalized(title, "en"));
    }

    @Test
    void testExtractLocalized_plainTextWithoutTags() {
        String plain = "Kiểm tra kết nối SMTP Email thành công";
        assertEquals("Kiểm tra kết nối SMTP Email thành công", EmailServiceImpl.extractLocalized(plain, "vi"));
        assertEquals("Kiểm tra kết nối SMTP Email thành công", EmailServiceImpl.extractLocalized(plain, "en"));
    }

    @Test
    void testExtractLocalized_nullOrEmpty() {
        assertEquals("", EmailServiceImpl.extractLocalized("", "vi"));
        assertEquals("", EmailServiceImpl.extractLocalized(null, "vi"));
        assertEquals("", EmailServiceImpl.extractLocalized("   ", "vi"));
        assertEquals("", EmailServiceImpl.extractLocalized("", "en"));
        assertEquals("", EmailServiceImpl.extractLocalized(null, "en"));
    }

    @Test
    void testExtractLocalized_defenseResultsFormat() {
        String title = "[VI] Điểm bảo vệ khóa luận: Website TMĐT | [EN] Defense evaluation results: Website TMĐT";
        String content = "[VI] Kết quả bảo vệ đề tài \"Website TMĐT\" đã được công bố. Điểm tổng kết: 9.2 (Đạt). Vui lòng vào mục Kết quả bảo vệ để xem chi tiết nhận xét của hội đồng.\n"
                + "[EN] Defense evaluation results for topic \"Website TMĐT\" have been published. Final score: 9.2 (Passed). Please visit Defense Results section to view committee feedback.";

        assertEquals("Điểm bảo vệ khóa luận: Website TMĐT", EmailServiceImpl.extractLocalized(title, "vi"));
        assertEquals("Defense evaluation results: Website TMĐT", EmailServiceImpl.extractLocalized(title, "en"));

        assertEquals("Kết quả bảo vệ đề tài \"Website TMĐT\" đã được công bố. Điểm tổng kết: 9.2 (Đạt). Vui lòng vào mục Kết quả bảo vệ để xem chi tiết nhận xét của hội đồng.",
                EmailServiceImpl.extractLocalized(content, "vi"));
        assertEquals("Defense evaluation results for topic \"Website TMĐT\" have been published. Final score: 9.2 (Passed). Please visit Defense Results section to view committee feedback.",
                EmailServiceImpl.extractLocalized(content, "en"));
    }

    @Test
    void testEmailLogging_recordsMockEmailLog() {
        EmailLogRepository mockRepo = mock(EmailLogRepository.class);
        EmailServiceImpl service = new EmailServiceImpl(null, mockRepo);

        // When sending an email in unconfigured mode
        service.sendEmail("test@nexus.local", "Test Subject", "Test Content");

        ArgumentCaptor<EmailLog> captor = ArgumentCaptor.forClass(EmailLog.class);
        verify(mockRepo, times(1)).save(captor.capture());

        EmailLog saved = captor.getValue();
        assertEquals("test@nexus.local", saved.getRecipient());
        assertEquals("Test Subject", saved.getSubject());
        assertEquals("MOCK", saved.getStatus());
        assertEquals("plain-text", saved.getTemplateName());
    }

    @Test
    void testEmailLogging_testConnectionMockLog() {
        EmailLogRepository mockRepo = mock(EmailLogRepository.class);
        EmailServiceImpl service = new EmailServiceImpl(null, mockRepo);

        boolean result = service.testConnection("admin@nexus.local", "vi");
        assertTrue(result);

        ArgumentCaptor<EmailLog> captor = ArgumentCaptor.forClass(EmailLog.class);
        verify(mockRepo, times(1)).save(captor.capture());

        EmailLog saved = captor.getValue();
        assertEquals("admin@nexus.local", saved.getRecipient());
        assertEquals("MOCK", saved.getStatus());
        assertEquals("test-connection", saved.getTemplateName());
    }

    @Test
    void testGetEmailLogs_paginationAndMapping() {
        EmailLogRepository mockRepo = mock(EmailLogRepository.class);
        EmailServiceImpl service = new EmailServiceImpl(null, mockRepo);

        EmailLog log1 = new EmailLog("user@nexus.local", "User", "sender@nexus.local",
                "Hello", "topic-status", "SENT", null);
        Page<EmailLog> page = new PageImpl<>(List.of(log1));

        when(mockRepo.findWithFilters(eq("user"), eq("SENT"), any(PageRequest.class)))
                .thenReturn(page);

        Page<EmailLogResponse> result = service.getEmailLogs("user", "SENT", PageRequest.of(0, 10));
        assertEquals(1, result.getTotalElements());
        assertEquals("user@nexus.local", result.getContent().get(0).getRecipient());
        assertEquals("SENT", result.getContent().get(0).getStatus());
    }
}
