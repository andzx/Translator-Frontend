import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-projects',
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.css']
})
export class ProjectsComponent implements OnInit {
  error = '';
  warning = '';
  projects = [];
  noProjects = undefined;
  noRequests = undefined;
  canReply = false;
  replyProjectId: number;
  replySegmentId: number;
  replyRequestId: number;
  loading = true;
  requests = [];
  requestText = '';
  requestReplyText = '';
  postingRequest = 0;
  answers = [];
  closingRequest = 0;
  canClose = false;
  closeRequestId: number;
  requestIndex: number;
  contextMenu = false;
  confirmDelete = false;
  deletingProject = 0;
  projectIndex: number;
  preparingTranslation = 0;
  downloadText = '';
  accessLevel = '1';

  constructor(private router: Router,
              private apiService: ApiService) { }

  ngOnInit() {
    // Get access level
    this.accessLevel = localStorage.access_level;

    // Get the projects data
    this.apiService.get('/api/api-get-projects.php').subscribe(
      (response: any) => {
        // Store the token
        localStorage.token = response.token;

        // Check if projects were fetched
        if (response.status === 'ok') {
          // Insert data into the projects variable
          this.projects = response.data;

          // Get requests
          this.fetchRequests();

          return;
        }

        // Check if there were no projects to fetch
        if (response.status === 'no_projects') {
          this.noProjects = true;

          // Remove loading screen
          this.loading = false;

          return;
        }

        // Check if authorization failed
        if (response.status === 'hard_fail') {
          // Log user out
          this.apiService.logout();
        }

        // Remove loading screen
        this.loading = false;

        // Display error
        this.warning = 'Could not load projects';
      },

      error => {
        this.error = '! Could not load projects';
      }
    );
  }

  fetchRequests() {
    this.apiService.get('/api/api-get-requests.php').subscribe(
      (response: any) => {
        // Save token in local storage
        localStorage.token = response.token;

        // Check if response was a hard fail
        if (response.status === 'hard_fail') {
          // Log user out
          this.apiService.logout();
        }

        // Check if there were no requests to get
        if (response.status === 'no_requests') {
          // Display a no requests message
          this.noRequests = true;

          // Remove loading screen
          this.loading = false;

          return;
        }

        // Check if response was ok
        if (response.status === 'ok') {
          // Insert requests into the document
          this.requests = response.requests;

          // Remove loading screen
          this.loading = false;

          return;
        }

        // Display an error message
        this.warning = 'Could not fetch requests';
      },

      error => {
        // Display the error
        this.error = 'Could not fetch requests';
      }
    );
  }

  showRequestForm(index: number) {
    // Save request index for closing request
    this.requestIndex = index;

    // Populate the request form with the data from the chosen request
    // If another user posted the request enable the reply option
    if (this.requests[index].can_reply === 1) {
      this.canReply = true;
      this.replyProjectId = this.requests[index].project_id;
      this.replySegmentId = this.requests[index].segment_id;
      this.replyRequestId = this.requests[index].request_id;

      // Delete any answers if there were any from a previous request viewing
      this.answers = [];

      // Add or remove the request close option/button
      if (this.requests[index].can_close === 1) {
        this.canClose = true;

        // Store the request id
        this.closeRequestId = this.requests[index].request_id;
      } else {
        this.canClose = false;

        // Remove the request id
        this.closeRequestId = null;
      }
    } else {
      // If the current user posted the request show answers
      this.canReply = false;
      this.replyProjectId = null;
      this.replySegmentId = null;
      this.replyRequestId = null;

      // Populate the answers array
      this.answers = this.requests[index].answers;

      // Add or remove the request close option/button
      if (this.requests[index].can_close === 1) {
        this.canClose = true;

        // Store the request id
        this.closeRequestId = this.requests[index].request_id;
      } else {
        this.canClose = false;

        // Remove the request id
        this.closeRequestId = null;
      }
    }

    // Build request text
    this.requestText = this.requests[index].context.replace(
      this.requests[index].text,
      '<span class="highlighted-request">' + this.requests[index].text + '</span>'
    );

    // Show the request form
    this.postingRequest = 1;
  }

  replyToRequest() {
    // Validate answer text
    if (/^[A-Za-z0-9\s.,:;!@#$%\^&*\(\)\[\]_-]+$/.test(this.requestReplyText) === false) {
      this.warning = 'The answer can only have letters, numbers and punctuation marks';
    }

    // Validate answer length
    if (this.requestReplyText.length < 2 || this.requestReplyText.length > 1023) {
      this.warning = 'The answer text must be between 2 and 1023 characters long';
    }

    if (this.warning === '') {
      // Call the api
      this.apiService.post('/api/api-post-answer.php',
                          {'project_id': this.replyProjectId,
                           'segment_id': this.replySegmentId,
                           'request_id': this.replyRequestId,
                           'text': this.requestReplyText}).subscribe(
        (response: any) => {
          // Save token
          localStorage.token = response.token;

          // Check if the request succeeded
          if (response.status === 'ok') {
            // Display a success message
            this.postingRequest = 3;

            return;
          }

          // Check if authorization failed/there was a fatal error
          if (response.status === 'hard_fail') {
            // Log user out
            this.apiService.logout();
          }

          // Display the error message
          this.warning = 'There was an error posting the answer';
        },

        error => {
          // Display an error message
          this.error = 'There was an error posting the answer';
        }
      );
    }
  }

  closeRequest() {
    // Show a closing request message
    this.closingRequest = 1;
    console.log('Request id', this.closeRequestId);

    // Make an api call
    this.apiService.patch('/api/api-patch-request.php',
                         {'request_id': this.closeRequestId}).subscribe(
      (response: any) => {
        // Store the token
        localStorage.token = response.token;

        // Check if there was a problem with credentials
        if (response.status === 'hard_fail') {
          // Log user out
          this.apiService.logout();
        }

        // Check if response was ok
        if (response.status === 'ok') {
          // Delete the request from requests array
          this.requests.splice(this.requestIndex, 1);
          // Display a success message
          this.closingRequest = 2;

          return;
        }

        // Display an error message
        this.warning = 'Could not close the request';
      },

      error => {
        // Display an error message
        this.error = 'Could not close the request';
      }
    );
  }

  showContextMenu() {
    // Show the context menu
    this.contextMenu = true;

    // Hide the default context menu
    return false;
  }

  deleteProject() {
    this.apiService.delete('/api/api-delete-project.php',
                          {'project_id': this.projects[this.projectIndex].id}).subscribe(
      (response: any) => {
        // Store token
        localStorage.token = response.token;

        // Check if response was ok
        if (response.status === 'ok') {
          // Remove any requests that belong to the project
          for (let i = 0; i < this.requests.length; i++) {
            if (this.requests[i].project_id === this.projects[this.projectIndex].id) {
              this.requests[i].splice(i, 1);
            }
          }

          // Remove the project from view
          this.projects.splice(this.projectIndex, 1);

          // Display a success message
          this.deletingProject = 2;

          return;
        }

        // Check if response was a hard fail
        if (response.status === 'hard_fail') {
          // Log user out
          this.apiService.logout();

          return;
        }

        // Display an error message
        this.warning = 'There was an error while deleting the project';
      },

      error => {
        // Display an error message
        this.error = 'There was an error while deleting the project';
      }
    );
  }

  getTranslation () {
    this.apiService.get('/api/api-get-project-translation.php',
                       {'project_id': this.projects[this.projectIndex].id}).subscribe(
      (response: any) => {
        // Store token
        localStorage.token = response.token;

        // Check if response was ok
        if (response.status === 'ok') {
          // Make an array variable
          const sentences = [];

          // Process translation into plain text
          for (let i = 0; i < response.segments.length; i++) {
            // Insert a note that this is a segment
            sentences.push('Segment #' + (i + 1) + '\r\n\r\n');

            // Split text into an array
            const segmentSentences = response.segments[i].split('0xSep');

            // Add all segment sentences to the project sentences array
            for (let k = 0; k < segmentSentences.length; k++) {
              if (segmentSentences[k] === '') {
                sentences.push(' *Missing Sentence #' + (k + 1) + '* ');
              } else {
                sentences.push(segmentSentences[k]);
              }
            }

            // End the segment with a newline
            sentences.push('\r\n\r\n');
          }

          // Compile all sentences into the download text
          this.downloadText = sentences.join('');

          // Display a success message
          this.preparingTranslation = 2;

          return;
        }

        // Check if response was a hard fail
        if (response.status === 'hard_fail') {
          // Log user out
          this.apiService.logout();

          return;
        }

        // Display an error message
        this.warning = 'There was an error while preparing translation';
      },

      error => {
        // Display an error message
        this.error = 'There was an error while preparing translation';
      }
    );
  }

  downloadTranslation() {
    const pom = document.createElement('a');
    pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.downloadText));
    pom.setAttribute('download', this.projects[this.projectIndex].title + '.txt');

    if (document.createEvent) {
      const event = document.createEvent('MouseEvents');
        event.initEvent('click', true, true);
        pom.dispatchEvent(event);
    } else {
        pom.click();
    }
  }

  closeProjectOptions() {
    if (this.preparingTranslation === 1) {
      // Display a warning message
      this.warning = 'Please wait while the translation is being prepared';

      return;
    }
    if (this.deletingProject === 1) {
      // Display a warning message
      this.warning = 'Please wait while the project is being deleted';

      return;
    }

    // Nothing happening, set the project options menu to its initial state
    this.confirmDelete = false;
    this.deletingProject = 0;
    this.preparingTranslation = 0;
    this.contextMenu = false;
  }

  closeError() {
    // Log user out, exit application
    this.apiService.logout();
  }
}
