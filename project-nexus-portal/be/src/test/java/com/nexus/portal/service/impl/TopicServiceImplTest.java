package com.nexus.portal.service.impl;

import com.nexus.portal.dto.request.TopicCreateRequest;
import com.nexus.portal.dto.response.TopicResponse;
import com.nexus.portal.enums.AdvisorRole;
import com.nexus.portal.enums.PeriodStatus;
import com.nexus.portal.enums.TopicType;
import com.nexus.portal.exception.BadRequestException;
import com.nexus.portal.model.*;
import com.nexus.portal.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TopicServiceImplTest {

    private TopicRepository topicRepository;
    private TopicLecturerRepository topicLecturerRepository;
    private DepartmentRepository departmentRepository;
    private MajorRepository majorRepository;
    private RegistrationPeriodRepository registrationPeriodRepository;
    private UserRepository userRepository;
    private TopicRegistrationRepository topicRegistrationRepository;
    private TeamMemberRepository teamMemberRepository;

    private TopicServiceImpl topicService;

    @BeforeEach
    void setUp() {
        topicRepository = mock(TopicRepository.class);
        topicLecturerRepository = mock(TopicLecturerRepository.class);
        departmentRepository = mock(DepartmentRepository.class);
        majorRepository = mock(MajorRepository.class);
        registrationPeriodRepository = mock(RegistrationPeriodRepository.class);
        userRepository = mock(UserRepository.class);
        topicRegistrationRepository = mock(TopicRegistrationRepository.class);
        teamMemberRepository = mock(TeamMemberRepository.class);

        topicService = new TopicServiceImpl(
                topicRepository,
                topicLecturerRepository,
                departmentRepository,
                majorRepository,
                registrationPeriodRepository,
                userRepository,
                topicRegistrationRepository,
                teamMemberRepository
        );
    }

    private TopicCreateRequest createRequest(Long deptId, Long periodId) {
        TopicCreateRequest req = new TopicCreateRequest();
        req.setTitle("AI Scanner");
        req.setDescription("Description");
        req.setObjectives("Objectives");
        req.setRequirements("Requirements");
        req.setDepartmentId(deptId);
        req.setPeriodId(periodId);
        req.setType(TopicType.CAPSTONE_PROJECT);
        req.setMaxStudents(3);
        req.setDuration("15 weeks");
        return req;
    }

    @Test
    void rejectsCreateTopicWhenPeriodIsNotOpen() {
        Long lecturerId = 10L;
        User lecturer = new User();
        lecturer.setId(lecturerId);
        when(userRepository.findById(lecturerId)).thenReturn(Optional.of(lecturer));

        Department dept = new Department();
        dept.setId(1L);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(dept));

        RegistrationPeriod closedPeriod = new RegistrationPeriod();
        closedPeriod.setId(2L);
        closedPeriod.setStatus(PeriodStatus.CLOSED);
        when(registrationPeriodRepository.findById(2L)).thenReturn(Optional.of(closedPeriod));

        TopicCreateRequest request = createRequest(1L, 2L);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                topicService.createTopic(request, lecturerId));
        assertTrue(ex.getMessage().contains("Registration period is not open"));
        verify(topicRepository, never()).save(any());
    }

    @Test
    void rejectsCreateTopicWhenDepartmentOutsideTargetFaculties() {
        Long lecturerId = 10L;
        User lecturer = new User();
        lecturer.setId(lecturerId);
        when(userRepository.findById(lecturerId)).thenReturn(Optional.of(lecturer));

        Faculty facultyA = new Faculty();
        facultyA.setId(100L);
        Department dept = new Department();
        dept.setId(1L);
        dept.setFaculty(facultyA);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(dept));

        Faculty facultyB = new Faculty();
        facultyB.setId(200L);
        RegistrationPeriod openPeriod = new RegistrationPeriod();
        openPeriod.setId(2L);
        openPeriod.setStatus(PeriodStatus.OPEN);
        openPeriod.setTargetFaculties(Set.of(facultyB));
        when(registrationPeriodRepository.findById(2L)).thenReturn(Optional.of(openPeriod));

        TopicCreateRequest request = createRequest(1L, 2L);

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                topicService.createTopic(request, lecturerId));
        assertTrue(ex.getMessage().contains("department does not belong to a faculty targeted"));
        verify(topicRepository, never()).save(any());
    }

    @Test
    void allowsCreateTopicWhenPeriodIsOpenAndTargetFacultyMatches() {
        Long lecturerId = 10L;
        User lecturer = new User();
        lecturer.setId(lecturerId);
        lecturer.setFullName("Dr. Advisor");
        when(userRepository.findById(lecturerId)).thenReturn(Optional.of(lecturer));

        Faculty facultyA = new Faculty();
        facultyA.setId(100L);
        Department dept = new Department();
        dept.setId(1L);
        dept.setCode("IT");
        dept.setName("Information Technology");
        dept.setFaculty(facultyA);
        when(departmentRepository.findById(1L)).thenReturn(Optional.of(dept));

        RegistrationPeriod openPeriod = new RegistrationPeriod();
        openPeriod.setId(2L);
        openPeriod.setStatus(PeriodStatus.OPEN);
        openPeriod.setName("Term 1");
        openPeriod.setTargetFaculties(Set.of(facultyA));
        when(registrationPeriodRepository.findById(2L)).thenReturn(Optional.of(openPeriod));

        when(topicRepository.save(any(Topic.class))).thenAnswer(invocation -> {
            Topic t = invocation.getArgument(0);
            t.setId(55L);
            return t;
        });
        when(topicLecturerRepository.save(any(TopicLecturer.class))).thenAnswer(invocation -> invocation.getArgument(0));

        TopicCreateRequest request = createRequest(1L, 2L);

        TopicResponse response = topicService.createTopic(request, lecturerId);
        assertNotNull(response);
        assertEquals(55L, response.getId());
        assertEquals("AI Scanner", response.getTitle());
        verify(topicRepository, times(1)).save(any(Topic.class));
    }
}
