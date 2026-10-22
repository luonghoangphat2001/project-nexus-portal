package com.nexus.portal.service.impl;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

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
}
