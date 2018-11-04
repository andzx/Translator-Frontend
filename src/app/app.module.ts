import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { AppComponent } from './app.component';
import { LoginComponent } from './components/login/login.component';
import { ProjectsComponent } from './components/projects/projects.component';
import { ProjectComponent } from './components/project/project.component';
import { NewProjectComponent } from './components/new-project/new-project.component';
import { EditorComponent } from './components/editor/editor.component';
import { ErrorComponent } from './components/404/error.component';
import { AuthGuard } from './guards/auth.guard';
import { ApiService } from './services/api.service';
import { HttpClientModule } from '@angular/common/http';
import { SaveGuard } from './guards/save.guard';
import { ProjectsMenuComponent } from './components/projects-menu/projects-menu.component';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { TitlePipe } from './pipes/title.pipe';
import { AdminGuard } from './guards/admin.guard';

const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'login', component: LoginComponent },
  { path: 'projects', component: ProjectsComponent, canActivate: [AuthGuard] },
  { path: 'project/:id/:title', component: ProjectComponent, canActivate: [AuthGuard] },
  { path: 'new/project', component: NewProjectComponent, canActivate: [AuthGuard, AdminGuard] },
  { path: 'editor/:projectId/:title/:segmentId', component: EditorComponent, canActivate: [AuthGuard], canDeactivate: [SaveGuard] },
  { path: '**', component: ErrorComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ProjectsComponent,
    ProjectComponent,
    NewProjectComponent,
    EditorComponent,
    ErrorComponent,
    ProjectsMenuComponent,
    TitlePipe
  ],
  imports: [
    [RouterModule.forRoot(routes)],
    BrowserModule,
    HttpClientModule,
    PdfViewerModule,
    FormsModule
  ],
  exports: [
    RouterModule
  ],
  providers: [
    AuthGuard,
    ApiService,
    SaveGuard,
    AdminGuard
  ],
  bootstrap: [AppComponent]
})

export class AppModule { }
