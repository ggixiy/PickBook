package com.pickbook.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MusicMarkerDto {
    private Long id;
    @NotNull public Integer charPosition;
    @NotBlank public String musicUrl;
    public String trackTitle;
}
