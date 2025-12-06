package Maven.service;

import Maven.model.RoomEntity;
import Maven.repository.RoomRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class RoomService {
    private final RoomRepository repo;

    public RoomService(RoomRepository repo) { this.repo = repo; }

    public List<RoomEntity> findAll() { return repo.findAll(); }
    public Optional<RoomEntity> findById(Long id) { return repo.findById(id); }
    public RoomEntity save(RoomEntity r) { return repo.save(r); }
    public void delete(Long id) { repo.deleteById(id); }
    public void deleteAll() { repo.deleteAll(); }
}
