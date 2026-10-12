package com.nexus.portal.controller;

import com.nexus.portal.security.UserPrincipal;
import com.nexus.portal.service.impl.SseNotificationDelivery;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/notifications")
public class NotificationStreamController {
    public static final String AUTHORIZED_STREAM_ATTRIBUTE = NotificationStreamController.class.getName() + ".authorized";
    private final SseNotificationDelivery delivery;
    public NotificationStreamController(SseNotificationDelivery delivery) { this.delivery = delivery; }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribe(@AuthenticationPrincipal UserPrincipal actor, HttpServletRequest request) {
        // Internal marker: only set after the initial request passed JWT authorization.
        request.setAttribute(AUTHORIZED_STREAM_ATTRIBUTE, Boolean.TRUE);
        return delivery.subscribe(actor.getId());
    }
}
