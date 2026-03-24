package com.pickbook.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CommentRequest {
    @NotBlank @Size(max = 1000)
    public String text;
}
