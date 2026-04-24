package com.questhive.questhive.controller;

import com.questhive.questhive.model.Task;
import com.questhive.questhive.model.Task.Priority;
import com.questhive.questhive.model.Task.Status;
import com.questhive.questhive.model.Task.Category;
import com.questhive.questhive.service.TaskService;
import com.questhive.questhive.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;
    private final JwtUtil jwtUtil;

    private String extractUserId(String authHeader) {
        return jwtUtil.extractUserId(authHeader.substring(7));
    }

    private LocalDateTime parseDeadline(Object raw) {
        if (raw == null) return null;
        String s = raw.toString().trim();
        if (s.isEmpty()) return null;
        try {
            return LocalDateTime.ofInstant(Instant.parse(s), ZoneOffset.UTC);
        } catch (Exception e) {
            return LocalDateTime.parse(s);
        }
    }

    private Integer parseBonusCoins(Object raw) {
        if (raw == null) return null;
        if (raw instanceof Integer) return (Integer) raw;
        if (raw instanceof Double) return ((Double) raw).intValue();
        if (raw instanceof String s && !s.isEmpty()) return Integer.parseInt(s);
        return null;
    }

    @PostMapping("/group")
    public ResponseEntity<?> createGroupTask(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, Object> body) {
        try {
            String userId = extractUserId(auth);
            return ResponseEntity.ok(taskService.createGroupTask(
                    userId,
                    (String) body.get("assignedToId"),
                    (String) body.get("groupId"),
                    (String) body.get("title"),
                    (String) body.get("description"),
                    Priority.valueOf((String) body.get("priority")),
                    Category.valueOf((String) body.get("category")),
                    parseDeadline(body.get("deadline")),
                    parseBonusCoins(body.get("bonusCoins"))
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/personal")
    public ResponseEntity<?> createPersonalTask(
            @RequestHeader("Authorization") String auth,
            @RequestBody Map<String, Object> body) {
        try {
            String userId = extractUserId(auth);
            return ResponseEntity.ok(taskService.createPersonalTask(
                    userId,
                    (String) body.get("title"),
                    (String) body.get("description"),
                    Priority.valueOf((String) body.get("priority")),
                    Category.valueOf((String) body.get("category")),
                    parseDeadline(body.get("deadline"))
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<?> updateStatus(
            @RequestHeader("Authorization") String auth,
            @PathVariable String taskId,
            @RequestBody Map<String, String> body) {
        try {
            String userId = extractUserId(auth);
            return ResponseEntity.ok(taskService.updateStatus(userId, taskId, Status.valueOf(body.get("status"))));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/{taskId}/claim")
    public ResponseEntity<?> claimTask(
            @RequestHeader("Authorization") String auth,
            @PathVariable String taskId) {
        try {
            String userId = extractUserId(auth);
            return ResponseEntity.ok(taskService.claimTask(userId, taskId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    // ← NEW: deny task
    @PostMapping("/{taskId}/deny")
    public ResponseEntity<?> denyTask(
            @RequestHeader("Authorization") String auth,
            @PathVariable String taskId) {
        try {
            String userId = extractUserId(auth);
            return ResponseEntity.ok(taskService.denyTask(userId, taskId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{taskId}")
    public ResponseEntity<?> editTask(
            @RequestHeader("Authorization") String auth,
            @PathVariable String taskId,
            @RequestBody Map<String, Object> body) {
        try {
            String userId = extractUserId(auth);
            return ResponseEntity.ok(taskService.editTask(
                    userId, taskId,
                    (String) body.get("title"),
                    (String) body.get("description"),
                    body.get("priority") != null ? Priority.valueOf((String) body.get("priority")) : null,
                    body.get("category") != null ? Category.valueOf((String) body.get("category")) : null,
                    parseDeadline(body.get("deadline")),
                    parseBonusCoins(body.get("bonusCoins"))
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<?> deleteTask(
            @RequestHeader("Authorization") String auth,
            @PathVariable String taskId) {
        try {
            String userId = extractUserId(auth);
            taskService.deleteTask(userId, taskId);
            return ResponseEntity.ok(Map.of("message", "Task deleted."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/my")
    public ResponseEntity<List<Task>> myTasks(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(taskService.getMyTasks(extractUserId(auth)));
    }

    @GetMapping("/my/personal")
    public ResponseEntity<List<Task>> myPersonalTasks(@RequestHeader("Authorization") String auth) {
        return ResponseEntity.ok(taskService.getMyPersonalTasks(extractUserId(auth)));
    }

    @GetMapping("/my/status/{status}")
    public ResponseEntity<List<Task>> myTasksByStatus(
            @RequestHeader("Authorization") String auth,
            @PathVariable String status) {
        return ResponseEntity.ok(taskService.getMyTasksByStatus(extractUserId(auth), Status.valueOf(status)));
    }

    @GetMapping("/group/{groupId}")
    public ResponseEntity<List<Task>> groupTasks(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(taskService.getTasksForGroup(groupId));
    }

    @GetMapping("/group/{groupId}/status/{status}")
    public ResponseEntity<List<Task>> groupTasksByStatus(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId,
            @PathVariable String status) {
        return ResponseEntity.ok(taskService.getGroupTasksByStatus(groupId, Status.valueOf(status)));
    }

    @GetMapping("/group/{groupId}/assigned-by-me")
    public ResponseEntity<List<Task>> tasksAssignedByMe(
            @RequestHeader("Authorization") String auth,
            @PathVariable String groupId) {
        return ResponseEntity.ok(taskService.getTasksAssignedByMe(extractUserId(auth), groupId));
    }
}