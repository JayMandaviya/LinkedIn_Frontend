import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, Subscription, take } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-popover',
  templateUrl: './popover.component.html',
  styleUrls: ['./popover.component.scss'],
})
export class PopoverComponent implements OnInit, OnDestroy {
  userFullImagePath!: string;
  private userImagePathSubscription!: Subscription;

  fullName$ = new BehaviorSubject<string | null>(null);
  fullName = '';

  
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.userImagePathSubscription =
    this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
      this.userFullImagePath = fullImagePath;
    });

     this.authService.userFullName
      .subscribe((fullName: string) => {
        this.fullName = fullName;
        this.fullName$.next(fullName);
        // console.log("hii", fullName);
        
      });
  }

  onSignOut() {
    this.authService.logout();
  }

  ngOnDestroy() {
    this.userImagePathSubscription.unsubscribe();
  }
}
