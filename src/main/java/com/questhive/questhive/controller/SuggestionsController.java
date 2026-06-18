package com.questhive.questhive.controller;

import com.questhive.questhive.model.Task;
import com.questhive.questhive.repository.TaskRepository;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/suggestions")
@RequiredArgsConstructor
public class SuggestionsController {

    private final TaskRepository taskRepository;
    private final JwtUtil jwtUtil;

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Map<String, Object>>> getSuggestions(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {

        List<Task> completed = taskRepository.findByGroupIdAndStatus(groupId, Task.Status.COMPLETED);
        List<Task> pending   = taskRepository.findByGroupIdAndStatus(groupId, Task.Status.PENDING);

        Map<Task.Category, Long> catFreq = completed.stream()
                .filter(t -> t.getCategory() != null)
                .collect(Collectors.groupingBy(Task::getCategory, Collectors.counting()));

        List<Task.Category> topCats = catFreq.entrySet().stream()
                .sorted(Map.Entry.<Task.Category, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        Map<Task.Category, List<String>> templates = new EnumMap<>(Task.Category.class);
        templates.put(Task.Category.WORK,      List.of("Weekly team sync", "Code review session", "Update project docs", "Sprint planning", "Retrospective meeting"));
        templates.put(Task.Category.HOME,      List.of("Deep clean kitchen", "Organize storage", "Fix broken items", "Grocery run", "Meal prep for week"));
        templates.put(Task.Category.SCHOOL,    List.of("Study session", "Assignment review", "Group project meeting", "Exam prep", "Research notes"));
        templates.put(Task.Category.PERSONAL,  List.of("Morning workout", "Meditation session", "Read 30 minutes", "Journal entry", "Skill practice"));
        templates.put(Task.Category.GROCERIES, List.of("Weekly grocery run", "Stock up essentials", "Fresh produce pickup", "Pharmacy run", "Bulk shopping"));
        templates.put(Task.Category.OTHER,     List.of("Team bonding activity", "Monthly review", "Plan next sprint", "Feedback session", "Knowledge sharing"));

        Set<String> pendingTitles = pending.stream()
                .map(t -> t.getTitle().toLowerCase())
                .collect(Collectors.toSet());

        List<Map<String, Object>> suggestions = new ArrayList<>();

        for (Task.Category cat : topCats) {
            List<String> pool = templates.getOrDefault(cat, List.of());
            pool.stream()
                .filter(t -> !pendingTitles.contains(t.toLowerCase()))
                .limit(2)
                .forEach(title -> {
                    Map<String, Object> s = new LinkedHashMap<>();
                    s.put("title",    title);
                    s.put("category", cat.name());
                    s.put("priority", "MEDIUM");
                    s.put("reason",   "Based on your group's frequent " + cat.name().toLowerCase() + " tasks");
                    suggestions.add(s);
                });
        }

        if (suggestions.size() < 3) {
            List.<Map<String,Object>>of(
                Map.of("title","Weekly check-in",  "category","WORK",  "priority","LOW",    "reason","Good habit for any team"),
                Map.of("title","Team goal review",  "category","OTHER", "priority","MEDIUM", "reason","Keep everyone aligned"),
                Map.of("title","Celebrate wins",    "category","OTHER", "priority","LOW",    "reason","Boost team morale")
            ).forEach(s -> { if (suggestions.size() < 6) suggestions.add(new LinkedHashMap<>(s)); });
        }

        return ResponseEntity.ok(suggestions);
    }
}
