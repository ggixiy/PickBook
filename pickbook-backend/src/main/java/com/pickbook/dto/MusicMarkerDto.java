package com.pickbook.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MusicMarkerDto {
    private Long id;

    @NotNull
    public Integer charPosition;

    public Integer charPositionEnd;  // кінець виділеного фрагменту

    @NotBlank
    public String musicUrl;

    public String trackTitle;

    public Integer startTime;  // секунда початку відтворення
    public Integer endTime;    // секунда кінця відтворення
}
