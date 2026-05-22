import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-detail',
  imports: [CommonModule, FormsModule],
  templateUrl: './detail.html',
  styleUrl: './detail.css',
})
export class Detail {
  item: any;
  showModal = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: MockDataService,
  ) {}

  numero = sessionStorage.getItem('numtelefono')

  ngOnInit(): void {
    const type = this.route.snapshot.paramMap.get('type');
    const id = this.route.snapshot.paramMap.get('id');

    const list = type === 'producto'
      ? this.data.productos
      : this.data.servicios;

    this.item = list.find(x => x.id === id);
  }

  volver() {
    this.router.navigate(['/app']);
  }

  cotizar(){
    const producto = {
      producto:this.item.nombre,
      precio:this.item.precio,
      cantidad:''
    }

    this.data.cotizar(producto, this.numero)
  }
    
}

