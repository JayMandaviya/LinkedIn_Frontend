import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { FileTypeResult } from 'file-type';
import { fromBuffer } from 'file-type/core';
import { BehaviorSubject, from, of, Subscription } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';
import { OperatorFunction } from 'rxjs';
import { Role, User } from 'src/app/auth/models/user.model';
import { AuthService } from 'src/app/auth/services/auth.service';
import { BannerColorService } from '../../services/banner-color.service';
import { filter } from 'rxjs/operators';

type validFileExtension = 'png' | 'jpg' | 'jpeg';
type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg';

@Component({
  selector: 'app-profile-summary',
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.scss'],
})
export class ProfileSummaryComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  validFileExtensions: validFileExtension[] = ['png', 'jpg', 'jpeg'];
  validMimeTypes: validMimeType[] = ['image/png', 'image/jpg', 'image/jpeg'];

  userFullImagePath!: string;
  private userImagePathSubscription!: Subscription;

  private userSubscription!: Subscription;

  fullName$ = new BehaviorSubject<string | null>(null);
  fullName = '';

  constructor(
    private authService: AuthService,
    public bannerColorService: BannerColorService
  ) {}

  ngOnInit() {
    this.form = new FormGroup({
      file: new FormControl(null),
    });

    this.userImagePathSubscription =
      this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
      });

    this.userSubscription = this.authService.userStream.subscribe(
      (user: User) => {
        if (user?.role) {
          this.bannerColorService.bannerColors =
            this.bannerColorService.getBannerColors(user.role);
        }

        if (user && user?.firstName && user?.lastName) {
          this.fullName = user.firstName + ' ' + user.lastName;
          this.fullName$.next(this.fullName);
        }
      }
    );

    // this.authService.userFullName
    //   .pipe(take(1))
    //   .subscribe((fullName: string) => {
    //     this.fullName = fullName;
    //     this.fullName$.next(fullName);
    //   });
  }

  onFileSelect(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    const file: File | null = fileInput?.files?.[0] as File | null;
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    const fileToBuffer: OperatorFunction<File, Buffer> = switchMap(
      (file: File) => {
        return new Promise<Buffer>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            if (reader.result instanceof ArrayBuffer) {
              resolve(Buffer.from(reader.result));
            } else {
              reject(new Error('Error converting file to buffer'));
            }
          };
          reader.onerror = () => {
            reject(reader.error);
          };
          reader.readAsArrayBuffer(file);
        });
      }
    );

    from([file])
      .pipe(
        fileToBuffer,
        switchMap((buffer: Buffer) => {
          return from(fromBuffer(buffer)).pipe(
            filter((fileTypeResult: FileTypeResult | any) => !!fileTypeResult),
            switchMap((fileTypeResult: FileTypeResult) => {
              const { ext, mime } = fileTypeResult;
              const isFileTypeLegit = this.validFileExtensions.includes(
                ext as any
              );
              const isMimeTypeLegit = this.validMimeTypes.includes(mime as any);
              const isFileLegit = isFileTypeLegit && isMimeTypeLegit;
              if (!isFileLegit) {
                // TODO: error handling
                console.log({
                  error: 'file format does not match file extension!',
                });
                return of();
              }
              return this.authService.uploadUserImage(formData);
            })
          );
        })
      )
      .subscribe();

    this.form.reset();
  }
  ngOnDestroy() {
    this.userSubscription.unsubscribe();
    this.userImagePathSubscription.unsubscribe();
  }
}
