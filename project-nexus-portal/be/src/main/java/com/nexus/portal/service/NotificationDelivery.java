package com.nexus.portal.service;

/** Polymorphic delivery contract, independent of the transport. */
public interface NotificationDelivery {
    void changed(Long userId);
}
