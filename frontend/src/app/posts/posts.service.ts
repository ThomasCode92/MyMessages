import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { map, Subject } from 'rxjs';

import { Post } from './post.model';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private _posts: Post[] = [];
  private _postsUpdated = new Subject<Post[]>();

  constructor(private http: HttpClient, private router: Router) {}

  public get posts() {
    return this.http
      .get<{ message: string; posts: any }>('http://localhost:3000/api/posts')
      .pipe(
        map(responseData => {
          return {
            message: responseData.message,
            posts: responseData.posts.map(post => {
              return {
                id: post._id,
                title: post.title,
                content: post.content,
              };
            }),
          };
        })
      )
      .subscribe(postsData => {
        console.log(postsData.message);

        this._posts = postsData.posts;
        this._postsUpdated.next([...this._posts]);
      });
  }

  public get postsUpdated() {
    return this._postsUpdated.asObservable();
  }

  getPost(postId: string) {
    return this.http
      .get<{ message: string; post: any }>(
        'http://localhost:3000/api/posts/' + postId
      )
      .pipe<{ message: string; post: Post }>(
        map(responseData => {
          return {
            message: responseData.message,
            post: {
              id: responseData.post._id,
              title: responseData.post.title,
              content: responseData.post.content,
            },
          };
        })
      );
  }

  addPost(title: string, content: string, image: File) {
    const postData = new FormData();

    postData.append('title', title);
    postData.append('content', content);
    postData.append('image', image, title);

    console.log(postData.get('image'));

    this.http
      .post<{ message: string; postId: string }>(
        'http://localhost:3000/api/posts',
        postData
      )
      .subscribe(responseData => {
        console.log(responseData.message);

        const id = responseData.postId;
        const post: Post = { id, title, content };

        post.id = id;
        this._posts.push(post);
        this._postsUpdated.next([...this._posts]);

        this.router.navigate(['/']);
      });
  }

  updatePost(postId: string, title: string, content: string) {
    const post: Post = { id: postId, title: title, content: content };

    this.http
      .put<{ message: string }>(
        'http://localhost:3000/api/posts/' + postId,
        post
      )
      .subscribe(responseData => {
        console.log(responseData);

        const updatedPosts = [...this._posts];
        const oldPostIndex = updatedPosts.findIndex(post => post.id === postId);

        updatedPosts[oldPostIndex] = post;

        this._posts = updatedPosts;
        this._postsUpdated.next([...this._posts]);

        this.router.navigate(['/']);
      });
  }

  deletePost(postId: string) {
    this.http
      .delete<{ message: string }>('http://localhost:3000/api/posts/' + postId)
      .subscribe(responseData => {
        console.log(responseData.message);

        const updatedPosts = this._posts.filter(post => post.id !== postId);

        this._posts = updatedPosts;
        this._postsUpdated.next([...this._posts]);
      });
  }
}
