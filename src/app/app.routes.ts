import { CardComponent } from './features/card/card.component';
import { FormComponent } from './features/form/form.component';
import { LobbyComponent } from './features/lobby/lobby.component';
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', component: LobbyComponent },
  { path: 'form', component: FormComponent },
  { path: 'card', component: CardComponent },
  { path: '**', redirectTo: '' },
];
