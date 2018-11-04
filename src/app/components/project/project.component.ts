import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit, OnDestroy {
  id: number;
  title: string;
  progress = 0;
  segments = [];
  subscription: any;
  error = '';
  warning = '';
  loading = true;

  constructor(private route: ActivatedRoute,
              private apiService: ApiService,
              private router: Router) { }

  ngOnInit() {
    // Add project title to the page
    this.subscription = this.route.params.subscribe(
      params => {
        this.title = params.title;
        this.id = params.id;
      }
    );

    // Get project segments
    this.apiService.get('/api/api-get-segments.php', {'project_id': this.id}).subscribe(
      (response: any) => {
        // Save the new token
        localStorage.token = response.token;

        console.log('Segments', response.segments);

        // Clean the error if there is one from before
        this.error = '';

        // Check for hard fail
        if (response.status === 'hard_fail') {
          // Display an error message
          this.error = 'The application encountered an error';
        }

        // Check response status
        if (response.status === 'fail') {
          // Display an error
          this.error = 'Could not fetch segments';

          // Remove loading screen
          this.loading = false;

          return;
        }

        // Put results into the segments variable
        this.segments = response.segments;

        // Display progress bar
        this.calculateProgress();
      },

      error => {
        // Display error
        this.error = 'Could not fetch segments';
      }
    );
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  calculateProgress() {
    // Calculate progress = number of segments / complete segments * 100
    let completeSegments = 0;
    const totalSegments = this.segments.length;

    // Count complete segments
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i].complete === '1') {
        completeSegments++;
      }
    }

    // Set the progress bar value
    this.progress = completeSegments / totalSegments * 100;

    // Remove loading screen
    this.loading = false;
  }

  editSegment(segmentId: number) {
    // Open the segment in editor
    this.router.navigate(['/editor/' + this.id + '/' + this.title + '/' + segmentId]);
  }

  assignSegment(segmentId: number) {
    this.apiService.patch('/api/api-assign-segment.php', {'segment_id': segmentId}).subscribe(
      (response: any) => {
        // Save the new token
        localStorage.token = response.token;

        // Clear error if there was one
        this.error = '';

        // Check response for hard fail
        if (response.status === 'hard_fail') {
          // Display an error message
          this.error = 'The application encountered an error';
        }

        // Check response
        if (response.status === 'fail') {
          // Display error
          this.error = 'Could not assign segment';
          return;
        }

        let index;

        // Get index of the current segment
        for (let i = 0; i < this.segments.length; i++) {
          if (this.segments[i].id === segmentId) {
            index = i;
          }
        }

        // Allow current user to edit the segment
        this.segments[index].can_edit = true;
        this.segments[index].can_unassign = true;
        this.segments[index].assigned = true;
      },

      error => {
        // Display error
        this.error = 'Could not assign segment';
      }
    );
  }

  unassignSegment(segmentId: number) {
    this.apiService.patch('/api/api-unassign-segment.php', {'segment_id': segmentId}).subscribe(
      (response: any) => {
        // Save the new token
        localStorage.token = response.token;

        // Clear error if there was one
        this.error = '';

        // Check response for hard fail
        if (response.status === 'hard_fail') {
          // Display an error message
          this.error = 'The application encountered an error';
        }

        // Check response
        if (response.status === 'fail') {
          // Display error
          this.error = 'Could not assign segment';
          return;
        }

        let index;

        // Get index of the current segment
        for (let i = 0; i < this.segments.length; i++) {
          if (this.segments[i].id === segmentId) {
            index = i;
          }
        }

        // Allow current user to edit the segment
        if (localStorage.access_level !== '2') {
          this.segments[index].can_edit = false;
        } else {
          this.segments[index].can_edit = true;
        }

        this.segments[index].can_unassign = false;
        this.segments[index].assigned = false;
      },

      error => {
        // Display error
        this.error = 'Could not assign segment';
      }
    );
  }

  closeError() {
    // Log user out, exit application
    this.apiService.logout();
  }
}
