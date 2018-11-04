import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Injectable } from '@angular/core';


@Injectable()
export class AuthGuard implements CanActivate {

   constructor(private router: Router) {}

   public canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        // Read data from localStorage
        if (localStorage.session && localStorage.token) {
            // Navigate to the page
            return true;
        } else {
            // Show the login screen
            this.router.navigate(['login']);
            return false;
        }
   }
}
