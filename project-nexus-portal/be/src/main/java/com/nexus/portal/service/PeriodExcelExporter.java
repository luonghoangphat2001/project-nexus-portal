package com.nexus.portal.service;

import com.nexus.portal.dto.response.RegistrationPeriodResponse;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

/** Builds the Excel export for registration periods. */
public final class PeriodExcelExporter {
    public static final String CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String FILE_NAME_VI = "danh-sach-dot-dang-ky.xlsx";
    public static final String FILE_NAME_EN = "registration-periods-list.xlsx";

    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private static final String[] HEADERS_VI = {
            "Mã đợt", "Tên đợt đăng ký", "Niên khóa", "Học kỳ",
            "Bắt đầu đăng ký", "Hạn chót đăng ký", "Hạn nộp báo cáo", "Trạng thái"
    };

    private static final String[] HEADERS_EN = {
            "Period ID", "Period Name", "Academic Year", "Semester",
            "Registration Start", "Registration End", "Submission Deadline", "Status"
    };

    private PeriodExcelExporter() {}

    public static boolean isEnglish(Locale locale) {
        return locale != null && "en".equalsIgnoreCase(locale.getLanguage());
    }

    public static String fileName(Locale locale) {
        return isEnglish(locale) ? FILE_NAME_EN : FILE_NAME_VI;
    }

    public static byte[] export(List<RegistrationPeriodResponse> periods, Locale locale) {
        boolean english = isEnglish(locale);
        String[] headers = english ? HEADERS_EN : HEADERS_VI;
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet(english ? "Registration Periods" : "Đợt đăng ký");
            writeHeader(workbook, sheet, headers);
            for (int index = 0; index < periods.size(); index++) {
                writeRow(sheet.createRow(index + 1), periods.get(index));
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

    private static void writeRow(Row row, RegistrationPeriodResponse period) {
        row.createCell(0).setCellValue(period.id() != null ? String.valueOf(period.id()) : "");
        row.createCell(1).setCellValue(period.name() != null ? period.name() : "");
        row.createCell(2).setCellValue(period.academicYear() != null ? period.academicYear() : "");
        row.createCell(3).setCellValue(period.semester() != null ? String.valueOf(period.semester()) : "");
        row.createCell(4).setCellValue(period.startDate() != null ? period.startDate().format(FORMATTER) : "");
        row.createCell(5).setCellValue(period.endDate() != null ? period.endDate().format(FORMATTER) : "");
        row.createCell(6).setCellValue(period.submissionDeadline() != null ? period.submissionDeadline().format(FORMATTER) : "");
        row.createCell(7).setCellValue(period.status() != null ? period.status().name() : "");
    }
}
