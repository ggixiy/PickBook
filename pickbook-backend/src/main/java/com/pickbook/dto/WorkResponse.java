package com.pickbook.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WorkResponse {
    private Long id;
    private String title;
    private String content;
    private String description;
    private String genre;
    private String authorUsername;
    private Long authorId;
    private LocalDateTime createdAt;
    private Double averageRating;
    private Long ratingsCount;
    private List<MusicMarkerDto> musicMarkers;
    private List<CommentDto> comments;
}
