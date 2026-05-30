import { Routes } from '@angular/router';
import { AgendarCitaComponent }   from './components/agendar-cita/agendar-cita.component';
import { HistorialCitasComponent } from './components/historial-citas/historial-citas.component';

export const routes: Routes = [
  { path: 'agendar-cita/:idVehiculo', component: AgendarCitaComponent },
  { path: 'historial-citas',          component: HistorialCitasComponent }
];
