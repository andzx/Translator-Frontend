import { Component, OnInit, DoCheck, HostListener } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { Segment } from '../../models/segment.model';
import { Glossary } from '../../models/glossary.model';
import { Observable } from 'rxjs/Observable';
import { Autosave } from '../../models/autosave.model';

@Component({
  selector: 'app-editor',
  templateUrl: './editor.component.html',
  styleUrls: ['./editor.component.css']
})
export class EditorComponent implements OnInit, DoCheck {
  error = '';
  warning = '';
  fetchError = false;

  segment: Segment;
  glossary = new Glossary();
  glossaryEnabled = true;

  localCopy;
  remoteCopy;
  remoteCopyData: string;
  localCopyData: string;
  showCopySelection = false;
  linkScrolling = false;
  saving = false;
  saved = false;
  savedRemotely = true;
  subscription: any;
  complete = false;
  loading = true;
  autosaveInterval = null;

  segmentParts = [];
  savedSegmentParts: string;
  sourceWithoutGlossary = [];
  sourceWithGlossary = [];

  request = false;
  requestText = '';
  requestContext = '';
  postingRequest = 1;

  constructor(private router: Router,
              private apiService: ApiService,
              private route: ActivatedRoute) { }

  @HostListener('window:beforeunload')
  canDeactivate(): Observable<boolean> | boolean {
    if (this.savedRemotely === true) {
      // Check if autosave was activated
      if (this.autosaveInterval !== null) {
        // Perform an autosave
        this.performAutosave();

        // Kill the autosave interval
        this.autosaveInterval = null;
      }

      return true;
    }
    // Check if autosave was activated
    if (this.autosaveInterval !== null) {
      // Perform an autosave
      this.performAutosave();

      // Kill the autosave interval
      this.autosaveInterval = null;
    }

    return false;
  }

  ngOnInit() {
    // Add project title to the page
    this.subscription = this.route.params.subscribe(
      params => {
        this.segment = new Segment(params.segmentId, params.projectId, params.title);
      }
    );

    // Firefox height fix, initial
    this.firefoxHeightFix();

    // On resize
    window.onresize = () => {
      this.firefoxHeightFix();
    };

    // Load source language segment
    this.getSourceSegment();
  }

  ngDoCheck(): void {
    if (this.savedSegmentParts !== JSON.stringify(this.segmentParts)) {
      this.saved = false;
      this.savedRemotely = false;
    }
  }

  getSourceSegment() {
    this.apiService.get('/api/api-get-source-segment.php',
                        {'segment_id': this.segment.id}).subscribe(
      (response: any) => {
        // Save security token in local storage
        localStorage.token = response.token;

        // Check status
        if (response.status === 'ok') {
          // Get glossary
          this.getGlossary(response.text);
          return;
        }

        // Check if it was a hard failure
        if (response.status === 'hard_fail') {
          // Display an error message
          this.error = 'The application encountered an error';
        }

        // Display an error message
        this.fetchError = true;
        this.warning = 'Could not fetch segment in source language,\
                        after clicking OK the application will attempt\
                        to navigate back to the project page';
      },

      error => {
        this.error = 'The application encountered an error';
      }
    );
  }

  getGlossary(text: any) {
    // Get glosary
    this.apiService.get('/api/api-get-glossary.php',
                       {'project_id': this.segment.projectId}).subscribe(
      (response: any) => {
        // Save security token in local storage
        localStorage.token = response.token;

        // Check status
        if (response.status === 'ok') {
          // Create an array of glossary items
          const glossaryArray = response.glossary.split(';');

          // Delete the last array item which is an empty string
          // from "after" the last semicolon
          glossaryArray.splice(-1, 1);

          // Process glossary
          for (let i = 0; i < glossaryArray.length; i++) {
            // Get rid of newlines
            glossaryArray[i] = glossaryArray[i].replace(/\r/g, '');
            glossaryArray[i] = glossaryArray[i].replace(/\n/g, '');

            // Split glossary item into source and target word, phraze
            let source = glossaryArray[i].split('=')[0];
            let target = glossaryArray[i].split('=')[1];

            // Remove space that may have been there before and, or after the "=" mark
            source = source.trim();
            target = target.trim();

            // Add source and target glossary words and phrazes to processed glossary
            this.glossary.source.push(source);
            this.glossary.target.push(target);

            // Check if the word or phraze is lower or uppercase and generate the other variant
            if (source[0] !== source[0].toLowerCase()) {
              // Add lower case version
              this.glossary.source.push(source.toLowerCase());
              this.glossary.target.push(target.toLowerCase());
            } else {
              // Add upper case version
              this.glossary.source.push(source.charAt(0).toUpperCase() + source.slice(1));
              this.glossary.target.push(target.charAt(0).toUpperCase() + target.slice(1));
            }
          }

          // Save source version without glossary added to it
          this.sourceWithoutGlossary = text.replace(/\./g, '.■').split('■');

          // Add glossary to the text
          for (let i = 0; i < this.glossary.source.length; i++) {
            // Replace all matching instances, upper/lower case insensitive
            text = text.replace(new RegExp(this.glossary.source[i], 'g'),
            '<span class="glossary-item">' +
            this.glossary.source[i] + '<span class="glossary-text">:' +
            this.glossary.target[i] + '</span></span>');
          }

          // Replace dots with a dot and another symbol to keep dots in the text when splitting
          text = text.replace(/\./g, '.■');

          // Process source segment text into paragraphs
          const sentences = text.split('■');

          // Strip spaces from the last sentence
          const lastSentence = sentences[sentences.length - 1].replace(/ /g, '');

          // If the last sentence is leftover space cut it
          if (lastSentence === '') {
            sentences.splice(-1, 1);
          }

          // Add sentences to array
          for (let i = 0; i < sentences.length; i++) {
            this.segmentParts.push({'source': sentences[i], 'target': ''});
            this.sourceWithGlossary.push(sentences[i]);
          }

          // Load target language segment
          this.getTargetSegment();
          return;
        }

        // Check if it was a hard failure
        if (response.status === 'hard_fail') {
          // Display an error message
          this.error = 'The application encountered an error';
        }

        this.fetchError = true;
        this.warning = 'Could not fetch project glossary,\
                        after clicking OK the application will attempt\
                        to navigate back to the project page';
      },

      error => {
        // Display an error message
        this.error = 'Could not fetch glossary';
      }
    );
  }

  getTargetSegment() {
    this.apiService.get('/api/api-get-target-segment.php',
                        {'segment_id': this.segment.id}).subscribe(
      (response: any) => {
        // Save session and security token in local storage
        localStorage.token = response.token;

        // Check status
        if (response.status === 'ok') {
          // Remove separators and save target segment
          this.remoteCopy = response.text;
          this.remoteCopyData = response.text;

          // Set segment completion state
          if (response.complete === '1') {
            this.complete = true;
          }

          // Set saved remotely to true
          this.savedRemotely = true;

          // Check autosaves for a local copy
          this.checkAutosaves();
          return;
        }

        // Check if authorization failed
        if (response.status === 'hard_fail') {
          // Display an error message
          this.error = 'The application encountered an error';
        }

        // Display a warning message
        this.fetchError = true;
        this.warning = 'Could not fetch segment text in target language,\
                        after clicking OK the application will attempt\
                        to navigate back to the project page';
      },

      error => {
        this.error = '! Could not fetch segment in target language';
      }
    );
  }

  markComplete() {
    // Save current status
    let status = 0;

    if (this.complete === false) {
      status = 1;
    }

    // Do the api call
    this.apiService.patch('/api/api-patch-target-segment.php',
                          {'segment_id': this.segment.id,
                           'complete': status}).subscribe(
      (response: any) => {
        // Save session and security token in local storage
        localStorage.token = response.token;

        // Check status
        if (response.status === 'ok') {
          // Change segment status
          if (status === 1) {
            this.segment.complete = 1;
            this.complete = true;
            return;
          }
          this.segment.complete = 0;
          this.complete = false;
          return;
        }

        // Check if authorization failed
        if (response.status === 'hard_fail') {
          // Display an error message
          this.error = 'The application encountered an error';
        }

        // Display an error message
        this.warning = 'Could not change segment completion status';
      },

      error => {
        this.error = 'Could not change segment completion status';
      }
    );
  }

  checkAutosaves() {
    // Check if there are autosaves
    if (localStorage.autosaves) {
      // Load autosave data
      const autosaves = JSON.parse(localStorage.autosaves);

      // Look for the current project and segment
      for (let i = 0; i < autosaves.length; i++) {
        if (autosaves[i].projectId === this.segment.projectId && autosaves[i].segmentId === this.segment.id) {
          // Process and put data into the selection form variable
          this.localCopy = autosaves[i].data.split('0xSep').join(' ');
          this.remoteCopy = this.remoteCopy.split('0xSep').join(' ');

          // If autosaves don't match display the selection screen
          if (this.localCopy !== this.remoteCopy) {
            // Store the remote and local copy data arrays`ssss
            this.localCopyData = autosaves[i].data;

            // Display the selection form
            this.showCopySelection = true;

            // Remove the loading screen
            this.loading = false;

            return;
          }

          // Process target segment text into paragraphs
          const sentencesz = this.remoteCopyData.split('0xSep');

          // Check if last item is an empty string and if it is delete it
          if (sentencesz[sentencesz.length - 1] === '') {
            sentencesz.splice(-1, 1);
          }

          // Add sentences to array
          for (let k = 0; k < sentencesz.length; k++) {
            this.segmentParts[k].target = sentencesz[k];
          }

          // Clone target segment data
          this.savedSegmentParts = JSON.stringify(this.segmentParts);

          // Start the autosave interval
          this.autosave();

          // Remove the loading screen
          this.loading = false;

          return;
        }
      }

      // Process target segment text into paragraphs
      const sentencesx = this.remoteCopy.split('0xSep');

      // Check if last item is an empty string and if it is delete it
      if (sentencesx[sentencesx.length - 1] === '') {
        sentencesx.splice(-1, 1);
      }

      // Add sentences to array
      for (let i = 0; i < sentencesx.length; i++) {
        this.segmentParts[i].target = sentencesx[i];
      }

      // Clone target segment data
      this.savedSegmentParts = JSON.stringify(this.segmentParts);

      // Start the autosave interval
      this.autosave();

      // Remove the loading screen
      this.loading = false;

      return;
    }

    // Process target segment into paragraphs
    const sentences = this.remoteCopy.split('0xSep');

    // Check if last item is an empty string and if it is delete it
    if (sentences[sentences.length - 1] === '') {
      sentences.splice(-1, 1);
    }

    // Add sentences to array
    for (let i = 0; i < sentences.length; i++) {
      this.segmentParts[i].target = sentences[i];
    }

    // Start the autosave interval
    this.autosave();

    // Remove loading screen
    this.loading = false;
  }

  autosave() {
    this.autosaveInterval = setInterval(() => {
      this.performAutosave();
      }, 10000);
  }

  performAutosave() {
    // Check if autosaves exist
    if (localStorage.autosaves) {
      // Load autosave data
      const autosaves = JSON.parse(localStorage.autosaves);

      // Look for the current project and segment
      for (let i = 0; i < autosaves.length; i++) {
        if (autosaves[i].projectId === this.segment.projectId && autosaves[i].segmentId === this.segment.id) {
          // Add data to array
          autosaves[i] = this.packAutosave();

          // Store the autosave/s
          this.storeAutosaves(autosaves);

          return;
        }
      }

      // Add packed autosave data to autosaves array
      autosaves.push(this.packAutosave());

      // Store the autosave/s
      this.storeAutosaves(autosaves);

      return;
    }

    // No autosaves exist, create new autosave array
    const autosavesx = [];

    // Pack autosave data
    autosavesx.push(this.packAutosave());

    // Store the autosave/s
    this.storeAutosaves(autosavesx);
  }

  packAutosave() {
    let data = '';

    for (let k = 0; k < this.segmentParts.length; k++) {
      data += this.segmentParts[k].target + '0xSep';
    }

    const autosave = new Autosave(this.segment.projectId, this.segment.id, data);

    return autosave;
  }

  storeAutosaves(autosaves) {
    // Save autosaves to local storage
    localStorage.autosaves = JSON.stringify(autosaves);

    // Save a new segment parts clone
    this.savedSegmentParts = JSON.stringify(this.segmentParts);

    // Tell the user there has been a local autosave
    this.saved = true;
  }

  selectCopy(copy: string) {
    // Hide the selection popup
    this.showCopySelection = false;

    // Use the local copy
    if (copy === 'local') {
      // Process segment text from local autosave into segment parts
      const sentences = this.localCopyData.split('0xSep');

      // Check if last item is an empty string and if it is delete it
      if (sentences[sentences.length - 1] === '') {
        sentences.splice(-1, 1);
      }

      // Add sentences to array
      for (let i = 0; i < sentences.length; i++) {
        this.segmentParts[i].target = sentences[i];
      }

      // Clone target segment data
      this.savedSegmentParts = JSON.stringify(this.segmentParts);

      // Start the autosave interval
      this.autosave();

      return;
    }

    // Process segment text from server response into segment parts
    const sentencesx = this.remoteCopyData.split('0xSep');

    // Check if last item is an empty string and if it is delete it
    if (sentencesx[sentencesx.length - 1] === '') {
      sentencesx.splice(-1, 1);
    }

    // Add sentences to array
    for (let i = 0; i < sentencesx.length; i++) {
      this.segmentParts[i].target = sentencesx[i];
    }

    // Clone target segment data
    this.savedSegmentParts = JSON.stringify(this.segmentParts);

    // Start the autosave interval
    this.autosave();
  }

  openProjects() {
    // Navigate to the projects page
    this.router.navigate(['projects']);
  }

  openSegments() {
    // Check if the project id & title has been set, otherwise do nothing
    if (this.segment.projectId && this.segment.title) {
      // Navigate to the project page
      this.router.navigate(['project/' + this.segment.projectId + '/' + this.segment.title]);
    }
  }

  saveSegment() {
    // Disable save button and show a saving animation
    this.saving = true;

    // Pack segment into a string
    let targetSegment = '';

    // Process target segment into a string
    for (let i = 0; i < this.segmentParts.length; i++) {
      targetSegment += this.segmentParts[i].target + '0xSep';
    }

    // Make an API call
    this.apiService.patch('/api/api-patch-target-segment.php',
                          {'segment_id': this.segment.id,
                           'text': targetSegment}).subscribe(
      (response: any) => {
        // Save session and security token in local storage
        localStorage.token = response.token;

        // Check status
        if (response.status === 'ok') {
          // Save segment locally
          this.performAutosave();

          // Set segment to saved locally
          this.saved = true;

          // Set segment to saved remotely
          this.savedRemotely = true;

          // Re-enable the save button
          this.saving = false;

          return;
        }

        // Check if authorization failed
        if (response.status === 'hard_fail') {
          // Display an error message
          this.error = 'The application encountered an error';
        }

        // Re-enable the save button
        this.saving = false;

        // Display an error message
        this.warning = 'Could not save segment';
      },

      error => {
        this.error = 'Could not save segment';
      }
    );
  }

  postRequest() {
    // Validate context
    // REGEX ISSUE FIX
    let regexResult = /^[A-Za-z0-9\s.,:;!@#$%\^&*\(\)\[\]_]+$/.test(this.requestContext);
	console.log(this.requestContext);
	console.log(regexResult);
    // REGEX ISSUE FIX
    if (regexResult === false) {
      this.warning = 'The request context can only have letters, numbers, spaces and punctuation marks';
    }

    // Validate context length
    if (this.requestContext.length < 3 || this.requestContext.length > 4093) {
      this.warning = 'The request context must be between 3 and 4095 characters long';
    }

    // Validate request
    regexResult = /^[A-Za-z0-9\s.,:;!@#$%^&*\(\)\[\]_-]+$/.test(this.requestText);
    if (regexResult === false) {
      this.warning = 'The request text can only have letters, numbers and spaces and punctuation marks';
    }

    // Validate request length
    if (this.requestText.length < 2 || this.requestText.length > 1023) {
      this.warning = 'The request text must be between 2 and 1023 characters long';
    }

    // If theres no warning, post
    if (this.warning === '') {
      // Change posting request state to 2
      this.postingRequest = 2;

      // Make an api call
      this.apiService.post('/api/api-post-request.php',
                           {'text': this.requestText,
                            'context': this.requestContext,
                            'project_id': this.segment.projectId,
                            'segment_id': this.segment.id}).subscribe(
        (response: any) => {
          // Save token to local storage
          localStorage.token = response.token;

          // Check if there was an authorization issue
          if (response.status === 'hard_fail') {
            // Display an error message
            this.error = 'The application encountered an error';
          }

          // Check if response was ok
          if (response.status === 'ok') {
            // Show the close request form button
            this.postingRequest = 3;

            return;
          }

          // Display an error
          this.warning = 'Could not post the request';
        },

        error => {
          // Display an error
          this.error = 'Could not post the request';
        }
      );
    }
  }

  logOut() {
    // Delete session and token from local storage
    localStorage.removeItem('session');
    localStorage.removeItem('token');

    // Navigate to the login page
    this.router.navigate(['login']);
  }

  firefoxHeightFix() {
    const height = window.innerHeight;
    const editor = <HTMLElement>document.querySelector('.editor');
    editor.style.height = height - 70 + 'px';
  }

  closeError() {
    // Log user out, exit application
    this.apiService.logout();
  }

  closeWarning() {
    // Check if its a non fatal fetch error
    if (this.fetchError === false) {
      this.warning = '';
      return;
    }

    // Navigate to the project segments
    this.router.navigate(['project/' + this.segment.projectId + '/' + this.segment.title]);
  }

  requestForm() {
    this.request = true;
    this.requestContext = window.getSelection().toString();
    return false;
  }

  specificRequestText() {
    const requestContext = <HTMLInputElement>document.querySelector('.request-context');
    const startPos = requestContext.selectionStart;
    const endPos = requestContext.selectionEnd;
    this.requestText = requestContext.value.substring(startPos, endPos);
    return false;
  }

  toggleGlossary() {
    // Store the remote save state
    const saved = this.savedRemotely;

    // Check if glossary is currently on
    if (this.glossaryEnabled) {
      // Change source text parts to text without glossary
      for (let i = 0; i < this.segmentParts.length; i++) {
        this.segmentParts[i].source = this.sourceWithoutGlossary[i];
      }

      // Set glossary to disabled
      this.glossaryEnabled = false;

      // Set the save state to what it was
      if (saved === true) {
        this.savedSegmentParts = JSON.stringify(this.segmentParts);
        this.savedRemotely = saved;
      }

      return;
    }
    // Change source text parts to contain glossary
    for (let i = 0; i < this.segmentParts.length; i++) {
      this.segmentParts[i].source = this.sourceWithGlossary[i];
    }

    // Set glossary to enabled
    this.glossaryEnabled = true;

    // Set the save state to what it was
    if (saved === true) {
      this.savedSegmentParts = JSON.stringify(this.segmentParts);
      this.savedRemotely = saved;
    }
  }

  highlight(sentenceNumber: number) {
    // Set color of all non active sentences to white
    const allSentences = (<HTMLElement[]><any>document.querySelectorAll('.sentence'));

    for (let i = 0; i < allSentences.length; i++) {
      allSentences[i].style.background = 'white';
    }

    // Highlight the sentence that is being focused with a bright green background
    const sourceSentence = <HTMLElement>document.querySelector('.source-sentence' + sentenceNumber);
    const targetSentence = <HTMLElement>document.querySelector('.target-sentence' + sentenceNumber);
    targetSentence.style.background = '#A6E598';
    sourceSentence.style.background = '#A6E598';
  }
}
