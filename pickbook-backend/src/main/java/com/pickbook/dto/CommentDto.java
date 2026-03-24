package com.pickbook.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CommentDto {
    private Long id;
    private String text;
    private String username;
    private LocalDateTime createdAt;
}
