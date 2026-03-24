package com.pickbook.controller;

import com.pickbook.dto.*;
import com.pickbook.service.WorkService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/works")
@RequiredArgsConstructor
public class WorkController {

    private final WorkService workService;

    // GET /api/works?page=0&size=10 — список всіх творів
    @GetMapping
    public ResponseEntity<Page<WorkResponse>> getAllWorks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(workService.getAllWorks(page, size));
    }

    // GET /api/works/search?query=весна — пошук
    @GetMapping("/search")
    public ResponseEntity<Page<WorkResponse>> searchWorks(
            @RequestParam String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(workService.searchWorks(query, page, size));
    }

    // GET /api/works/{id} — один твір з усіма даними
    @GetMapping("/{id}")
    public ResponseEntity<WorkResponse> getWork(@PathVariable Long id) {
        return ResponseEntity.ok(workService.getWork(id));
    }

    // GET /api/works/author/{authorId} — твори автора
    @GetMapping("/author/{authorId}")
    public ResponseEntity<List<WorkResponse>> getWorksByAuthor(@PathVariable Long authorId) {
        return ResponseEntity.ok(workService.getWorksByAuthor(authorId));
    }

    // POST /api/works — створити твір (тільки авторизованим)
    @PostMapping
    public ResponseEntity<WorkResponse> createWork(
            @Valid @RequestBody WorkRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        WorkResponse work = workService.createWork(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(work);
    }

    // PUT /api/works/{id} — оновити твір
    @PutMapping("/{id}")
    public ResponseEntity<WorkResponse> updateWork(
            @PathVariable Long id,
            @Valid @RequestBody WorkRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(workService.updateWork(id, request, userDetails.getUsername()));
    }

    // DELETE /api/works/{id} — видалити твір
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWork(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        workService.deleteWork(id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }

    // POST /api/works/{id}/comments — додати коментар
    @PostMapping("/{id}/comments")
    public ResponseEntity<CommentDto> addComment(
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(workService.addComment(id, request, userDetails.getUsername()));
    }

    // POST /api/works/{id}/ratings — поставити оцінку
    @PostMapping("/{id}/ratings")
    public ResponseEntity<Void> rateWork(
            @PathVariable Long id,
            @Valid @RequestBody RatingRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        workService.rateWork(id, request, userDetails.getUsername());
        return ResponseEntity.ok().build();
    }
}
