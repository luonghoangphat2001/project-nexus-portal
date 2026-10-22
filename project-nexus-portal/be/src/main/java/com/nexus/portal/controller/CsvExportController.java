package com.nexus.portal.controller;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.List;

/**
 * Shared base controller for CSV downloads that can be opened in spreadsheet applications.
 * <p>
 * Subclasses provide the file name, column headers, and row mapping; this class handles CSV encoding,
 * escaping, the UTF-8 BOM, and HTTP headers.
 *
 * @param <T> type of exported records
 */
public abstract class CsvExportController<T> {

    private static final String BOM = "\uFEFF";
    private static final String LINE_BREAK = "\r\n";
    private static final String FORMULA_PREFIXES = "=+-@";

    /** Download file name, for example {@code academic-results-report.csv}. */
    protected abstract String exportFileName();

    /** Column headers. */
    protected abstract List<String> exportHeaders();

    /** Cell values for one row, in the same order as {@link #exportHeaders()}. */
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

    /** Quote the cell, escape {@code "}, and neutralize spreadsheet formula prefixes. */
    protected static String csvField(String value) {
        String safe = value == null ? "" : value;
        String trimmed = safe.stripLeading();
        if (!trimmed.isEmpty() && FORMULA_PREFIXES.indexOf(trimmed.charAt(0)) >= 0) {
            safe = "'" + safe;
        }
        return "\"" + safe.replace("\"", "\"\"") + "\"";
    }
}
