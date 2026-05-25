import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  isRegister = false;

  telefono = '';
  usuario = '';
  password = '';
  confirmPassword = '';

  constructor(
    private router: Router,
    private servicio: MockDataService,
  ) {}

  ingresar() {
    if (this.telefono && this.password) {
      const ingreso = {
        num_de_celular: this.telefono,
        contrasena: this.password,
      };
      this.servicio.login(ingreso).subscribe({
        error(err) {
          console.error(err);
        },
      });

      sessionStorage.setItem('numtelefono', this.telefono);

      this.router.navigate(['/app']);
    }
  }

  registrarse() {
    if (
      this.telefono &&
      this.usuario &&
      this.password &&
      this.confirmPassword &&
      this.password === this.confirmPassword
    ) {
      this.isRegister = false;

      const registro = {
        num_de_celular: this.telefono,
        usuario: this.usuario,
        contrasena: this.password,
      };

      this.servicio.register(registro).subscribe({
        error(err) {
          console.error(err);
        },
      });

      sessionStorage.setItem('numtelefono', this.telefono);

      this.telefono = '';
      this.usuario = '';
      this.password = '';
      this.confirmPassword = '';
    }

    this.router.navigate(['/app']);
  }

  cambiarFormulario() {
    this.isRegister = !this.isRegister;

    this.telefono = '';
    this.usuario = '';
    this.password = '';
    this.confirmPassword = '';
  }
}
