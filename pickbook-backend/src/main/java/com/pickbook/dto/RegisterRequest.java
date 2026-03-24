package com.pickbook.dto;

import com.pickbook.entity.User;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RegisterRequest {
    @Email(message = "Некоректний email")
    @NotBlank
    public String email;

    @NotBlank @Size(min = 3, max = 20, message = "Ім'я від 3 до 20 символів")
    public String username;

    @NotBlank @Size(min = 6, message = "Пароль мінімум 6 символів")
    public String password;

    public User.Role role;
}
