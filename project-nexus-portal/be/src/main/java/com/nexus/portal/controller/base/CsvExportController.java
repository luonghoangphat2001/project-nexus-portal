package com.nexus.portal.controller.base;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Controller cơ sở dùng chung cho các chức năng xuất file CSV (mở được bằng Excel).
 * <p>
 * Controller con chỉ cần khai báo tên file, tiêu đề cột và cách map một bản ghi thành một dòng;
 * phần dựng CSV, escape, BOM UTF-8 và header HTTP do lớp này xử lý.
 *
 * @param <T> kiểu bản ghi được xuất
 */
public abstract class CsvExportController<T> {

    private static final String BOM = "\uFEFF";
    private static final String LINE_BREAK = "\r\n";
    private static final String FORMULA_PREFIXES = "=+-@";

    /** Tên file tải về, ví dụ {@code academic-results-report.csv}. */
    protected abstract String exportFileName();

    /** Tiêu đề các cột. */
    protected abstract List<String> exportHeaders();

    /** Giá trị các ô của một dòng, đúng thứ tự với {@link #exportHeaders()}. */
    protected abstract List<?> exportRow(T item);

    protected ResponseEntity<byte[]> buildCsvResponse(List<T> rows) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.setContentDisposition(ContentDisposition.attachment()
                .filename(exportFileName(), StandardCharsets.UTF_8).build());
        return ResponseEntity.ok().headers(headers).body(toCsv(rows).getBytes(StandardCharsets.UTF_8));
    }

    private String toCsv(List<T> rows) {
        StringBuilder csv = new StringBuilder(BOM);
        appendLine(csv, exportHeaders());
        for (T row : rows) {
            appendLine(csv, exportRow(row));
        }
        return csv.toString();
    }

    private void appendLine(StringBuilder csv, List<?> cells) {
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                csv.append(',');
            }
            csv.append(formatCell(cells.get(i)));
        }
        csv.append(LINE_BREAK);
    }

    private String formatCell(Object value) {
        if (value == null) {
            return csvField(null);
        }
        if (value instanceof BigDecimal decimal) {
            return decimal.toPlainString();
        }
        if (value instanceof Number) {
            return value.toString();
        }
        return csvField(value.toString());
    }

    /** Bọc trong dấu ngoặc kép, escape {@code "} và vô hiệu hóa tiền tố công thức bảng tính. */
    protected static String csvField(String value) {
        String safe = value == null ? "" : value;
        String trimmed = safe.stripLeading();
        if (!trimmed.isEmpty() && FORMULA_PREFIXES.indexOf(trimmed.charAt(0)) >= 0) {
            safe = "'" + safe;
        }
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
