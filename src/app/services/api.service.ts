import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable()
export class ApiService {
  public segmentId;
  public projectId;

  constructor(private http: HttpClient,
              private router: Router) { }

  login(credentials) {
    return this.http.post('/api/api-login.php', credentials);
  }

  logout() {
    // Delete session and token from local storage
    localStorage.removeItem('session');
    localStorage.removeItem('token');

    // Navigate to the login page
    this.router.navigate(['login']);
  }

  get (URL, data?: any) {
    // Params variable
    let params = '';

    // Process added data into a get param string
    if (data) {
      for (const param in data) {
        if (data.hasOwnProperty(param)) {
          params += '&' + param + '=' + data[param];
        }
      }
    }

    return this.http.get(URL + '?session=' + localStorage.session + '&token=' + localStorage.token + params);
  }

  post (URL, data) {
    // Add session and token
    data.session = localStorage.session;
    data.token = localStorage.token;

    return this.http.post(URL, data);
  }

  patch (URL, data) {
    // Add session and token
    data.session = localStorage.session;
    data.token = localStorage.token;

    return this.http.post(URL, data);
  }

  delete (URL, data?: any) {
    // Params variable
    let params = '';

    // Process added data into a get param string
    if (data) {
      for (const param in data) {
        if (data.hasOwnProperty(param)) {
          params += '&' + param + '=' + data[param];
        }
      }
    }

    return this.http.get(URL + '?session=' + localStorage.session + '&token=' + localStorage.token + params);
  }
}
