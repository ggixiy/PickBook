package com.pickbook.repository;

import com.pickbook.entity.Work;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface WorkRepository extends JpaRepository<Work, Long> {
    // Всі твори конкретного автора
    List<Work> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    // Пошук за заголовком (ILIKE = пошук без урахування регістру)
    @Query("SELECT w FROM Work w WHERE LOWER(w.title) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Work> searchByTitle(String query, Pageable pageable);

    // Всі твори з пагінацією (для головної сторінки)
    Page<Work> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
