package com.nexus.portal.service;

import com.nexus.portal.dto.request.RegistrationPeriodRequest;
import com.nexus.portal.dto.response.RegistrationPeriodResponse;
import java.util.List;

public interface RegistrationPeriodService {
    List<RegistrationPeriodResponse> getAll();
    RegistrationPeriodResponse save(Long id, RegistrationPeriodRequest request);
    void delete(Long id);
}
