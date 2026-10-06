package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.RegistrationPeriodRequest;
import com.nexus.portal.dto.response.RegistrationPeriodResponse;
import com.nexus.portal.exception.*;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import com.nexus.portal.service.RegistrationPeriodService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class RegistrationPeriodServiceImpl implements RegistrationPeriodService {
    private final RegistrationPeriodRepository periods;
    private final FacultyRepository faculties;
    private final CohortRepository cohorts;
    private final TeamRepository teams;
    private final TopicRepository topics;

    public RegistrationPeriodServiceImpl(RegistrationPeriodRepository periods, FacultyRepository faculties,
            CohortRepository cohorts, TeamRepository teams, TopicRepository topics) {
        this.periods = periods;
        this.faculties = faculties;
        this.cohorts = cohorts;
        this.teams = teams;
        this.topics = topics;
    }

    @Transactional(readOnly = true)
    public List<RegistrationPeriodResponse> getAll() {
        return periods.findAll().stream().map(this::response).toList();
    }

    public RegistrationPeriodResponse save(Long id, RegistrationPeriodRequest request) {
        if (!request.startDate().isBefore(request.endDate()) || request.submissionDeadline().isBefore(request.endDate())) {
            throw new BadRequestException("Start date must precede end date; submission deadline must be on or after end date");
        }
        String[] years = request.academicYear().split("-");
        if (Integer.parseInt(years[1]) != Integer.parseInt(years[0]) + 1) {
            throw new BadRequestException("Academic year must contain consecutive years, for example 2026-2027");
        }
        Set<Faculty> targetFaculties = new HashSet<>(faculties.findAllById(request.facultyIds()));
        Set<Cohort> targetCohorts = new HashSet<>(cohorts.findAllById(request.cohortIds()));
        if (targetFaculties.size() != request.facultyIds().size() || targetCohorts.size() != request.cohortIds().size()) {
            throw new BadRequestException("One or more selected faculties or cohorts do not exist");
        }
        RegistrationPeriod period = id == null ? new RegistrationPeriod() : find(id);
        if (id != null && teams.findByPeriodId(id).stream().anyMatch(team ->
                !request.facultyIds().contains(team.getFaculty().getId()) || !request.cohortIds().contains(team.getCohort().getId()))) {
            throw new BadRequestException("Selected faculties and cohorts must include existing teams");
        }
        period.setName(request.name().trim());
        period.setAcademicYear(request.academicYear());
        period.setSemester(request.semester());
        period.setStartDate(request.startDate());
        period.setEndDate(request.endDate());
        period.setSubmissionDeadline(request.submissionDeadline());
        period.setStatus(request.status());
        period.setTargetFaculties(targetFaculties);
        period.setTargetCohorts(targetCohorts);
        return response(periods.save(period));
    }

    public void delete(Long id) {
        RegistrationPeriod period = find(id);
        if (!teams.findByPeriodId(id).isEmpty() || topics.existsByPeriodId(id)) {
            throw new BadRequestException("Cannot delete a period that contains teams or topics");
        }
        periods.delete(period);
    }

    private RegistrationPeriod find(Long id) {
        return periods.findById(id).orElseThrow(() -> new ResourceNotFoundException("Registration period not found"));
    }

    private RegistrationPeriodResponse response(RegistrationPeriod period) {
        return new RegistrationPeriodResponse(period.getId(), period.getName(), period.getAcademicYear(), period.getSemester(),
                period.getStartDate(), period.getEndDate(), period.getSubmissionDeadline(), period.getStatus(),
                period.getTargetFaculties().stream().map(Faculty::getId).collect(Collectors.toSet()),
                period.getTargetCohorts().stream().map(Cohort::getId).collect(Collectors.toSet()));
    }
}
