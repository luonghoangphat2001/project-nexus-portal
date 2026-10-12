package com.nexus.portal.config;

public enum ApiFeature {
    REPORTS("Reports & Documents", "Endpoints for defense reports and related documents"),
    DEFENSE_COUNCILS("Defense Councils", "Endpoints for managing thesis defense councils"),
    ASSESSMENTS("Reviews & Assessments", "Endpoints for thesis reviews and assessments"),
    FINAL_RESULTS("Final Results & Academic Analytics",
            "Endpoints for publishing defense results and viewing academic reports");

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
