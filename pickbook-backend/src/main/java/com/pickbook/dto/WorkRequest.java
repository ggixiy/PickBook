package com.pickbook.dto;

import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class WorkRequest {
    @NotBlank @Size(max = 200)
    public String title;

    @NotBlank
    public String content;

    public String description;
    public String genre;
    public List<MusicMarkerDto> musicMarkers;
}
