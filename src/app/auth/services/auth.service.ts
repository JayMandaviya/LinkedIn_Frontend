import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, from, Observable, of } from 'rxjs';
import { map, switchMap, take, tap } from 'rxjs/operators';

import jwt_decode from 'jwt-decode';

import { environment } from 'src/environments/environment';

import { NewUser } from '../models/newUser.model';
import { Role, User } from '../models/user.model';
import { UserResponse } from '../models/userResponse.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user$ = new BehaviorSubject<User | any>(null);

  private httpOptions: { headers: HttpHeaders } = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  get userStream(): Observable<User> {
    return this.user$.asObservable();
  }

  get isUserLoggedIn(): Observable<boolean> {
    return this.user$.asObservable().pipe(
      switchMap((user: User) => {
        const isUserAuthenticated = user !== null;
        return of(isUserAuthenticated);
      })
    );
  }

  get userRole(): Observable<Role> {
    return this.user$.asObservable().pipe(
      switchMap((user: User) => {
        return of(user?.role);
      })
    );
  }

  get userId(): Observable<number> {
    return this.user$.asObservable().pipe(
      switchMap((user: User) => {
        return of(user.id);
      })
    );
  }

  get userFullName(): Observable<string | any> {
    return this.user$.asObservable().pipe(
      map((user: User) => {
        if (!user) {
          return of(null);
        }
        const fullName = user.firstName + ' ' + user.lastName;
         console.log(fullName);
        return (fullName);
        
      })
    );
  }

  get userFullImagePath(): Observable<string> {
    return this.user$.asObservable().pipe(
      switchMap((user: User) => {
        const doesAuthorHaveImage = !!user?.imagePath;
        let fullImagePath = this.getDefaultFullImagePath();
        if (doesAuthorHaveImage && user.imagePath) {
          fullImagePath = this.getFullImagePath(user.imagePath);
        }
        return of(fullImagePath);
      })
    );
  }

  constructor(private http: HttpClient, private router: Router) {}

  getDefaultFullImagePath(): string {
    return 'http://localhost:3000/api/feed/image/pp.jpeg';
  }

  getFullImagePath(imageName: string): string {
    return 'http://localhost:3000/api/feed/image/' + imageName;
  }

  getUserImage() {
    return this.http.get(`${environment.baseApiUrl}/user/image`).pipe(take(1));
  }

  getUserImageName(): Observable<{ imageName: string }> {
    return this.http
      .get<{ imageName: string }>(`${environment.baseApiUrl}/user/image-name`)
      .pipe(take(1));
  }

  updateUserImagePath(imagePath: string): Observable<User> {
    return this.user$.pipe(
      take(1),
      map((user: User) => {
        user.imagePath = imagePath;
        this.user$.next(user);
        return user;
      })
    );
  }

  uploadUserImage(
    formData: FormData
  ): Observable<{ modifiedFileName: string }> {
    return this.http
      .post<{ modifiedFileName: string }>(
        `${environment.baseApiUrl}/user/upload`,
        formData
      )
      .pipe(
        tap(({ modifiedFileName }) => {
          let user = this.user$.value;
          user.imagePath = modifiedFileName;
          this.user$.next(user);
        })
      );
  }

  register(newUser: NewUser): Observable<User> {
    return this.http
      .post<User>(
        `${environment.baseApiUrl}/auth/register`,
        newUser,
        this.httpOptions
      )
      .pipe(take(1));
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(
        `${environment.baseApiUrl}/auth/login`,
        { email, password },
        this.httpOptions
      )
      .pipe(
        take(1),
        tap((response: { token: string }) => {
          if (window.localStorage) {
            window.localStorage.setItem('token', response.token);
          }
          const decodedToken: UserResponse = jwt_decode(response.token);
          this.user$.next(decodedToken.user);
        })
      );
  }

  isTokenInStorage(): Observable<boolean> {
    const token = localStorage.getItem('token');

    if (!token) {
      return of(false);
    }

    const decodedToken: UserResponse = jwt_decode(token);
    const jwtExpirationInMsSinceUnixEpoch = decodedToken.exp * 1000;
    const isExpired = new Date() > new Date(jwtExpirationInMsSinceUnixEpoch);

    if (isExpired) {
      localStorage.removeItem('token');
      return of(false);
    }

    if (decodedToken.user) {
      this.user$.next(decodedToken.user);
      return of(true);
    }

    return of(false);
  }

  logout(): void {
    this.user$.next(null);
    localStorage.removeItem('token');
    this.router.navigateByUrl('/auth');
  }
}
