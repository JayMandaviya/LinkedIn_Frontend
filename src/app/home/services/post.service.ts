import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Post } from '../models/post';
import { environment } from 'src/environments/environment';
import { take, tap } from 'rxjs/operators';
import { AuthService } from 'src/app/auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class PostService {
  constructor(private http: HttpClient, private authService: AuthService) {
    this.authService
      .getUserImageName()
      .pipe(
        take(1),
        tap(({ imageName }) => {
          console.log(22, imageName);

          const defaultImagePath = 'pp.jpeg';

          this.authService
            .updateUserImagePath(imageName || defaultImagePath)
            .subscribe();
        })
      )
      .subscribe();
  }

  private httpOptions: { headers: HttpHeaders } = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  getSelectedPosts(params: string) {
    return this.http.get<Post[]>(`${environment.baseApiUrl}/feed${params}`);
  }

  createPost(body: string) {
    return this.http
      .post<Post>(`${environment.baseApiUrl}/feed`, { body }, this.httpOptions)
      .pipe(take(1));
  }

  updatePost(postId: number, body: string) {
    return this.http
      .put(
        `${environment.baseApiUrl}/feed/${postId}`,
        { body },
        this.httpOptions
      )
      .pipe(take(1));
  }

  deletePost(postId: number) {
    return this.http
      .delete(`${environment.baseApiUrl}/feed/${postId}`)
      .pipe(take(1));
  }
}
