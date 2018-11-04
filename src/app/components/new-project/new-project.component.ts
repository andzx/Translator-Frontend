import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-new-project',
  templateUrl: './new-project.component.html',
  styleUrls: ['./new-project.component.css']
})
export class NewProjectComponent implements OnInit {
  error = '';
  warning = '';
  data = [];
  description = '';
  glossary = '';
  title = '';
  files = [];
  segments = [];
  processing = 0;
  test = '';

  constructor(private apiService: ApiService) { }

  ngOnInit() { }

  fileChange(event: any) {
    // In case files were selected previously clean stuff up
    this.segments = [];

    // Display a loading icon
    this.processing = 1;

    // Load files
    this.files = event.target.files;

    // Process file data
    for (let i = 0; i < this.files.length; i++) {
      // Only process pdf files
      if (!this.files[i].type.match('.pdf')) {
        continue;
      }

      // Process PDF into segments
      const reader = new FileReader();

      reader.onload = (e: any) => {
        PDFJS.getDocument(reader.result).then(PDFDocumentInstance => {
          const pages = PDFDocumentInstance.numPages;
          let text = '';

          for (let k = 0; k < pages; k++) {
            PDFDocumentInstance.getPage(k + 1).then(page => {
              page.getTextContent().then(content => {
                // Process all text items in the page
                const items = content.items;

                for (let j = 0; j < items.length; j++) {
                  text += items[j].str;
                }

                // Check if we're on the last page
                if (k === pages - 1) {
                  // Add segment data to the segments array
                  this.segments.push(text);
                }
              });
            });
          }
        }, function (reason) {
            // PDF loading error
            console.error(reason);
        });

        // Done processing, display segments
        this.processing = 2;
      };

      reader.readAsArrayBuffer(this.files[i]);
    }
  }

  clearSegments() {
    this.segments = [];
    this.processing = 0;
  }

  uploadProject() {
    // Clean up warning messages if there were any from another upload attempt
    this.warning = '';

    // Validate segment/s
    if (this.segments.length < 1) {
      this.warning = 'No segment selected';
    }

    // Validate glossary format
    const eqMarks = this.glossary.split('=').length - 1;
    const semicolons = this.glossary.split(';').length - 1;
    if (eqMarks !== semicolons) {
      this.warning = 'Please make sure the glossary fits the following format: word_or_phraze_in_english = word_or_phraze_in_latvian;';
    }

    // Validate glossary format
    if (eqMarks < 1 || semicolons < 1) {
      this.warning = 'Please make sure the glossary fits the following format: word_or_phraze_in_english = word_or_phraze_in_latvian;';
    }

    // Validate glossary length
    if (this.glossary.length < 4 || this.glossary.length > 8191) {
      this.warning = 'Please add a 4 to 8191 characters long glossary';
    }

    // Validate description length
    if (this.description.length < 3 || this.description.length > 511) {
      this.warning = 'Please enter a 3 to 511 characters long project description';
    }

    console.log('Title', this.title);

    // Validate title
    if (this.title.length < 3 || this.title.length > 255) {
      this.warning = 'Please enter 3 to 255 characters long project title';
    }

    // Validate title to be alpha numeric
    if (/^[A-Za-z0-9 ]+$/.test(this.title) === false) {
      this.warning = 'The title can only have letters, numbers and spaces';
    }

    // Validate description to be alpha numeric + dot
    if (/^[A-Za-z0-9 .]+$/.test(this.title) === false) {
      this.warning = 'The title can only have letters, numbers and spaces';
    }

    // Send data to the api
    if (this.warning === '') {
      // Strip newlines
      this.glossary = this.glossary.replace(/(\r\n\t|\n|\r\t)/gm, '');
	  
	  // Convert glossary to lower case
	  // this.glossary = this.glossary.toLowerCase();
	  
	  console.log(this.glossary.toLowerCase());

      // Pack data
      const data = {'description': this.description, 'title': this.title, 'glossary': this.glossary, 'segments': this.segments};

      // Send data
      this.apiService.post('/api/api-post-project.php', data).subscribe(
        (response: any) => {
          // Store the new token
          localStorage.token = response.token;

          // Check response status
          if (response.status === 'fail') {
            this.warning = 'Could not upload the project';
            return;
          }

          // Check if response was a hard fail
          if (response.status === 'hard_fail') {
            // Display an error message
            this.error = 'The application encountered an error';
          }

          // Show a success message
          this.processing = 4;
        },

        error => {
          this.error = 'The application encountered a fatal error while uploading project';
        }
      );
      return;
    }
  }

  closeError() {
    // Log user out, exit application
    this.apiService.logout();
  }
}
