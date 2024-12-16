import { Pipe, PipeTransform } from "@angular/core";

@Pipe({
  name: "absoluteValue",
  standalone: true
})
export class AbsoluteValuePipe implements PipeTransform {

  transform(value: number): number {
    return Math.abs(value);
  }
}
