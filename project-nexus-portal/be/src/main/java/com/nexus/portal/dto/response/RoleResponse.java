package com.nexus.portal.dto.response;

public class RoleResponse {

    private Long id;
    private String name;
    private String description;
    private long userCount;

    public RoleResponse() {
    }

    public RoleResponse(Long id, String name, String description, long userCount) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.userCount = userCount;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public long getUserCount() {
        return userCount;
    }

    public void setUserCount(long userCount) {
        this.userCount = userCount;
    }
}
