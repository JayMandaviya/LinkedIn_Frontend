import { Component, OnDestroy, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { PopoverComponent } from './popover/popover.component';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  userFullImagePath!: string;
  private userImagePathSubscription!: Subscription;

  constructor(
    public popoverController: PopoverController,
    private authService: AuthService
  ) {}

  roleMsg = '';
  ngOnInit() {
    this.userImagePathSubscription =
    this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
      this.userFullImagePath = fullImagePath;
    });
  }

  async presentPopover(e: Event) {
    const popover = await this.popoverController.create({
      component: PopoverComponent,
      cssClass: 'my-custom-class',
      event: e,
      showBackdrop: false,
    });

    await popover.present();

    const { role } = await popover.onDidDismiss();
    this.roleMsg = `Popover dismissed with role: ${role}`;
  }

  ngOnDestroy() {
    this.userImagePathSubscription.unsubscribe();
  }
}
