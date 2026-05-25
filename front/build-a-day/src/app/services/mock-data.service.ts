import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class MockDataService {
  private myAppUrl: string; //Ruta base
  private myApiUrl: string; //El resto de la ruta

  constructor(private http: HttpClient) {
    this.myAppUrl = 'http://192.168.0.179:3000';
    this.myApiUrl = '/api/';
  }
  productos = [
    {
      id: '1',
      nombre: 'Semillas de Maiz Hibrido',
      descripcion:
        'Semillas de alto rendimiento con resistencia a plagas comunes, ideal para climas variados.',
      imagen: 'planta1.jpeg',
      precio: '$120.00/saco',
      caracteristicas: ['Alto rendimiento', 'Resistencia climática'],
    },
    {
      id: '2',
      nombre: 'Fertilizante Orgánico',
      descripcion:
        'Compuesto natural que mejora la estructura del suelo y aporta nutrientes esenciales para tus cultivos.',
      imagen: 'planta2.jpeg',
      precio: '$45.00/bulto',
      caracteristicas: ['Rico en nitrogeno', '100% natural', 'Mejora Retencion de Agua'],
    },
    {
      id: '3',
      nombre: 'Tractor Agrícola 100HP',
      descripcion:
        'Maquinaria potente y eficiente para todo tipo de labores en el campo. Excelente rendimiento de combustible.',
      imagen: 'tractor.jpeg',
      precio: 'Consultar Precio',
      caracteristicas: ['Alto rendimiento', 'Resistencia climática'],
    },
  ];

  servicios = [
    {
      id: '1',
      nombre: 'Financiamiento agrigola',
      descripcion:
        'Financiamiento a largo plazo diseñado para la adquisición de maquinaria, equipo y construcción de instalaciones.',
      imagen: 'pipol.jpeg',
      beneficios: ['Plazos hasta 5 años', 'Tasas competitivas', 'Asesoría financiera gratuita'],
    },
    {
      id: '2',
      nombre: 'Capital de Trabajo',
      descripcion:
        'Liquidez inmediata para la compra de insumos, pago de nómina y gastos operativos del ciclo agrícola.',
      imagen: 'campo.jpeg',
      beneficios: ['Aprobación rápida', 'Adaptable a tu ciclo productivo', 'Renovación sencilla'],
    },
    {
      id: '3',
      nombre: 'Crédito de Habilitación de Avío',
      descripcion:
        'Apoyo financiero específico para los gastos directos de explotación y producción agrícola o ganadera.',
      imagen: 'pipol.jpeg',
      beneficios: [
        'Garantía prendaria sobre la cosecha',
        'Desembolsos programados',
        'Seguro agrícola incluido',
      ],
    },
    {
      id: '4',
      nombre: 'Arrendamiento Financiero',
      descripcion:
        'Usa la maquinaria que necesitas hoy con la opción de compra al final del contrato.',
      imagen: 'tractor.jpeg',
      beneficios: ['Deducibilidad fiscal', 'Renovación tecnológica', 'Preserva tu liquidez'],
    },
  ];

  register(register: any) {
    return this.http.post<any>(this.myAppUrl + this.myApiUrl + `register`, register);
  }

  login(login: any) {
    return this.http.post<any>(this.myAppUrl + this.myApiUrl + `login`, login);
  }

  cotizar(cotizacion: any, num: any) {
    console.log(this.myAppUrl + this.myApiUrl + `cotizacion/${num}`);
    return this.http.post<any>(this.myAppUrl + this.myApiUrl + `cotizacion/${num}`, cotizacion);
  }
}
