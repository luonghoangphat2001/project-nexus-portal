package com.nexus.portal;

import com.nexus.portal.security.UserPrincipal;
import com.nexus.portal.security.JwtTokenProvider;
import com.nexus.portal.security.CustomUserDetailsService;
import com.nexus.portal.service.impl.SseNotificationDelivery;
import jakarta.servlet.DispatcherType;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import java.util.List;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = "debug=false")
@AutoConfigureMockMvc
@ActiveProfiles("test")
class NotificationStreamSecurityTest {
    @Autowired MockMvc mvc;
    @MockBean SseNotificationDelivery delivery;
    @MockBean JwtTokenProvider tokens;
    @MockBean CustomUserDetailsService users;

    @Test void completedStreamRedispatchDoesNotRequireLostThreadAuthentication() throws Exception {
        SseEmitter emitter = new SseEmitter(1000L);
        when(delivery.subscribe(1L)).thenReturn(emitter);
        UserPrincipal actor = new UserPrincipal(1L, "student", "student@example.com", "", "Student", true, List.of());
        when(tokens.validateToken("test-token")).thenReturn(true);
        when(tokens.getUsernameFromToken("test-token")).thenReturn("student");
        when(users.loadUserByUsername("student")).thenReturn(actor);
        var result = mvc.perform(get("/api/notifications/stream").header("Authorization", "Bearer test-token"))
                .andExpect(request().asyncStarted()).andReturn();
        emitter.complete();
        mvc.perform(asyncDispatch(result)).andExpect(status().isOk());
    }

    @Test void initialStreamStillRequiresAuthentication() throws Exception {
        mvc.perform(get("/api/notifications/stream")).andExpect(status().isUnauthorized());
        verifyNoInteractions(delivery);
    }

    @Test void otherAsyncRequestsStillRequireAuthentication() throws Exception {
        mvc.perform(get("/api/notifications").with(request -> {
            request.setDispatcherType(DispatcherType.ASYNC);
            return request;
        })).andExpect(status().isUnauthorized());
    }
}
