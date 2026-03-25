import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'shorten'
})
export class ShortenPipe implements PipeTransform {
    transform(value: string, start: number = 0, length: number = 16): string {
        if (!value) return '';
        if (value.length <= length) return value;
        // return value.substring(0, length) + '...';
        return value.replaceAll("-", "").substring(start, length);
    }
}