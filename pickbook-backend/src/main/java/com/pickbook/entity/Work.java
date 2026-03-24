package com.pickbook.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "works")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Work {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    // Зберігаємо весь текст твору
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    private String description;  // Короткий опис / анотація

    @Enumerated(EnumType.STRING)
    private Genre genre;  // STORY, POEM, ESSAY

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Автор твору
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    // Музичні мітки прив'язані до позицій у тексті
    @OneToMany(mappedBy = "work", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("charPosition ASC")
    private List<MusicMarker> musicMarkers;

    // Коментарі до твору
    @OneToMany(mappedBy = "work", cascade = CascadeType.ALL)
    private List<Comment> comments;

    // Оцінки твору
    @OneToMany(mappedBy = "work", cascade = CascadeType.ALL)
    private List<Rating> ratings;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public enum Genre {
        STORY, POEM, ESSAY
    }
}
