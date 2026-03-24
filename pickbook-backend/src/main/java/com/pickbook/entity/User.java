package com.pickbook.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String password;  // Зберігається в зашифрованому вигляді (BCrypt)

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;  // AUTHOR або READER

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Всі твори цього користувача
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL)
    private List<Work> works;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }

    public enum Role {
        AUTHOR, READER
    }
}
