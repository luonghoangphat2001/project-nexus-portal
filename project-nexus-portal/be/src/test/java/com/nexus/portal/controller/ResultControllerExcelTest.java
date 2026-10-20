package com.nexus.portal.controller;

import com.nexus.portal.dto.response.ResultResponse;
import com.nexus.portal.service.ResultService;
import org.apache.poi.ss.usermodel.WorkbookFactory;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;

import java.io.ByteArrayInputStream;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResultControllerExcelTest {
    private final ResultService results = mock(ResultService.class);
    private final Authentication authentication = mock(Authentication.class);

    private ResultResponse.Statistics.DetailRow row() {
        return new ResultResponse.Statistics.DetailRow(
                "Term 1", "Software Engineering", "Nexus Portal", "Team Five", "S007",
                "Student Seven", "Advisor One", new BigDecimal("8.00"),
                new BigDecimal("8.00"), new BigDecimal("8.00"), new BigDecimal("8.00"),
                new BigDecimal("8.50"), new BigDecimal("8.00"), new BigDecimal("8.50"),
                new BigDecimal("9.00"), new BigDecimal("9.00"), new BigDecimal("9.00"),
                new BigDecimal("9.00"), new BigDecimal("9.00"), new BigDecimal("8.65"),
                true, "Advisor comment", "Reviewer comment", "Defense comments");
    }

    private org.springframework.http.ResponseEntity<byte[]> export(Locale locale) {
        when(authentication.getName()).thenReturn("admin");
        when(results.getDetailedReport(null, null, null, "admin")).thenReturn(List.of(row()));
        return new ResultController(results, mock(com.nexus.portal.service.ScoreCalculationService.class))
                .exportDetailedReportExcel(null, null, null, locale, authentication);
    }

    @Test
    void exportsVietnameseWorkbookByDefault() throws Exception {
        var response = export(Locale.forLanguageTag("vi"));

        assertEquals(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
                response.getHeaders().getContentType());
        assertEquals("bao-cao-ket-qua-khoa-luan.xlsx", response.getHeaders().getContentDisposition().getFilename());
        try (var workbook = WorkbookFactory.create(new ByteArrayInputStream(response.getBody()))) {
            var sheet = workbook.getSheetAt(0);
            assertEquals("MSSV", sheet.getRow(0).getCell(4).getStringCellValue());
            assertEquals("Student Seven", sheet.getRow(1).getCell(5).getStringCellValue());
            assertEquals("Advisor One", sheet.getRow(1).getCell(6).getStringCellValue());
            assertEquals(8.00, sheet.getRow(1).getCell(7).getNumericCellValue());
            assertEquals(8.65, sheet.getRow(1).getCell(19).getNumericCellValue());
            assertEquals("Đạt", sheet.getRow(1).getCell(20).getStringCellValue());
            assertEquals("Defense comments", sheet.getRow(1).getCell(23).getStringCellValue());
        }
    }

    @Test
    void exportsEnglishWorkbookWhenEnglishIsSelected() throws Exception {
        var response = export(Locale.ENGLISH);

        assertEquals("thesis-results-report.xlsx", response.getHeaders().getContentDisposition().getFilename());
        try (var workbook = WorkbookFactory.create(new ByteArrayInputStream(response.getBody()))) {
            var sheet = workbook.getSheetAt(0);
            assertEquals("Student ID", sheet.getRow(0).getCell(4).getStringCellValue());
            assertEquals("Final score", sheet.getRow(0).getCell(19).getStringCellValue());
            assertEquals("Passed", sheet.getRow(1).getCell(20).getStringCellValue());
        }
    }
}


