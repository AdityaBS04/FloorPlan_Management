package Maven.config;

import org.springframework.boot.web.servlet.ServletRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import jakarta.servlet.Servlet;

@Configuration
public class H2ConsoleConfig {

    @Bean
    public ServletRegistrationBean<Servlet> h2ServletRegistration() {
        ServletRegistrationBean<Servlet> registration = null;
        try {
            // Use JakartaWebServlet which is compatible with jakarta.servlet
            Class<?> servletClass = Class.forName("org.h2.server.web.JakartaWebServlet");
            Servlet servlet = (Servlet) servletClass.getDeclaredConstructor().newInstance();
            registration = new ServletRegistrationBean<>(servlet);
            registration.addUrlMappings("/h2-console/*");
        } catch (Exception e) {
            throw new RuntimeException("Failed to configure H2 Console", e);
        }
        return registration;
    }
}
