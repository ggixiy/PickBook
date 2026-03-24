package com.pickbook.service;

import com.pickbook.dto.*;
import com.pickbook.entity.*;
import com.pickbook.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WorkService {

    private final WorkRepository workRepository;
    private final UserRepository userRepository;
    private final MusicMarkerRepository musicMarkerRepository;
    private final CommentRepository commentRepository;
    private final RatingRepository ratingRepository;

    // Створити новий твір
    @Transactional
    public WorkResponse createWork(WorkRequest request, String authorEmail) {
        User author = userRepository.findByEmail(authorEmail)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        Work work = Work.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .description(request.getDescription())
                .genre(request.getGenre() != null ? Work.Genre.valueOf(request.getGenre()) : null)
                .author(author)
                .build();

        workRepository.save(work);

        // Зберігаємо музичні мітки якщо вони є
        if (request.getMusicMarkers() != null) {
            saveMusicMarkers(request.getMusicMarkers(), work);
        }

        return toResponse(work);
    }

    // Оновити існуючий твір
    @Transactional
    public WorkResponse updateWork(Long workId, WorkRequest request, String authorEmail) {
        Work work = workRepository.findById(workId)
                .orElseThrow(() -> new RuntimeException("Твір не знайдено"));

        // Тільки автор може редагувати свій твір
        if (!work.getAuthor().getEmail().equals(authorEmail)) {
            throw new AccessDeniedException("Ви не можете редагувати цей твір");
        }

        work.setTitle(request.getTitle());
        work.setContent(request.getContent());
        work.setDescription(request.getDescription());
        if (request.getGenre() != null) {
            work.setGenre(Work.Genre.valueOf(request.getGenre()));
        }

        // Оновлюємо музичні мітки: спочатку видаляємо старі, потім додаємо нові
        musicMarkerRepository.deleteByWorkId(workId);
        if (request.getMusicMarkers() != null) {
            saveMusicMarkers(request.getMusicMarkers(), work);
        }

        return toResponse(workRepository.save(work));
    }

    // Отримати твір за ID
    public WorkResponse getWork(Long workId) {
        Work work = workRepository.findById(workId)
                .orElseThrow(() -> new RuntimeException("Твір не знайдено"));
        return toResponse(work);
    }

    // Всі твори (для головної сторінки), з пагінацією
    public Page<WorkResponse> getAllWorks(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return workRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toResponseShort); // Короткий варіант — без повного тексту
    }

    // Твори конкретного автора
    public List<WorkResponse> getWorksByAuthor(Long authorId) {
        return workRepository.findByAuthorIdOrderByCreatedAtDesc(authorId)
                .stream().map(this::toResponseShort).collect(Collectors.toList());
    }

    // Пошук за заголовком
    public Page<WorkResponse> searchWorks(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return workRepository.searchByTitle(query, pageable)
                .map(this::toResponseShort);
    }

    // Видалити твір
    @Transactional
    public void deleteWork(Long workId, String authorEmail) {
        Work work = workRepository.findById(workId)
                .orElseThrow(() -> new RuntimeException("Твір не знайдено"));
        if (!work.getAuthor().getEmail().equals(authorEmail)) {
            throw new AccessDeniedException("Ви не можете видалити цей твір");
        }
        workRepository.delete(work);
    }

    // Додати коментар
    @Transactional
    public CommentDto addComment(Long workId, CommentRequest request, String userEmail) {
        Work work = workRepository.findById(workId)
                .orElseThrow(() -> new RuntimeException("Твір не знайдено"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        Comment comment = Comment.builder()
                .text(request.getText())
                .work(work)
                .user(user)
                .build();

        Comment saved = commentRepository.save(comment);
        return new CommentDto(saved.getId(), saved.getText(),
                user.getUsername(), saved.getCreatedAt());
    }

    // Поставити або оновити оцінку
    @Transactional
    public void rateWork(Long workId, RatingRequest request, String userEmail) {
        Work work = workRepository.findById(workId)
                .orElseThrow(() -> new RuntimeException("Твір не знайдено"));
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

        // Якщо вже оцінював — оновлюємо, якщо ні — створюємо
        Rating rating = ratingRepository.findByWorkIdAndUserId(workId, user.getId())
                .orElse(Rating.builder().work(work).user(user).build());
        rating.setScore(request.getScore());
        ratingRepository.save(rating);
    }

    // --- Допоміжні методи ---

    private void saveMusicMarkers(List<MusicMarkerDto> dtos, Work work) {
        List<MusicMarker> markers = dtos.stream().map(dto ->
                MusicMarker.builder()
                        .charPosition(dto.getCharPosition())
                        .musicUrl(dto.getMusicUrl())
                        .trackTitle(dto.getTrackTitle())
                        .work(work)
                        .build()
        ).collect(Collectors.toList());
        musicMarkerRepository.saveAll(markers);
    }

    // Повний варіант відповіді (з текстом, коментарями, мітками)
    private WorkResponse toResponse(Work work) {
        List<MusicMarkerDto> markers = musicMarkerRepository
                .findByWorkIdOrderByCharPositionAsc(work.getId())
                .stream().map(m -> new MusicMarkerDto(
                        m.getId(), m.getCharPosition(), m.getMusicUrl(), m.getTrackTitle()))
                .collect(Collectors.toList());

        List<CommentDto> comments = commentRepository
                .findByWorkIdOrderByCreatedAtDesc(work.getId())
                .stream().map(c -> new CommentDto(
                        c.getId(), c.getText(), c.getUser().getUsername(), c.getCreatedAt()))
                .collect(Collectors.toList());

        Double avg = ratingRepository.findAverageScoreByWorkId(work.getId());
        long count = ratingRepository.countByWorkId(work.getId());

        return WorkResponse.builder()
                .id(work.getId())
                .title(work.getTitle())
                .content(work.getContent())
                .description(work.getDescription())
                .genre(work.getGenre() != null ? work.getGenre().name() : null)
                .authorUsername(work.getAuthor().getUsername())
                .authorId(work.getAuthor().getId())
                .createdAt(work.getCreatedAt())
                .averageRating(avg)
                .ratingsCount(count)
                .musicMarkers(markers)
                .comments(comments)
                .build();
    }

    // Короткий варіант (без повного тексту та коментарів — для списків)
    private WorkResponse toResponseShort(Work work) {
        Double avg = ratingRepository.findAverageScoreByWorkId(work.getId());
        long count = ratingRepository.countByWorkId(work.getId());
        String preview = work.getContent().length() > 200
                ? work.getContent().substring(0, 200) + "..."
                : work.getContent();

        return WorkResponse.builder()
                .id(work.getId())
                .title(work.getTitle())
                .content(preview)
                .description(work.getDescription())
                .genre(work.getGenre() != null ? work.getGenre().name() : null)
                .authorUsername(work.getAuthor().getUsername())
                .authorId(work.getAuthor().getId())
                .createdAt(work.getCreatedAt())
                .averageRating(avg)
                .ratingsCount(count)
                .build();
    }
}
