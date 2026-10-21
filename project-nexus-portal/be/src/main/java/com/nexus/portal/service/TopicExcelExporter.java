package com.nexus.portal.service;

import com.nexus.portal.dto.response.TopicLecturerResponse;
import com.nexus.portal.dto.response.TopicResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/** Builds the Excel report of thesis topics. */
public final class TopicExcelExporter {
    public static final String CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String FILE_NAME_VI = "danh-sach-de-tai-khoa-luan.xlsx";
    public static final String FILE_NAME_EN = "thesis-topics-list.xlsx";

    private static final String[] HEADERS_VI = {
            "Mã đề tài", "Tên đề tài", "Bộ môn", "Chuyên ngành", "GVHD",
            "Số SV tối đa", "Trạng thái", "Đợt đăng ký", "Số nhóm ĐK", "Nhóm được duyệt"
    };

    private static final String[] HEADERS_EN = {
            "Topic ID", "Topic Title", "Department", "Majors", "Advisors",
            "Max Students", "Status", "Registration Period", "Registered Teams", "Assigned Team"
    };

    private TopicExcelExporter() {}

    public static boolean isEnglish(Locale locale) {
        return locale != null && "en".equalsIgnoreCase(locale.getLanguage());
    }

    public static String fileName(Locale locale) {
        return isEnglish(locale) ? FILE_NAME_EN : FILE_NAME_VI;
    }

    public static byte[] export(List<TopicResponse> topics, Locale locale) {
        boolean english = isEnglish(locale);
        String[] headers = english ? HEADERS_EN : HEADERS_VI;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(english ? "Topics" : "Danh sách đề tài");
            writeHeader(workbook, sheet, headers);
            for (int index = 0; index < topics.size(); index++) {
                writeRow(sheet.createRow(index + 1), topics.get(index));
            }
            for (int column = 0; column < headers.length; column++) {
                sheet.autoSizeColumn(column);
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException exception) {
            throw new UncheckedIOException(exception);
        }
    }

    private static void writeHeader(Workbook workbook, Sheet sheet, String[] headers) {
        Row row = sheet.createRow(0);
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setColor(IndexedColors.WHITE.getIndex());
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.ROYAL_BLUE.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        style.setAlignment(HorizontalAlignment.CENTER);

        for (int index = 0; index < headers.length; index++) {
            Cell cell = row.createCell(index);
            cell.setCellValue(headers[index]);
            cell.setCellStyle(style);
        }
    }

    private static void writeRow(Row row, TopicResponse topic) {
        row.createCell(0).setCellValue(topic.getId() != null ? String.valueOf(topic.getId()) : "");
        row.createCell(1).setCellValue(topic.getTitle() != null ? topic.getTitle() : "");
        row.createCell(2).setCellValue(topic.getDepartment() != null ? topic.getDepartment().getName() : "");

        String majors = topic.getMajors() != null
                ? topic.getMajors().stream().map(m -> m.getName()).collect(Collectors.joining(", "))
                : "";
        row.createCell(3).setCellValue(majors);

        String advisors = topic.getAdvisors() != null
                ? topic.getAdvisors().stream().map(TopicLecturerResponse::getFullName).collect(Collectors.joining(", "))
                : "";
        row.createCell(4).setCellValue(advisors);

        row.createCell(5).setCellValue(topic.getMaxStudents() != null ? topic.getMaxStudents() : 0);
        row.createCell(6).setCellValue(topic.getStatus() != null ? topic.getStatus().name() : "");
        row.createCell(7).setCellValue(topic.getPeriodName() != null ? topic.getPeriodName() : "");
        row.createCell(8).setCellValue(topic.getRegisteredTeamsCount());
        row.createCell(9).setCellValue(topic.getAssignedTeam() != null ? topic.getAssignedTeam().getName() : "");
    }
}
