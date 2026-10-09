import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { BreakpointObserver } from '@angular/cdk/layout';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { map } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatButtonModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  private breakpoints = inject(BreakpointObserver);

  // below 960px the side menu turns into a drawer
  isMobile = toSignal(this.breakpoints.observe('(max-width: 959px)').pipe(map(result => result.matches)), {
    initialValue: false
  });

  menu = [
    { path: '/medicines', label: 'Medicines', icon: 'medication' },
    { path: '/sales', label: 'Sales', icon: 'receipt_long' }
  ];

  year = new Date().getFullYear();
}
