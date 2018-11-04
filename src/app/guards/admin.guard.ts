import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';


@Injectable()
export class AdminGuard implements CanActivate {

   constructor(private router: Router) {}

   public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        // Check if user has sufficient access level
        if (localStorage.access_level === '2') {
            // Navigate to the page
            return true;
        } else {
            // Show the login screen
            this.router.navigate(['projects']);
            return false;
        }
   }
}
