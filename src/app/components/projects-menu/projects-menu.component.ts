import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projects-menu',
  templateUrl: './projects-menu.component.html',
  styleUrls: ['./projects-menu.component.css']
})
export class ProjectsMenuComponent implements OnInit {
  @Input() projectTitle: string;
  @Input() progress: number;
  accessLevel = '1';

  constructor(private router: Router) { }

  ngOnInit() {
    // Get users access level from local storage
    this.accessLevel = localStorage.access_level;
  }

  newProject() {
    // Navigate to the new project page
    this.router.navigate(['new/project']);
  }

  showProjects() {
    // Navigate to the projects page
    this.router.navigate(['projects']);
  }

  logout() {
    // Clean local storage
    localStorage.removeItem('session');
    localStorage.removeItem('token');

    // Navigate to the login page
    this.router.navigate(['login']);
  }
}
