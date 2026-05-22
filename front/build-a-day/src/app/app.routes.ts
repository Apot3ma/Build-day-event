import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Layout } from './pages/layout/layout';
import { Dashboard } from './pages/dashboard/dashboard';
import { Listing } from './pages/listing/listing';
import { Detail } from './pages/detail/detail';



export const routes: Routes = [
    {
    path: '',
    component: Login,
  },
  {
    path: 'app',
    component: Layout,
    children: [
      {
        path: '',
        component: Dashboard,
      },
      {
        path: 'productos',
        component: Listing,
      },
      {
        path: 'servicios',
        component: Listing,
      },
      {
        path: 'detalle/:type/:id',
        component: Detail,
      },
    ],
  },
];
