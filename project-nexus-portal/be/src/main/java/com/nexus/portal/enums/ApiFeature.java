package com.nexus.portal.enums;

public enum ApiFeature {
    REPORTS("Reports & Documents",
            "Endpoints for report submissions, document version history, and file downloads"),
    DEFENSE_COUNCILS("Council Assignments",
            "Endpoints for defense councils, lecturer roles, schedules, and team assignments"),
    ASSESSMENTS("Reviews & Grading",
            "Endpoints for review and defense assessments, draft scores, and final submissions"),
    FINAL_RESULTS("Final Results",
            "Endpoints for calculating, publishing, and viewing final defense grades"),
    ACADEMIC_REPORTS("Academic Reports & Statistics",
            "Endpoints for published academic result statistics by period, department, and topic");

    private final String tagName;
    private final String description;

    ApiFeature(String tagName, String description) {
        this.tagName = tagName;
        this.description = description;
    }

    public String getTagName() {
        return tagName;
    }

    public String getDescription() {
        return description;
    }
}
