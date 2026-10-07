package com.nexus.portal.exception;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.StringJoiner;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleUploadTooLarge(Exception ex, HttpServletRequest request) {
        return error(HttpStatus.PAYLOAD_TOO_LARGE, "Payload Too Large",
                "Tệp tải lên vượt quá dung lượng tối đa cho phép", request);
    }

    @ExceptionHandler({org.springframework.http.converter.HttpMessageNotReadableException.class,
            org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ErrorResponse> handleInvalidPayload(Exception ex, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "Bad Request",
                "Dữ liệu yêu cầu không đúng định dạng", request);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex, HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, "Resource Not Found",
                "Không tìm thấy dữ liệu: " + ex.getMessage(), request);
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(
            NoResourceFoundException ex, HttpServletRequest request) {
        return error(HttpStatus.NOT_FOUND, "Not Found",
                "Không tìm thấy đường dẫn API hoặc tài nguyên: " + request.getRequestURI(), request);
    }

    @ExceptionHandler(NoSuchElementException.class)
    public ResponseEntity<ErrorResponse> handleNoSuchElement(
            NoSuchElementException ex, HttpServletRequest request) {
        String detail = ex.getMessage() != null ? ex.getMessage() : "Tài nguyên không tồn tại";
        return error(HttpStatus.NOT_FOUND, "Not Found",
                "Không tìm thấy bản ghi: " + detail, request);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException ex, HttpServletRequest request) {
        return error(HttpStatus.FORBIDDEN, "Forbidden",
                "Tài khoản của bạn không đủ quyền để thực hiện thao tác này", request);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }
        return validationError(HttpStatus.UNPROCESSABLE_ENTITY, "Unprocessable Entity",
                "Dữ liệu gửi lên không hợp lệ: ", errors, request);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex, HttpServletRequest request) {
        Map<String, String> errors = new LinkedHashMap<>();
        for (ConstraintViolation<?> violation : ex.getConstraintViolations()) {
            String property = violation.getPropertyPath() != null
                    ? violation.getPropertyPath().toString() : "tham số";
            errors.put(property, violation.getMessage());
        }
        return validationError(HttpStatus.UNPROCESSABLE_ENTITY, "Unprocessable Entity",
                "Tham số không hợp lệ: ", errors, request);
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<ErrorResponse> handleMissingParam(
            MissingServletRequestParameterException ex, HttpServletRequest request) {
        String message = String.format("Thiếu tham số bắt buộc '%s' (kiểu %s)",
                ex.getParameterName(), ex.getParameterType());
        return error(HttpStatus.UNPROCESSABLE_ENTITY, "Missing Required Parameter", message, request);
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<ErrorResponse> handleBadRequest(
            BadRequestException ex, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "Bad Request",
                "Yêu cầu không hợp lệ: " + ex.getMessage(), request);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException ex, HttpServletRequest request) {
        return error(HttpStatus.BAD_REQUEST, "Bad Request",
                "Tham số không hợp lệ: " + ex.getMessage(), request);
    }

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(
            AppException ex, HttpServletRequest request) {
        HttpStatus status = ex.getStatus();
        return error(status, status.getReasonPhrase(), ex.getMessage(), request);
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(
            BadCredentialsException ex, HttpServletRequest request) {
        return error(HttpStatus.UNAUTHORIZED, "Unauthorized",
                "Xác thực thất bại: tên đăng nhập hoặc mật khẩu không đúng", request);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGlobalException(
            Exception ex, HttpServletRequest request) {
        log.error("Lỗi hệ thống không được xử lý tại {}: {}",
                request.getRequestURI(), ex.getMessage(), ex);
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
                "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau", request);
    }

    private ResponseEntity<ErrorResponse> validationError(
            HttpStatus status, String error, String prefix,
            Map<String, String> validationErrors, HttpServletRequest request) {
        StringJoiner details = new StringJoiner(", ");
        validationErrors.forEach((field, message) ->
                details.add(String.format("[%s: %s]", field, message)));
        return error(status, error, prefix + details, request, validationErrors);
    }

    private ResponseEntity<ErrorResponse> error(
            HttpStatus status, String error, String message, HttpServletRequest request) {
        return error(status, error, message, request, null);
    }

    private ResponseEntity<ErrorResponse> error(
            HttpStatus status, String error, String message,
            HttpServletRequest request, Map<String, String> validationErrors) {
        ErrorResponse body = ErrorResponse.builder()
                .success(false)
                .status(status.value())
                .error(error)
                .message(message)
                .path(request.getRequestURI())
                .validationErrors(validationErrors)
                .timestamp(LocalDateTime.now())
                .build();
        return ResponseEntity.status(status).body(body);
    }
}
