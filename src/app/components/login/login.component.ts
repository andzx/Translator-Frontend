import { Component } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string;
  password: string;
  error = '';

  constructor(private apiService: ApiService,
              private router: Router) { }

  login () {
    this.apiService.login({'email': this.email, 'password': this.password}).subscribe(
      (response: any) => {
        // Remove any error from a previous login attempt if there was one
        this.error = '';

        // Check if response was ok
        if (response.status === 'ok') {
          // Store session, token and access level
          localStorage.session = response.session;
          localStorage.token = response.token;
          localStorage.access_level = response.access_level;

          // Reset error if there was one
          this.error = null;

          // Navigate to the projects page
          this.router.navigate(['/projects']);

          return;
        }

        // Display error
        this.error = 'Login failed, check your credentials';
      },

      error => {
        // Display error
        this.error = 'Login failed, system error';
      }
    );
  }
}
