import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app'; // <-- Cambiar 'App' por 'AppComponent'
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config); // <-- Aquí también

export default bootstrap;