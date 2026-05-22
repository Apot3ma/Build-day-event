import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MockDataService } from '../../services/mock-data.service';

@Component({
  selector: 'app-listing',
  imports: [CommonModule, RouterLink],
  templateUrl: './listing.html',
  styleUrl: './listing.css',
})
export class Listing {
  items: any[] = [];
  isProducts = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private data: MockDataService
  ) {}

  ngOnInit(): void {
    this.isProducts = this.router.url.includes('productos');

    this.items = this.isProducts
      ? this.data.productos
      : this.data.servicios;
  }
}
