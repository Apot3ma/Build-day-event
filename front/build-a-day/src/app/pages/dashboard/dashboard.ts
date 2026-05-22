import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  quickStats = [
    {
      title: 'Productos Disponibles',
      value: '128',
      icon: '🌱',
    },
    {
      title: 'Servicios Activos',
      value: '16',
      icon: '🚜',
    },
    {
      title: 'Clientes Registrados',
      value: '2,430',
      icon: '👨‍🌾',
    },
  ];

  featuredProducts = [
    {
      id: 1,
      name: 'Semillas Premium',
      image:
        'https://images.unsplash.com/photo-1500937386664-56d1dfef3854',
      description: 'Semillas de alto rendimiento para producción intensiva.',
    },
    {
      id: 2,
      name: 'Fertilizante Orgánico',
      image:
        'https://images.unsplash.com/photo-1464226184884-fa280b87c399',
      description: 'Mejora la fertilidad y salud del suelo.',
    },
  ];
}
