package Maven.model;

import jakarta.persistence.*;

@Entity
@Table(name = "rooms")
public class RoomEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private double x;
    private double y;
    private double w;
    private double h;
    private String color;

    private String label;

    // Constructors
    public RoomEntity() {}

    public RoomEntity(double x, double y, double w, double h, String label) {
        this.x = x; this.y = y; this.w = w; this.h = h; this.label = label;
    }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    // getters / setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getX() { return x; }
    public void setX(double x) { this.x = x; }

    public double getY() { return y; }
    public void setY(double y) { this.y = y; }

    public double getW() { return w; }
    public void setW(double w) { this.w = w; }

    public double getH() { return h; }
    public void setH(double h) { this.h = h; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }


}
