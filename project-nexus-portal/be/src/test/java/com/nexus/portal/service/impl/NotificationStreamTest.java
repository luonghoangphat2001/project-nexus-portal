package com.nexus.portal.service.impl;

import com.nexus.portal.controller.NotificationStreamController;
import com.nexus.portal.security.UserPrincipal;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.core.MethodParameter;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.web.bind.support.WebDataBinderFactory;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

class NotificationStreamTest {
    @Test void broadcastsChangesButReadEventsOnlyReachTheSameUser() throws Exception {
        SseNotificationDelivery delivery = new SseNotificationDelivery();
        MvcResult first = connect(delivery, 1L);
        MvcResult second = connect(delivery, 2L);
        assertTrue(first.getRequest().isAsyncStarted());
        assertTrue(first.getResponse().getContentAsString().contains("event:ready"));
        delivery.changed(1L);
        assertTrue(first.getResponse().getContentAsString().contains("event:changed"));
        assertFalse(second.getResponse().getContentAsString().contains("event:changed"));
        delivery.changed(null);
        assertTrue(second.getResponse().getContentAsString().contains("event:changed"));
        assertFalse(second.getResponse().getContentAsString().contains("title"));
        first.getRequest().getAsyncContext().complete();
        second.getRequest().getAsyncContext().complete();
    }

    private MvcResult connect(SseNotificationDelivery delivery, Long id) throws Exception {
        MockMvc mvc = MockMvcBuilders.standaloneSetup(new NotificationStreamController(delivery))
            .setCustomArgumentResolvers(new HandlerMethodArgumentResolver() {
                public boolean supportsParameter(MethodParameter parameter) {
                    return parameter.getParameterType() == UserPrincipal.class;
                }
                public Object resolveArgument(MethodParameter p, ModelAndViewContainer m,
                        NativeWebRequest r, WebDataBinderFactory b) {
                    return new UserPrincipal(id, "user", "user@example.com", "", "User", true, List.of());
                }
            }).build();
        return mvc.perform(get("/notifications/stream")).andReturn();
    }
}
