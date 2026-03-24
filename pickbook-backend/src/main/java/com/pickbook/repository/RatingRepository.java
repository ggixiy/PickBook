package com.pickbook.repository;

import com.pickbook.entity.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.Optional;

public interface RatingRepository extends JpaRepository<Rating, Long> {
    Optional<Rating> findByWorkIdAndUserId(Long workId, Long userId);

    // Середня оцінка твору
    @Query("SELECT AVG(r.score) FROM Rating r WHERE r.work.id = :workId")
    Double findAverageScoreByWorkId(Long workId);

    long countByWorkId(Long workId);
}
