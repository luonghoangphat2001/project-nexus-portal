package com.nexus.portal.service;

import com.nexus.portal.dto.response.ResultResponse;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

/** Builds the Excel report of student results with component scores, comments and pass/fail. */
public final class ResultExcelExporter {
    public static final String CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String FILE_NAME_VI = "bao-cao-ket-qua-khoa-luan.xlsx";
    public static final String FILE_NAME_EN = "thesis-results-report.xlsx";

    private static final String[] HEADERS_VI = {
            "Đợt khóa luận", "Bộ môn", "Tên đề tài", "Nhóm", "MSSV", "Sinh viên", "GVHD",
            "Điểm GVHD", "GVHD - Nội dung", "GVHD - Triển khai", "GVHD - Trình bày",
            "Điểm phản biện", "Phản biện - Nội dung", "Phản biện - Triển khai", "Phản biện - Trình bày",
            "Điểm hội đồng", "Hội đồng - Nội dung", "Hội đồng - Triển khai", "Hội đồng - Trình bày",
            "Điểm tổng kết", "Kết quả", "Nhận xét GVHD", "Nhận xét phản biện", "Nhận xét hội đồng"
    };

    private static final String[] HEADERS_EN = {
            "Thesis period", "Department", "Topic", "Team", "Student ID", "Student", "Advisor",
            "Advisor score", "Advisor - Content", "Advisor - Implementation", "Advisor - Presentation",
            "Reviewer score", "Reviewer - Content", "Reviewer - Implementation", "Reviewer - Presentation",
            "Council score", "Council - Content", "Council - Implementation", "Council - Presentation",
            "Final score", "Result", "Advisor comment", "Reviewer comment", "Council comments"
    };

    private ResultExcelExporter() {}

    public static boolean isEnglish(Locale locale) {
        return locale != null && "en".equalsIgnoreCase(locale.getLanguage());
    }

    public static String fileName(Locale locale) {
        return isEnglish(locale) ? FILE_NAME_EN : FILE_NAME_VI;
    }

    public static byte[] export(List<ResultResponse.Statistics.DetailRow> rows, Locale locale) {
        boolean english = isEnglish(locale);
        String[] headers = english ? HEADERS_EN : HEADERS_VI;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(english ? "Thesis results" : "Kết quả khóa luận");
            writeHeader(workbook, sheet, headers);
            for (int index = 0; index < rows.size(); index++) {
                writeRow(sheet.createRow(index + 1), rows.get(index), english);
            }
            for (int column = 0; column < headers.length; column++) {
                sheet.autoSizeColumn(column);
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void writeHeader(Workbook workbook, Sheet sheet, String[] headers) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        Row header = sheet.createRow(0);
        for (int column = 0; column < headers.length; column++) {
            Cell cell = header.createCell(column);
            cell.setCellValue(headers[column]);
            cell.setCellStyle(style);
        }
    }

    private static void writeRow(Row row, ResultResponse.Statistics.DetailRow d, boolean english) {
        String passed = english ? "Passed" : "Đạt";
        String failed = english ? "Failed" : "Không đạt";
        Object[] values = {
                d.periodName(), d.departmentName(), d.topicTitle(), d.teamName(), d.studentCode(),
                d.studentName(), d.advisorName(),
                d.advisorScore(), d.advisorContentScore(), d.advisorImplementationScore(),
                d.advisorPresentationScore(),
                d.reviewScore(), d.reviewContentScore(), d.reviewImplementationScore(),
                d.reviewPresentationScore(),
                d.defenseScore(), d.defenseContentScore(), d.defenseImplementationScore(),
                d.defensePresentationScore(),
                d.finalScore(), d.passed() ? passed : failed,
                d.advisorComment(), d.reviewComment(), d.defenseComments()
        };
        for (int column = 0; column < values.length; column++) {
            Cell cell = row.createCell(column);
            Object value = values[column];
            if (value instanceof BigDecimal score) {
                cell.setCellValue(score.doubleValue());
            } else {
                cell.setCellValue(value == null ? "" : value.toString());
            }
        }
    }
}
