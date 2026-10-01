package com.nexus.portal.repository;

import com.nexus.portal.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    Optional<User> findByUsernameOrEmail(String username, String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);

    @Query("SELECT DISTINCT u FROM User u " +
           "JOIN u.roles r " +
           "WHERE r.name = com.nexus.portal.enums.RoleName.ROLE_TEACHER")
    List<User> findAllLecturers();

    @Query("SELECT DISTINCT u FROM User u " +
           "JOIN u.roles r " +
           "LEFT JOIN u.faculties f " +
           "LEFT JOIN u.departments d " +
           "WHERE r.name = com.nexus.portal.enums.RoleName.ROLE_TEACHER AND (f.id IN :facultyIds OR d.id IN :deptIds)")
    List<User> findLecturersByFacultiesOrDepartments(
            @Param("facultyIds") Collection<Long> facultyIds,
            @Param("deptIds") Collection<Long> deptIds
    );

    @Query("SELECT DISTINCT u FROM User u " +
           "JOIN u.roles r " +
           "JOIN u.departments d " +
           "WHERE r.name = com.nexus.portal.enums.RoleName.ROLE_TEACHER AND d.id IN :deptIds")
    List<User> findLecturersByDepartmentIds(@Param("deptIds") Collection<Long> deptIds);

    @Query("SELECT DISTINCT u FROM User u " +
           "JOIN u.roles r " +
           "JOIN u.faculties f " +
           "WHERE r.name = com.nexus.portal.enums.RoleName.ROLE_TEACHER AND f.id IN :facultyIds")
    List<User> findLecturersByFacultyIds(@Param("facultyIds") Collection<Long> facultyIds);

    @Query("SELECT DISTINCT tl.lecturer FROM TopicLecturer tl " +
           "WHERE tl.topic.id IN (" +
           "  SELECT tl2.topic.id FROM TopicLecturer tl2 WHERE tl2.lecturer.id = :lecturerId" +
           ")")
    List<User> findAssociatedLecturers(@Param("lecturerId") Long lecturerId);

    long countByActiveTrue();

    long countByRolesContaining(com.nexus.portal.model.Role role);
}
