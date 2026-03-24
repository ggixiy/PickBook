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

    // Позиція в тексті (номер символу), де починає грати музика
    // Наприклад: charPosition=1500 означає "запустити музику на 1500-му символі"
    @Column(name = "char_position", nullable = false)
    private Integer charPosition;

    // Посилання на YouTube або SoundCloud
    @Column(name = "music_url", nullable = false)
    private String musicUrl;

    // Назва треку (для відображення читачу)
    @Column(name = "track_title")
    private String trackTitle;

    // До якого твору відноситься ця мітка
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "work_id", nullable = false)
    private Work work;
}
