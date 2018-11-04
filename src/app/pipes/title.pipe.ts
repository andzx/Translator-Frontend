import { Pipe } from '@angular/core';
import { PipeTransform } from '@angular/core';

@Pipe({name: 'title'})
export class TitlePipe implements PipeTransform {

    transform(value: any) {
        if (value) {
            value = value.replace(/-/g, ' ');
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
        return value;
    }

}
