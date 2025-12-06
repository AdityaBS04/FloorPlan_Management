package Maven.controller;

import Maven.model.RoomEntity;
import Maven.service.RoomService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@CrossOrigin(origins = "*")
public class RoomController {

    private final RoomService service;
    public RoomController(RoomService service) { this.service = service; }

    @GetMapping
    public List<RoomEntity> all() { return service.findAll(); }

    @GetMapping("/{id}")
    public ResponseEntity<RoomEntity> get(@PathVariable Long id) {
        return service.findById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public RoomEntity create(@RequestBody RoomEntity room) {
        // id ignored if present; JPA will create
        return service.save(room);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RoomEntity> update(@PathVariable Long id, @RequestBody RoomEntity updated) {
        return service.findById(id).map(r -> {
            r.setX(updated.getX()); r.setY(updated.getY());
            r.setW(updated.getW()); r.setH(updated.getH());
            r.setLabel(updated.getLabel());
            r.setColor(updated.getColor()); 
            return ResponseEntity.ok(service.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAll() {
        service.deleteAll();
        return ResponseEntity.noContent().build();
    }
}
