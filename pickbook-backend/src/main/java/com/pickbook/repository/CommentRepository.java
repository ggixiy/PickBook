package com.pickbook.repository;

import com.pickbook.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByWorkIdOrderByCreatedAtDesc(Long workId);
}
