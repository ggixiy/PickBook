package com.pickbook.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RatingRequest {
    @Min(1) @Max(5)
    public Integer score;
}
