package com.nexus.portal.dto.request;

import com.nexus.portal.enums.CouncilMemberRole;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;
import java.util.List;

public record CouncilRequest(
        @NotBlank @Size(max = 150) String name,
        @NotNull @Positive Long departmentId,
        @NotNull @Positive Long periodId,
        @NotBlank @Size(max = 150) String room,
        @NotNull LocalDateTime startsAt,
        @NotNull LocalDateTime endsAt,
        @NotNull @Size(min = 3, max = 15) List<@NotNull @Valid Member> members) {
    public record Member(@NotNull @Positive Long lecturerId, @NotNull CouncilMemberRole role) {}
}
