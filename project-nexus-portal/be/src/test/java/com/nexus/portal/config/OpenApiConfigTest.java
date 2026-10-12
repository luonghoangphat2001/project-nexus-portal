package com.nexus.portal.config;

import com.nexus.portal.controller.AcademicResultsController;
import io.swagger.v3.oas.models.Operation;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.web.method.HandlerMethod;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class OpenApiConfigTest {
    @Test
    void tagsFinalResultEndpointsWithEnglishFeatureName() throws NoSuchMethodException {
        AcademicResultsController controller = new AcademicResultsController(null);
        HandlerMethod handler = new HandlerMethod(controller,
                AcademicResultsController.class.getMethod("getMyPublishedGrades",
                        Authentication.class));
        Operation operation = new Operation();

        new OpenApiConfig().apiFeatureTagOperationCustomizer().customize(operation, handler);

        assertEquals(List.of("Final Results & Academic Analytics"), operation.getTags());
    }
}
