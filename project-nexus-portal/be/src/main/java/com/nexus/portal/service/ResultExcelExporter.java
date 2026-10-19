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

/** Builds the Excel report of student results with component scores, comments and pass/fail. */
public final class ResultExcelExporter {
    public static final String CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    public static final String FILE_NAME = "bao-cao-ket-qua-khoa-luan.xlsx";

    private static final String[] HEADERS = {
            "Đợt khóa luận", "Bộ môn", "Tên đề tài", "Nhóm", "MSSV", "Sinh viên", "GVHD",
            "Điểm GVHD", "GVHD - Nội dung", "GVHD - Triển khai", "GVHD - Trình bày",
            "Điểm phản biện", "Phản biện - Nội dung", "Phản biện - Triển khai", "Phản biện - Trình bày",
            "Điểm hội đồng", "Hội đồng - Nội dung", "Hội đồng - Triển khai", "Hội đồng - Trình bày",
            "Điểm tổng kết", "Kết quả", "Nhận xét GVHD", "Nhận xét phản biện", "Nhận xét hội đồng"
    };

    private ResultExcelExporter() {}

    public static byte[] export(List<ResultResponse.Statistics.DetailRow> rows) {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Kết quả khóa luận");
            writeHeader(workbook, sheet);
            for (int index = 0; index < rows.size(); index++) {
                writeRow(sheet.createRow(index + 1), rows.get(index));
            }
            for (int column = 0; column < HEADERS.length; column++) {
                sheet.autoSizeColumn(column);
            }
            workbook.write(output);
            return output.toByteArray();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static void writeHeader(Workbook workbook, Sheet sheet) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        style.setFont(font);
        Row header = sheet.createRow(0);
        for (int column = 0; column < HEADERS.length; column++) {
            Cell cell = header.createCell(column);
            cell.setCellValue(HEADERS[column]);
            cell.setCellStyle(style);
        }
    }

    private static void writeRow(Row row, ResultResponse.Statistics.DetailRow d) {
        Object[] values = {
                d.periodName(), d.departmentName(), d.topicTitle(), d.teamName(), d.studentCode(),
                d.studentName(), d.advisorName(),
                d.advisorScore(), d.advisorContentScore(), d.advisorImplementationScore(),
                d.advisorPresentationScore(),
                d.reviewScore(), d.reviewContentScore(), d.reviewImplementationScore(),
                d.reviewPresentationScore(),
                d.defenseScore(), d.defenseContentScore(), d.defenseImplementationScore(),
                d.defensePresentationScore(),
                d.finalScore(), d.passed() ? "Đạt" : "Không đạt",
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
