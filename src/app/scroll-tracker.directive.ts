import { Directive, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[scrollTracker]'
})
export class ScrollTrackerDirective {

  @Output() scrolled = new EventEmitter<any>();

  @HostListener('scroll', ['$event'])
  onScroll(event) {
    // do tracking
    // console.log('scrolled', event.target.scrollTop);
    // Listen to click events in the component
    let tracker = event.target;
    let endReached = false;
    let limit = tracker.scrollHeight - tracker.clientHeight;
    
    //console.log(event.target.scrollTop, limit);
    if (event.target.scrollTop === limit) {
      //alert('end reached');
      endReached = true;
    }

    this.scrolled.emit({
      pos: event.target.scrollTop,
      endReached
    })
  }

}