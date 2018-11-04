import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs/Observable';


export interface ComponentCanDeactivate {
    canDeactivate: () => boolean | Observable<boolean>;
}

export class SaveGuard implements CanDeactivate<ComponentCanDeactivate> {
    canDeactivate(component: ComponentCanDeactivate): boolean | Observable<boolean> {
        return component.canDeactivate() ?
        true :
        confirm('Are you sure you wish to leave the page without saving the changes?');
    }
}
