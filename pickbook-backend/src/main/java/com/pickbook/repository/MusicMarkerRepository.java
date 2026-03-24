package com.pickbook.repository;

import com.pickbook.entity.MusicMarker;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MusicMarkerRepository extends JpaRepository<MusicMarker, Long> {
    List<MusicMarker> findByWorkIdOrderByCharPositionAsc(Long workId);
    void deleteByWorkId(Long workId);
}
