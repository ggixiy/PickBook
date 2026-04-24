package com.pickbook.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "music_markers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MusicMarker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Початок виділеного фрагменту (символ)
    @Column(name = "char_position", nullable = false)
    private Integer charPosition;

    // Кінець виділеного фрагменту (символ)
    @Column(name = "char_position_end")
    private Integer charPositionEnd;

    // Посилання на YouTube
    @Column(name = "music_url", nullable = false)
    private String musicUrl;

    // Назва треку
    @Column(name = "track_title")
    private String trackTitle;

    // З якої секунди відео починати (необов'язково)
    @Column(name = "start_time")
    private Integer startTime;

    // До якої секунди відео грати (необов'язково)
    @Column(name = "end_time")
    private Integer endTime;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_id", nullable = false)
    private Work work;
}
