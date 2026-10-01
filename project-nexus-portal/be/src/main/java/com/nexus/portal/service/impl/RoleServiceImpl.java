package com.nexus.portal.service.impl;

import com.nexus.portal.dto.response.RoleResponse;
import com.nexus.portal.model.Role;
import com.nexus.portal.repository.RoleRepository;
import com.nexus.portal.repository.UserRepository;
import com.nexus.portal.service.RoleService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleServiceImpl implements RoleService {

    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    public RoleServiceImpl(RoleRepository roleRepository, UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<RoleResponse> getAllRolesWithStats() {
        List<Role> roles = roleRepository.findAll();
        return roles.stream().map(role -> {
            long count = userRepository.countByRolesContaining(role);
            return new RoleResponse(role.getId(), role.getName().name(), role.getDescription(), count);
        }).collect(Collectors.toList());
    }
}
